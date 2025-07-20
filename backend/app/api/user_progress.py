from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json

from ..database import get_db
from ..models import UserProgress
from ..schemas import UserProgressCreate, UserProgressResponse

router = APIRouter()

@router.get("/{session_id}", response_model=Dict[str, Any])
def get_user_progress(session_id: str, db: Session = Depends(get_db)):
    progress = db.query(UserProgress).filter(UserProgress.session_id == session_id).all()
    result = {}
    
    # AI 정보 학습 기록
    for p in progress:
        if p.learned_info and not p.date.startswith('__'):
            result[p.date] = json.loads(p.learned_info)
    
    # 통계 정보 추가
    stats_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date == '__stats__'
    ).first()
    
    if stats_progress and stats_progress.stats:
        try:
            stats = json.loads(stats_progress.stats)
            result.update(stats)
        except json.JSONDecodeError:
            pass
    
    return result

@router.post("/{session_id}/{date}/{info_index}")
def update_user_progress(session_id: str, date: str, info_index: int, db: Session = Depends(get_db)):
    """사용자의 학습 진행상황을 업데이트하고 통계를 계산합니다."""
    progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id, 
        UserProgress.date == date
    ).first()
    
    if progress:
        learned = json.loads(progress.learned_info) if progress.learned_info else []
        if info_index not in learned:
            learned.append(info_index)
            progress.learned_info = json.dumps(learned)
    else:
        learned = [info_index]
        progress = UserProgress(
            session_id=session_id, 
            date=date, 
            learned_info=json.dumps(learned), 
            stats=None
        )
        db.add(progress)
    
    db.commit()
    
    # 통계 업데이트
    update_user_statistics(session_id, db)
    
    return {"message": "Progress updated successfully", "achievement_gained": True}

@router.post("/term-progress/{session_id}")
def update_term_progress(session_id: str, term_data: dict, db: Session = Depends(get_db)):
    """용어 학습 진행상황을 업데이트합니다."""
    term = term_data.get('term', '')
    date = term_data.get('date', '')
    info_index = term_data.get('info_index', 0)
    
    # 용어 학습 기록 저장
    term_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date == f'__terms__{date}_{info_index}'
    ).first()
    
    if not term_progress:
        term_progress = UserProgress(
            session_id=session_id,
            date=f'__terms__{date}_{info_index}',
            learned_info=json.dumps([term]),
            stats=None
        )
        db.add(term_progress)
    else:
        learned_terms = json.loads(term_progress.learned_info) if term_progress.learned_info else []
        if term not in learned_terms:
            learned_terms.append(term)
            term_progress.learned_info = json.dumps(learned_terms)
    
    db.commit()
    
    # 통계 업데이트
    update_user_statistics(session_id, db)
    
    return {"message": "Term progress updated successfully", "achievement_gained": True}

def update_user_statistics(session_id: str, db: Session):
    """사용자의 통계를 계산하고 업데이트합니다."""
    # AI 정보 학습 기록 가져오기
    ai_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        ~UserProgress.date.like('__%')
    ).all()
    
    # 용어 학습 기록 가져오기
    terms_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date.like('__terms__%')
    ).all()
    
    total_learned = 0
    total_terms_learned = 0
    learned_dates = []
    
    # AI 정보 학습 통계
    for p in ai_progress:
        if p.learned_info:
            try:
                learned_data = json.loads(p.learned_info)
                total_learned += len(learned_data)
                learned_dates.append(p.date)
            except json.JSONDecodeError:
                continue
    
    # 용어 학습 통계
    for p in terms_progress:
        if p.learned_info:
            try:
                learned_data = json.loads(p.learned_info)
                total_terms_learned += len(learned_data)
            except json.JSONDecodeError:
                continue
    
    # 연속 학습일 계산
    streak_days = 0
    last_learned_date = None
    
    if learned_dates:
        # 날짜 정렬
        learned_dates.sort()
        last_learned_date = learned_dates[-1]
        
        # 연속 학습일 계산
        current_date = last_learned_date
        streak_count = 0
        
        while current_date in learned_dates:
            streak_count += 1
            # 이전 날짜 계산
            from datetime import datetime, timedelta
            current_dt = datetime.strptime(current_date, '%Y-%m-%d')
            current_dt = current_dt - timedelta(days=1)
            current_date = current_dt.strftime('%Y-%m-%d')
        
        streak_days = streak_count
    
    # 기존 통계 가져오기
    stats_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date == '__stats__'
    ).first()
    
    current_stats = {}
    if stats_progress and stats_progress.stats:
        try:
            current_stats = json.loads(stats_progress.stats)
        except json.JSONDecodeError:
            current_stats = {}
    
    # 새로운 통계 (용어 학습 포함)
    new_stats = {
        'total_learned': total_learned,
        'total_terms_learned': total_terms_learned,
        'total_terms_available': total_terms_learned,  # 프론트엔드 호환성
        'streak_days': streak_days,
        'max_streak': current_stats.get('max_streak', streak_days),  # 최대 연속일
        'last_learned_date': last_learned_date,
        'quiz_score': current_stats.get('quiz_score', 0),
        'achievements': current_stats.get('achievements', [])
    }
    
    # 통계 저장
    if stats_progress:
        stats_progress.stats = json.dumps(new_stats)
    else:
        stats_progress = UserProgress(
            session_id=session_id,
            date='__stats__',
            learned_info=None,
            stats=json.dumps(new_stats)
        )
        db.add(stats_progress)
    
    db.commit()

@router.get("/stats/{session_id}")
def get_user_stats(session_id: str, db: Session = Depends(get_db)):
    progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id, 
        UserProgress.date == '__stats__'
    ).first()
    
    # 오늘 날짜
    from datetime import datetime
    today = datetime.now().strftime('%Y-%m-%d')
    
    # 오늘 학습 데이터 가져오기
    today_ai_info = 0
    today_terms = 0
    today_quiz_score = 0
    today_quiz_correct = 0
    today_quiz_total = 0
    
    # 오늘 AI 정보 학습 수
    today_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date == today
    ).first()
    
    if today_progress and today_progress.learned_info:
        try:
            today_ai_info = len(json.loads(today_progress.learned_info))
        except json.JSONDecodeError:
            today_ai_info = 0
    
    # 오늘 용어 학습 수
    today_terms_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date.like(f'__terms__{today}%')
    ).all()
    
    for term_progress in today_terms_progress:
        if term_progress.learned_info:
            try:
                today_terms += len(json.loads(term_progress.learned_info))
            except json.JSONDecodeError:
                continue
    
    # 오늘 퀴즈 점수 누적 계산
    today_quiz_correct = 0
    today_quiz_total = 0
    today_quiz_score = 0
    
    # 오늘 날짜의 모든 퀴즈 기록 가져오기
    today_quiz_progress_list = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date.like(f'__quiz__{today}%')
    ).all()
    
    for quiz_progress in today_quiz_progress_list:
        if quiz_progress.stats:
            try:
                quiz_data = json.loads(quiz_progress.stats)
                today_quiz_correct += quiz_data.get('correct', 0)
                today_quiz_total += quiz_data.get('total', 0)
            except json.JSONDecodeError:
                continue
    
    # 오늘 누적 퀴즈 점수 계산
    today_quiz_score = int((today_quiz_correct / today_quiz_total) * 100) if today_quiz_total > 0 else 0
    
    # 전체 누적 퀴즈 통계 계산
    total_quiz_correct = 0
    total_quiz_questions = 0
    
    # 모든 퀴즈 기록 가져오기
    all_quiz_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date.like('__quiz__%')
    ).all()
    
    for quiz_progress in all_quiz_progress:
        if quiz_progress.stats:
            try:
                quiz_data = json.loads(quiz_progress.stats)
                total_quiz_correct += quiz_data.get('correct', 0)
                total_quiz_questions += quiz_data.get('total', 0)
            except json.JSONDecodeError:
                continue
    
    # 전체 누적 퀴즈 점수 계산
    cumulative_quiz_score = int((total_quiz_correct / total_quiz_questions) * 100) if total_quiz_questions > 0 else 0
    
    # 총 AI 정보 수 계산 (모든 날짜의 AI 정보 수)
    total_ai_info_available = 0
    all_ai_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        ~UserProgress.date.like('__%')
    ).all()
    
    for p in all_ai_progress:
        if p.learned_info:
            try:
                learned_data = json.loads(p.learned_info)
                total_ai_info_available += len(learned_data)
            except json.JSONDecodeError:
                continue
    
    # 총 용어 수 계산 (모든 날짜의 용어 수)
    total_terms_available = 0
    all_terms_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date.like('__terms__%')
    ).all()
    
    for p in all_terms_progress:
        if p.learned_info:
            try:
                learned_data = json.loads(p.learned_info)
                total_terms_available += len(learned_data)
            except json.JSONDecodeError:
                continue
    
    if progress and progress.stats:
        stats = json.loads(progress.stats)
        stats.update({
            'today_ai_info': today_ai_info,
            'today_terms': today_terms,
            'today_quiz_score': today_quiz_score,
            'today_quiz_correct': today_quiz_correct,
            'today_quiz_total': today_quiz_total,
            'total_ai_info_available': total_ai_info_available,
            'total_terms_available': total_terms_available,
            'cumulative_quiz_score': cumulative_quiz_score,
            'total_quiz_correct': total_quiz_correct,
            'total_quiz_questions': total_quiz_questions
        })
        return stats
    
    return {
        'total_learned': 0,
        'streak_days': 0,
        'last_learned_date': None,
        'quiz_score': 0,
        'achievements': [],
        'today_ai_info': today_ai_info,
        'today_terms': today_terms,
        'today_quiz_score': today_quiz_score,
        'today_quiz_correct': today_quiz_correct,
        'today_quiz_total': today_quiz_total,
        'total_ai_info_available': total_ai_info_available,
        'total_terms_available': total_terms_available,
        'cumulative_quiz_score': cumulative_quiz_score,
        'total_quiz_correct': total_quiz_correct,
        'total_quiz_questions': total_quiz_questions
    }

@router.post("/stats/{session_id}")
def update_user_stats(session_id: str, stats: Dict[str, Any], db: Session = Depends(get_db)):
    progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id, 
        UserProgress.date == '__stats__'
    ).first()
    
    if progress:
        progress.stats = json.dumps(stats)
    else:
        progress = UserProgress(
            session_id=session_id, 
            date='__stats__', 
            learned_info=None, 
            stats=json.dumps(stats)
        )
        db.add(progress)
    
    db.commit()
    return {"message": "Stats updated successfully"}

@router.post("/quiz-score/{session_id}")
def update_quiz_score(session_id: str, score_data: dict, db: Session = Depends(get_db)):
    """퀴즈 점수를 업데이트합니다."""
    score = score_data.get('score', 0)
    total_questions = score_data.get('total_questions', 1)
    
    # 점수 계산 (백분율)
    quiz_score = int((score / total_questions) * 100) if total_questions > 0 else 0
    
    # 오늘 날짜
    from datetime import datetime
    today = datetime.now().strftime('%Y-%m-%d')
    
    # 오늘 퀴즈 세션 번호 찾기
    existing_quiz_sessions = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date.like(f'__quiz__{today}%')
    ).count()
    
    session_number = existing_quiz_sessions + 1
    
    # 오늘 퀴즈 상세 정보 저장 (세션 번호 포함)
    today_quiz_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date == f'__quiz__{today}_{session_number}'
    ).first()
    
    quiz_detail = {
        'correct': score,
        'total': total_questions,
        'score': quiz_score
    }
    
    if today_quiz_progress:
        today_quiz_progress.stats = json.dumps(quiz_detail)
    else:
        today_quiz_progress = UserProgress(
            session_id=session_id,
            date=f'__quiz__{today}_{session_number}',
            learned_info=None,
            stats=json.dumps(quiz_detail)
        )
        db.add(today_quiz_progress)
    
    # 기존 통계 가져오기
    stats_progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.date == '__stats__'
    ).first()
    
    current_stats = {}
    if stats_progress and stats_progress.stats:
        try:
            current_stats = json.loads(stats_progress.stats)
        except json.JSONDecodeError:
            current_stats = {}
    
    # 새로운 통계 (퀴즈 점수 업데이트)
    new_stats = {
        'total_learned': current_stats.get('total_learned', 0),
        'streak_days': current_stats.get('streak_days', 0),
        'last_learned_date': current_stats.get('last_learned_date'),
        'quiz_score': quiz_score,
        'achievements': current_stats.get('achievements', [])
    }
    
    # 통계 저장
    if stats_progress:
        stats_progress.stats = json.dumps(new_stats)
    else:
        stats_progress = UserProgress(
            session_id=session_id,
            date='__stats__',
            learned_info=None,
            stats=json.dumps(new_stats)
        )
        db.add(stats_progress)
    
    db.commit()
    
    # 성취 확인
    check_achievements(session_id, db)
    
    return {"message": "Quiz score updated successfully", "quiz_score": quiz_score}

@router.get("/achievements/{session_id}")
def check_achievements(session_id: str, db: Session = Depends(get_db)):
    """사용자의 성취를 확인하고 업데이트합니다."""
    stats = get_user_stats(session_id, db)
    achievements = stats.get('achievements', [])
    new_achievements = []
    
    # AI 정보 학습 성취
    if stats['total_learned'] >= 1 and 'first_learn' not in achievements:
        new_achievements.append('first_learn')
        achievements.append('first_learn')
    
    if stats['total_learned'] >= 3 and 'beginner' not in achievements:
        new_achievements.append('beginner')
        achievements.append('beginner')
    
    if stats['total_learned'] >= 5 and 'learner' not in achievements:
        new_achievements.append('learner')
        achievements.append('learner')
    
    if stats['total_learned'] >= 10 and 'first_10' not in achievements:
        new_achievements.append('first_10')
        achievements.append('first_10')
    
    if stats['total_learned'] >= 20 and 'knowledge_seeker' not in achievements:
        new_achievements.append('knowledge_seeker')
        achievements.append('knowledge_seeker')
    
    if stats['total_learned'] >= 50 and 'first_50' not in achievements:
        new_achievements.append('first_50')
        achievements.append('first_50')
    
    # 용어 학습 성취
    if stats.get('total_terms_learned', 0) >= 1 and 'first_term' not in achievements:
        new_achievements.append('first_term')
        achievements.append('first_term')
    
    if stats.get('total_terms_learned', 0) >= 5 and 'term_collector' not in achievements:
        new_achievements.append('term_collector')
        achievements.append('term_collector')
    
    if stats.get('total_terms_learned', 0) >= 10 and 'term_master' not in achievements:
        new_achievements.append('term_master')
        achievements.append('term_master')
    
    # 연속 학습 성취
    if stats['streak_days'] >= 3 and 'three_day_streak' not in achievements:
        new_achievements.append('three_day_streak')
        achievements.append('three_day_streak')
    
    if stats['streak_days'] >= 7 and 'week_streak' not in achievements:
        new_achievements.append('week_streak')
        achievements.append('week_streak')
    
    if stats['streak_days'] >= 14 and 'two_week_streak' not in achievements:
        new_achievements.append('two_week_streak')
        achievements.append('two_week_streak')
    
    # 퀴즈 성취
    if stats['quiz_score'] >= 60 and 'quiz_beginner' not in achievements:
        new_achievements.append('quiz_beginner')
        achievements.append('quiz_beginner')
    
    if stats['quiz_score'] >= 80 and 'quiz_master' not in achievements:
        new_achievements.append('quiz_master')
        achievements.append('quiz_master')
    
    if stats['quiz_score'] >= 100 and 'perfect_quiz' not in achievements:
        new_achievements.append('perfect_quiz')
        achievements.append('perfect_quiz')
    
    # 새로운 성취가 있으면 업데이트
    if new_achievements:
        stats['achievements'] = achievements
        update_user_stats(session_id, stats, db)
    
    return {
        "current_achievements": achievements,
        "new_achievements": new_achievements
    }

@router.get("/period-stats/{session_id}")
def get_period_stats(session_id: str, start_date: str, end_date: str, db: Session = Depends(get_db)):
    """특정 기간의 학습 통계를 가져옵니다."""
    from datetime import datetime, timedelta
    
    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # 기간 내 모든 날짜 생성
    date_list = []
    current_dt = start_dt
    while current_dt <= end_dt:
        date_list.append(current_dt.strftime('%Y-%m-%d'))
        current_dt += timedelta(days=1)
    
    period_data = []
    
    for date in date_list:
        # AI 정보 학습 수
        ai_progress = db.query(UserProgress).filter(
            UserProgress.session_id == session_id,
            UserProgress.date == date
        ).first()
        
        ai_count = 0
        if ai_progress and ai_progress.learned_info:
            try:
                ai_count = len(json.loads(ai_progress.learned_info))
            except json.JSONDecodeError:
                pass
        
        # 용어 학습 수 - 날짜별로 그룹핑하여 중복 제거
        terms_progress = db.query(UserProgress).filter(
            UserProgress.session_id == session_id,
            UserProgress.date.like(f'__terms__{date}%')
        ).all()
        
        terms_count = 0
        unique_terms = set()  # 중복 제거를 위한 set
        
        for term_progress in terms_progress:
            if term_progress.learned_info:
                try:
                    terms = json.loads(term_progress.learned_info)
                    unique_terms.update(terms)  # 중복 제거
                except json.JSONDecodeError:
                    continue
        
        terms_count = len(unique_terms)
        
        # 퀴즈 점수
        quiz_progress = db.query(UserProgress).filter(
            UserProgress.session_id == session_id,
            UserProgress.date.like(f'__quiz__{date}%')
        ).all()
        
        quiz_score = 0
        quiz_correct = 0
        quiz_total = 0
        
        for quiz_progress in quiz_progress:
            if quiz_progress.stats:
                try:
                    quiz_data = json.loads(quiz_progress.stats)
                    quiz_correct += quiz_data.get('correct', 0)
                    quiz_total += quiz_data.get('total', 0)
                except json.JSONDecodeError:
                    continue
        
        if quiz_total > 0:
            quiz_score = int((quiz_correct / quiz_total) * 100)
        
        period_data.append({
            'date': date,
            'ai_info': ai_count,
            'terms': terms_count,
            'quiz_score': quiz_score,
            'quiz_correct': quiz_correct,
            'quiz_total': quiz_total
        })
    
    return {
        'period_data': period_data,
        'start_date': start_date,
        'end_date': end_date,
        'total_days': len(period_data)
    } 
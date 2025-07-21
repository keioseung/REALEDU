'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, BookOpen, Target, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUserStats } from '@/hooks/use-user-progress'
import { userProgressAPI } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, DotProps } from 'recharts'
import { FaRobot, FaBookOpen, FaCheckCircle } from 'react-icons/fa';


interface ProgressSectionProps {
  sessionId: string
  selectedDate?: string
  onDateChange?: (date: string) => void
}

interface PeriodData {
  date: string
  ai_info: number
  terms: number
  quiz_score: number
  quiz_correct: number
  quiz_total: number
}

interface PeriodStats {
  period_data: PeriodData[]
  start_date: string
  end_date: string
  total_days: number
}

function ProgressSection({ sessionId, selectedDate, onDateChange }: ProgressSectionProps) {
  // 외부에서 전달받은 selectedDate를 직접 사용
  const [periodType, setPeriodType] = useState<'week' | 'month' | 'custom'>('week')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const { data: stats } = useUserStats(sessionId)

  // 기간별 데이터 계산
  const getPeriodDates = () => {
    const today = new Date()
    const startDate = new Date()
    
    switch (periodType) {
      case 'week':
        startDate.setDate(today.getDate() - 6)
        break
      case 'month':
        startDate.setDate(today.getDate() - 29)
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          return { start: customStartDate, end: customEndDate }
        }
        startDate.setDate(today.getDate() - 6)
        break
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    }
  }

  const periodDates = getPeriodDates()

  const { data: periodStats } = useQuery<PeriodStats>({
    queryKey: ['period-stats', sessionId, periodDates.start, periodDates.end],
    queryFn: async () => {
      const response = await userProgressAPI.getPeriodStats(sessionId, periodDates.start, periodDates.end)
      return response.data
    },
    enabled: !!sessionId && !!periodDates.start && !!periodDates.end,
  })

  // 날짜 변경 핸들러 - 상위 컴포넌트에 알림
  const handleDateChange = (date: string) => {
    console.log('진행률 탭 - 날짜 변경:', date)
    onDateChange?.(date)
  }

  // 기간 변경 핸들러
  const handlePeriodChange = (type: 'week' | 'month' | 'custom') => {
    console.log('진행률 탭 - 기간 변경:', type)
    setPeriodType(type)
    if (type === 'custom') {
      const today = new Date()
      const weekAgo = new Date()
      weekAgo.setDate(today.getDate() - 6)
      setCustomStartDate(weekAgo.toISOString().split('T')[0])
      setCustomEndDate(today.toISOString().split('T')[0])
    }
  }

  // 커스텀 날짜 변경 핸들러
  const handleCustomStartDateChange = (date: string) => {
    console.log('진행률 탭 - 시작 날짜 변경:', date)
    setCustomStartDate(date)
  }

  const handleCustomEndDateChange = (date: string) => {
    console.log('진행률 탭 - 종료 날짜 변경:', date)
    setCustomEndDate(date)
  }

  // 그래프 데이터 준비 - 중복 제거 및 정렬
  const chartData = periodStats?.period_data || [];

  // 날짜별로 중복 제거하고 정렬
  const uniqueChartData = chartData.reduce((acc: PeriodData[], current: PeriodData) => {
    const existingIndex = acc.findIndex(item => item.date === current.date)
    if (existingIndex === -1) {
      acc.push(current)
    } else {
      // 중복된 날짜가 있으면 더 높은 값을 사용
      acc[existingIndex] = {
        ...acc[existingIndex],
        ai_info: Math.max(acc[existingIndex].ai_info, current.ai_info),
        terms: Math.max(acc[existingIndex].terms, current.terms),
        quiz_score: Math.max(acc[existingIndex].quiz_score, current.quiz_score),
        quiz_correct: Math.max(acc[existingIndex].quiz_correct, current.quiz_correct),
        quiz_total: Math.max(acc[existingIndex].quiz_total, current.quiz_total)
      }
    }
    return acc
  }, []).sort((a: PeriodData, b: PeriodData) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // --- 퍼센트 변환 및 빈 날짜 채우기 ---
  // 전체 기간 날짜 배열 생성
  function getDateRangeArray(start: string, end: string) {
    const arr = [];
    let dt = new Date(start);
    const endDt = new Date(end);
    while (dt <= endDt) {
      arr.push(dt.toISOString().split('T')[0]);
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  }
  const dateArr = (periodStats?.start_date && periodStats?.end_date)
    ? getDateRangeArray(periodStats.start_date, periodStats.end_date)
    : [];
  // 각 날짜별로 고정된 분모 사용
  const totalAI = 3;
  const totalTerms = 60;
  // 날짜별 데이터 매핑 (없으면 0)
  const percentChartData = dateArr.map(date => {
    const found = uniqueChartData.find(d => d.date === date);
    // 퀴즈 퍼센트 계산: 정답/총문제 * 100
    let quizPercent = 0;
    if (found && found.quiz_total > 0) {
      quizPercent = Math.round((found.quiz_correct / found.quiz_total) * 100);
    }
    return {
      date,
      ai_percent: found ? Math.round((found.ai_info / totalAI) * 100) : 0,
      terms_percent: found ? Math.round((found.terms / totalTerms) * 100) : 0,
      quiz_score: quizPercent,
    };
  });
  
  const maxAI = Math.max(...uniqueChartData.map((d: PeriodData) => d.ai_info), 1)
  const maxTerms = Math.max(...uniqueChartData.map((d: PeriodData) => d.terms), 1)
  const maxQuiz = Math.max(...uniqueChartData.map((d: PeriodData) => d.quiz_score), 1)

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          borderRadius: 16,
          padding: '16px 20px',
          boxShadow: '0 4px 24px 0 rgba(80,80,180,0.15)',
          color: '#fff',
          minWidth: 120,
          fontWeight: 600,
          fontSize: 15,
          border: '1.5px solid #6366f1',
        }}>
          <div style={{marginBottom: 8, fontWeight: 700, color: '#a5b4fc'}}>{label}</div>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} style={{display: 'flex', alignItems: 'center', marginBottom: 4}}>
              <span style={{display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: entry.color, marginRight: 8}}></span>
              {entry.name}: <span style={{marginLeft: 6, fontWeight: 700}}>{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  // 커스텀 마커 (입체+glow)
  const CustomDot = (props: DotProps & { color: string }) => {
    const { cx, cy, color } = props;
    return (
      <g>
        <circle cx={cx} cy={cy} r={12} fill={color} fillOpacity={0.12} filter="url(#glow)" />
        <circle cx={cx} cy={cy} r={7} fill={color} stroke="#fff" strokeWidth={2} />
      </g>
    );
  };

  // 애니메이션 mount 시 한 번만
  const didAnimate = useRef(false);
  const [animationActive, setAnimationActive] = useState(true);
  useEffect(() => {
    if (!didAnimate.current) {
      setTimeout(() => setAnimationActive(false), 1400); // 1.4초 후 애니메이션 비활성화
      didAnimate.current = true;
    }
  }, []);

  // 날짜 포맷 함수 (예: 2024-06-01 → 6/1(토))
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const week = ['일','월','화','수','목','금','토'][d.getDay()];
    return `${month}/${day}(${week})`;
  };
  // X축 라벨 미리 메모이제이션
  const xLabels = useMemo(() => percentChartData.map(d => formatDateLabel(d.date)), [percentChartData]);

  // 오늘 데이터 추출
  const todayData = percentChartData[percentChartData.length - 1] || { ai_percent: 0, terms_percent: 0, quiz_score: 0 };
  const todayStats = uniqueChartData[uniqueChartData.length - 1] || { ai_info: 0, terms: 0, quiz_correct: 0, quiz_total: 0 };

  return (
    <div className="space-y-8 relative">
      {/* 날짜 및 기간 선택 */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-white/70" />
            <label htmlFor="progress-date" className="text-white/80 text-sm font-medium">
              선택 날짜:
            </label>
            <input
              id="progress-date"
              type="date"
              value={selectedDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                handleDateChange(e.target.value)
              }}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer touch-manipulation relative z-20"
              style={{ 
                colorScheme: 'dark',
                minHeight: '44px',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                position: 'relative',
                zIndex: 9999
              }}
            />
            <button
              type="button"
              onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
              className="ml-2 px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm font-bold shadow border border-white/20 transition-all"
              style={{ minWidth: 50 }}
            >
              오늘
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm font-medium">기간:</span>
            <div className="flex bg-white/10 rounded-lg p-1 relative z-20">
              <button
                type="button"
                onClick={() => {
                  handlePeriodChange('week')
                }}
                onTouchStart={() => {
                  handlePeriodChange('week')
                }}
                className={`px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer touch-manipulation min-w-[70px] min-h-[44px] relative z-30 ${
                  periodType === 'week'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/20 active:bg-white/30'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  position: 'relative',
                  zIndex: 9999
                }}
              >
                주간
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePeriodChange('month')
                }}
                onTouchStart={() => {
                  handlePeriodChange('month')
                }}
                className={`px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer touch-manipulation min-w-[70px] min-h-[44px] relative z-30 ${
                  periodType === 'month'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/20 active:bg-white/30'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  position: 'relative',
                  zIndex: 9999
                }}
              >
                월간
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePeriodChange('custom')
                }}
                onTouchStart={() => {
                  handlePeriodChange('custom')
                }}
                className={`px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer touch-manipulation min-w-[70px] min-h-[44px] relative z-30 ${
                  periodType === 'custom'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/20 active:bg-white/30'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  position: 'relative',
                  zIndex: 9999
                }}
              >
                사용자
              </button>
            </div>
          </div>
        </div>

        {/* 사용자 정의 기간 설정 - 별도 라인에 배치 */}
        {periodType === 'custom' && (
          <div className="flex flex-col gap-3 relative z-20 bg-white/5 rounded-xl p-4 border border-white/10 mt-4">
            <div className="text-center">
              <span className="text-white/80 text-sm font-medium">사용자 정의 기간 설정</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="w-full">
                <label className="block text-white/70 text-xs font-medium mb-2">
                  📅 시작일
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    handleCustomStartDateChange(e.target.value)
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer touch-manipulation relative z-30"
                  style={{ 
                    minHeight: '44px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    position: 'relative',
                    zIndex: 9999
                  }}
                />
              </div>
              <div className="flex items-center justify-center">
                <div className="w-16 h-0.5 bg-white/30 rounded-full"></div>
                <span className="text-white/50 text-xs mx-2">↓</span>
                <div className="w-16 h-0.5 bg-white/30 rounded-full"></div>
              </div>
              <div className="w-full">
                <label className="block text-white/70 text-xs font-medium mb-2">
                  📅 종료일
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    handleCustomEndDateChange(e.target.value)
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer touch-manipulation relative z-30"
                  style={{ 
                    minHeight: '44px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    position: 'relative',
                    zIndex: 9999
                  }}
                />
              </div>
            </div>
            <div className="text-center">
              <span className="text-white/50 text-xs">
                {customStartDate && customEndDate ? 
                  `${customStartDate} ~ ${customEndDate}` : 
                  '시작일과 종료일을 선택해주세요'
                }
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AI 정보 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">AI 정보 학습</h3>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">오늘 학습</span>
              <span className="text-blue-400 font-bold text-lg">
                {stats?.today_ai_info || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">총 학습</span>
              <span className="text-white font-semibold">
                {stats?.total_learned || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">총 정보 수</span>
              <span className="text-white/50 text-sm">
                {stats?.total_ai_info_available || 0}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 용어 학습 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold">용어 학습</h3>
            </div>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">오늘 학습</span>
              <span className="text-purple-400 font-bold text-lg">
                {stats?.today_terms || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">총 학습</span>
              <span className="text-white font-semibold">
                {stats?.total_terms_learned || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">총 용어 수</span>
              <span className="text-white/50 text-sm">
                {stats?.total_terms_available || 0}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 퀴즈 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">퀴즈 점수</h3>
            </div>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">오늘 누적 점수</span>
              <span className="text-green-400 font-bold text-lg">
                {stats?.today_quiz_score || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">오늘 정답률</span>
              <span className="text-white font-semibold">
                {stats?.today_quiz_correct || 0}/{stats?.today_quiz_total || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">전체 누적</span>
              <span className="text-white/50 text-sm">
                {stats?.cumulative_quiz_score || 0}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 인포 카드 섹션 */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10 md:mb-14 justify-center items-stretch">
        {/* AI 정보학습 카드 */}
        <div className="flex-1 min-w-[220px] bg-gradient-to-br from-blue-500/30 to-blue-800/20 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center border border-blue-400/30">
          <FaRobot className="w-10 h-10 text-blue-400 mb-2 drop-shadow" />
          <div className="text-3xl md:text-4xl font-extrabold text-blue-200 mb-1">{todayStats.ai_info} / 3</div>
          <div className="text-lg font-bold text-blue-100 mb-1">AI 정보 학습</div>
          <div className="text-blue-300 text-base font-semibold">{todayData.ai_percent}% 달성</div>
        </div>
        {/* 용어학습 카드 */}
        <div className="flex-1 min-w-[220px] bg-gradient-to-br from-pink-500/30 to-purple-800/20 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center border border-pink-400/30">
          <FaBookOpen className="w-10 h-10 text-pink-400 mb-2 drop-shadow" />
          <div className="text-3xl md:text-4xl font-extrabold text-pink-200 mb-1">{todayStats.terms} / 60</div>
          <div className="text-lg font-bold text-pink-100 mb-1">용어 학습</div>
          <div className="text-pink-300 text-base font-semibold">{todayData.terms_percent}% 달성</div>
        </div>
        {/* 퀴즈점수 카드 */}
        <div className="flex-1 min-w-[220px] bg-gradient-to-br from-green-500/30 to-green-800/20 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center border border-green-400/30">
          <FaCheckCircle className="w-10 h-10 text-green-400 mb-2 drop-shadow" />
          <div className="text-3xl md:text-4xl font-extrabold text-green-200 mb-1">{todayStats.quiz_total > 0 ? `${todayStats.quiz_correct} / ${todayStats.quiz_total}` : '0 / 0'}</div>
          <div className="text-lg font-bold text-green-100 mb-1">퀴즈 정답률</div>
          <div className="text-green-300 text-base font-semibold">{todayData.quiz_score}% 달성</div>
        </div>
      </div>

      {/* 기간별 추이 그래프 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">기간별 학습 추이</h3>
          <div className="text-white/60 text-sm">
            {periodStats?.start_date} ~ {periodStats?.end_date}
          </div>
        </div>
        {/* 개선된 그래프 컨테이너 */}
        <div className="glass rounded-2xl p-6 mt-2 md:mt-6" style={{ height: 360, minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,rgba(67,56,202,0.16),rgba(236,72,153,0.13),rgba(16,185,129,0.13))', boxShadow: '0 8px 32px 0 rgba(31,41,55,0.18)' }}>
          {periodStats === undefined ? (
            <div className="text-center text-white/60 w-full">로딩 중...</div>
          ) : (
            <div className="w-full" style={{ height: 340 }}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={percentChartData}
                  margin={{ top: 36, right: 40, left: 0, bottom: 10 }}
                >
                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.18}/>
                    </linearGradient>
                    <linearGradient id="termsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0.18}/>
                    </linearGradient>
                    <linearGradient id="quizGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.18}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 8" stroke="#fff3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={({ x, y, payload, index }) => (
                      <g transform={`translate(${x},${y})`} key={payload.value + '-' + index}>
                        <text
                          x={0}
                          y={0}
                          dy={16}
                          textAnchor="middle"
                          fill="#e0e7ff"
                          fontWeight={700}
                          fontSize={15}
                          style={{
                            paintOrder: 'stroke',
                            stroke: '#18181b',
                            strokeWidth: 0.5,
                            filter: 'drop-shadow(0 1px 2px #0006)'
                          }}
                          transform="rotate(-20)"
                        >
                          {formatDateLabel(payload.value)}
                        </text>
                      </g>
                    )}
                    interval={0}
                    axisLine={{stroke:'#6366f1', strokeWidth:2}}
                    tickLine={false}
                    minTickGap={0}
                    allowDuplicatedCategory={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={({ x, y, payload }) => (
                      <g transform={`translate(${x},${y})`} key={payload.value}>
                        <text
                          x={0}
                          y={0}
                          dy={4}
                          textAnchor="end"
                          fill="#e0e7ff"
                          fontWeight={700}
                          fontSize={15}
                          style={{
                            paintOrder: 'stroke',
                            stroke: '#18181b',
                            strokeWidth: 0.5,
                            filter: 'drop-shadow(0 1px 2px #0006)'
                          }}
                        >
                          {payload.value}%
                        </text>
                      </g>
                    )}
                    axisLine={{stroke:'#6366f1', strokeWidth:2}}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{
                      borderRadius: 18,
                      boxShadow: '0 4px 24px 0 rgba(80,80,180,0.18)',
                      background: 'rgba(30,41,59,0.98)',
                      border: '2px solid #6366f1',
                      padding: 0
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: 18,
                      padding: 14,
                      borderRadius: 20,
                      background: 'linear-gradient(90deg,rgba(99,102,241,0.18),rgba(236,72,153,0.13),rgba(16,185,129,0.13))',
                      boxShadow: '0 2px 16px 0 rgba(80,80,180,0.13)',
                      marginBottom: 8,
                      border: '1.5px solid #6366f1',
                      letterSpacing: 1.2
                    }}
                  />
                  <Line type="monotone" dataKey="ai_percent" name="AI 정보 학습(%)" stroke="#6366f1" strokeWidth={5} dot={<CustomDot color="#6366f1" />} activeDot={{ r: 13 }} fill="url(#aiGrad)" isAnimationActive={animationActive} animationDuration={1400} filter="url(#glow)" />
                  <Line type="monotone" dataKey="terms_percent" name="용어 학습(%)" stroke="#ec4899" strokeWidth={5} dot={<CustomDot color="#ec4899" />} activeDot={{ r: 13 }} fill="url(#termsGrad)" isAnimationActive={animationActive} animationDuration={1400} filter="url(#glow)" />
                  <Line type="monotone" dataKey="quiz_score" name="퀴즈 점수(%)" stroke="#10b981" strokeWidth={5} dot={<CustomDot color="#10b981" />} activeDot={{ r: 13 }} fill="url(#quizGrad)" isAnimationActive={animationActive} animationDuration={1400} filter="url(#glow)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgressSection 

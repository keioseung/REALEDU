'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Circle, BookOpen, ExternalLink, Brain, Trophy, Star, Sparkles } from 'lucide-react'
import { useUpdateUserProgress, useCheckAchievements, useUpdateTermProgress, useLearnedTerms } from '@/hooks/use-user-progress'
import type { AIInfoItem, TermItem } from '@/types'
import { userProgressAPI } from '@/lib/api'

interface AIInfoCardProps {
  info: AIInfoItem
  index: number
  date: string
  sessionId: string
  isLearned: boolean
  onProgressUpdate?: () => void
  forceUpdate?: number
  setForceUpdate?: (fn: (prev: number) => number) => void
}

function AIInfoCard({ info, index, date, sessionId, isLearned: isLearnedProp, onProgressUpdate, forceUpdate, setForceUpdate }: AIInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [currentTermIndex, setCurrentTermIndex] = useState(0)
  const [showAchievement, setShowAchievement] = useState(false)
  const [showTermAchievement, setShowTermAchievement] = useState(false)
  const [showLearnComplete, setShowLearnComplete] = useState(false)
  const [isLearning, setIsLearning] = useState(false)
  const [showAllTermsComplete, setShowAllTermsComplete] = useState(false)
  const [showRelearnButton, setShowRelearnButton] = useState(false)
  const updateProgressMutation = useUpdateUserProgress()
  const checkAchievementsMutation = useCheckAchievements()
  const updateTermProgressMutation = useUpdateTermProgress()
  const [isLearned, setIsLearned] = useState(isLearnedProp)
  
  // 용어 학습 상태를 React Query로 관리
  const { data: learnedTerms = new Set<string>(), refetch: refetchLearnedTerms } = useLearnedTerms(sessionId, date, index)
  
  // localStorage에서 용어 학습 상태 백업
  const [localLearnedTerms, setLocalLearnedTerms] = useState<Set<string>>(new Set())
  
  // localStorage에서 용어 학습 상태 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`learnedTerms_${sessionId}_${date}_${index}`)
        if (stored) {
          setLocalLearnedTerms(new Set(JSON.parse(stored)))
        }
      } catch {}
    }
  }, [sessionId, date, index])
  
  // 실제 학습된 용어는 React Query 데이터와 localStorage 데이터를 합침
  const actualLearnedTerms = new Set<string>()
  
  // React Query 데이터에서 문자열만 추가
  if (learnedTerms instanceof Set) {
    for (const term of learnedTerms) {
      if (typeof term === 'string') {
        actualLearnedTerms.add(term)
      }
    }
  }
  
  // localStorage 데이터 추가
  for (const term of localLearnedTerms) {
    actualLearnedTerms.add(term)
  }
  
  // prop이 바뀌거나 forceUpdate, selectedDate가 바뀌면 동기화
  useEffect(() => {
    // localStorage와 백엔드 모두 확인해서 학습 상태 동기화
    let learned = false;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('userProgress');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed[sessionId] && parsed[sessionId][date]) {
            learned = parsed[sessionId][date].includes(index);
          }
        }
      } catch {}
    }
    setIsLearned(isLearnedProp || learned);
  }, [isLearnedProp, forceUpdate, date, sessionId, index]);

  // 용어가 있는지 확인
  const hasTerms = info.terms && info.terms.length > 0
  const currentTerm = hasTerms && info.terms ? info.terms[currentTermIndex] : null



  const handleNextTerm = async () => {
    if (hasTerms && info.terms) {
      // 현재 용어를 학습 완료로 표시
      const currentTerm = info.terms[currentTermIndex]
      if (currentTerm && !actualLearnedTerms.has(currentTerm.term)) {
        try {
          await updateTermProgressMutation.mutateAsync({
            sessionId,
            term: currentTerm.term,
            date,
            infoIndex: index
          })

          // localStorage에 저장
          const newLocalTerms = new Set([...localLearnedTerms, currentTerm.term])
          setLocalLearnedTerms(newLocalTerms)
          localStorage.setItem(`learnedTerms_${sessionId}_${date}_${index}`, JSON.stringify([...newLocalTerms]))

          // 즉시 데이터 새로고침
          await refetchLearnedTerms()

          // N개 학습완료 알림 매번 표시
          setShowAllTermsComplete(true)
          setTimeout(() => setShowAllTermsComplete(false), 3000)

          // 진행률 업데이트 콜백 호출
          if (onProgressUpdate) {
            onProgressUpdate()
          }

          // 성취 확인
          const achievementResult = await checkAchievementsMutation.mutateAsync(sessionId)
          if (achievementResult.new_achievements && achievementResult.new_achievements.length > 0) {
            setShowAchievement(true)
            setTimeout(() => setShowAchievement(false), 3000)
          }
        } catch (error) {
          console.error('Failed to update term progress:', error)
        }
      }
      // 다음 용어로 이동
      setCurrentTermIndex((prev: number) => (prev + 1) % info.terms!.length)
    }
  }

  const handleLearnToggle = async () => {
    if (isLearning) return
    setIsLearning(true)
    try {
      if (isLearned) {
        // 학습 이력 삭제 (학습완료 해제)
        const currentProgress = JSON.parse(localStorage.getItem('userProgress') || '{}')
        if (currentProgress[sessionId] && currentProgress[sessionId][date]) {
          const learnedIndices = currentProgress[sessionId][date].filter((i: number) => i !== index)
          if (learnedIndices.length === 0) {
            delete currentProgress[sessionId][date]
          } else {
            currentProgress[sessionId][date] = learnedIndices
          }
          localStorage.setItem('userProgress', JSON.stringify(currentProgress))
        }
        // 백엔드 기록도 삭제
        try {
          await userProgressAPI.deleteInfoIndex(sessionId, date, index)
        } catch (e) { /* 무시 */ }
        setIsLearned(false)
        if (setForceUpdate) setForceUpdate(prev => prev + 1)
        if (onProgressUpdate) onProgressUpdate()
      } else {
        // 학습 전 상태에서 학습 완료 상태로 변경
        await updateProgressMutation.mutateAsync({
          sessionId,
          date,
          infoIndex: index
        })
        setIsLearned(true)
        setShowLearnComplete(true)
        setTimeout(() => setShowLearnComplete(false), 3000)
        if (onProgressUpdate) onProgressUpdate()
        const achievementResult = await checkAchievementsMutation.mutateAsync(sessionId)
        if (achievementResult.new_achievements && achievementResult.new_achievements.length > 0) {
          setShowAchievement(true)
        }
      }
    } catch (error) {
      console.error('Failed to update progress:', error)
    } finally {
      setIsLearning(false)
    }
  }

  // 키보드 단축키로 이전/다음 용어 이동
  useEffect(() => {
    if (!showTerms) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextTerm();
      if (e.key === 'ArrowLeft') handlePrevTerm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTerms, currentTermIndex, info.terms]);

  const handlePrevTerm = () => {
    if (hasTerms && info.terms) {
      setCurrentTermIndex((prev: number) => (prev - 1 + info.terms!.length) % info.terms!.length);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass card-hover p-8 md:p-10 flex flex-col gap-6 relative shadow-lg border border-white/10"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isLearned ? 'bg-green-500' : 'bg-blue-500'} shadow-md`}>
            {isLearned ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <Circle className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold gradient-text line-clamp-2">
              {info.title}
            </h3>
            <p className="text-white/60 text-sm">
              {isLearned ? '학습 완료' : '학습 필요'}
            </p>
          </div>
        </div>
      </div>
      {/* 내용 */}
      <div className="mb-4 text-white/90 text-base leading-relaxed whitespace-pre-line">
        <p className={isExpanded ? '' : 'line-clamp-3'}>
          {info.content}
        </p>
        {info.content.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn mt-2 text-xs px-3 py-1"
          >
            {isExpanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
      {/* 용어 학습 섹션 */}
      {hasTerms && (
        <div className="mb-4">
          <button
            onClick={() => setShowTerms(!showTerms)}
            className="flex items-center gap-2 text-blue-300 hover:text-blue-200 text-sm font-medium mb-3"
          >
            <Brain className="w-4 h-4" />
            {showTerms ? '용어 학습 숨기기' : '관련 용어 학습하기'}
            {/* 항상 완료 개수 표시 */}
            {hasTerms && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                {actualLearnedTerms.size}개 학습완료
              </span>
            )}
          </button>
          
          {showTerms && currentTerm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20"
            >
              {/* 진행률 바 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/60">{currentTermIndex + 1} / {info.terms?.length || 0}</span>
                  <span className="text-xs text-green-400 font-bold">{actualLearnedTerms.size}개 학습완료</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="h-2 bg-gradient-to-r from-blue-500 to-green-400 rounded-full"
                    style={{ width: `${((currentTermIndex + 1) / (info.terms?.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
              {/* 현재 용어 강조 */}
              <div className="text-center mb-3">
                <div className="text-2xl font-extrabold text-blue-200 mb-2 animate-pulse">{currentTerm.term}</div>
                <div className="text-white/80 text-base">{currentTerm.description}</div>
              </div>
              {/* 이전/다음 버튼 */}
              <div className="flex justify-between gap-2 mb-3">
                <button
                  onClick={handlePrevTerm}
                  className="px-3 py-1 bg-blue-400/80 text-white rounded-lg hover:bg-blue-500 transition text-sm font-medium"
                >
                  이전 용어
                </button>
                <button
                  onClick={handleNextTerm}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                >
                  다음 용어
                </button>
              </div>
              {/* 전체 용어 목록 점프 */}
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {info.terms?.map((term, idx) => (
                  <button
                    key={term.term}
                    onClick={async () => {
                      setCurrentTermIndex(idx);
                      // 클릭한 용어를 학습완료로 표시
                      if (!actualLearnedTerms.has(term.term)) {
                        try {
                          await updateTermProgressMutation.mutateAsync({
                            sessionId,
                            term: term.term,
                            date,
                            infoIndex: index
                          })
                          
                          // localStorage에 저장
                          const newLocalTerms = new Set([...localLearnedTerms, term.term])
                          setLocalLearnedTerms(newLocalTerms)
                          localStorage.setItem(`learnedTerms_${sessionId}_${date}_${index}`, JSON.stringify([...newLocalTerms]))
                          
                          // 즉시 데이터 새로고침
                          await refetchLearnedTerms()
                          
                          // 진행률 업데이트 콜백 호출
                          if (onProgressUpdate) {
                            onProgressUpdate()
                          }
                        } catch (error) {
                          console.error('Failed to update term progress:', error)
                        }
                      }
                    }}
                    className={`px-2 py-1 rounded text-xs font-bold border transition-all ${idx === currentTermIndex ? 'bg-green-500 text-white border-green-600' : actualLearnedTerms.has(term.term) ? 'bg-green-400/80 text-white border-green-500' : 'bg-white/20 text-white/70 border-white/30 hover:bg-blue-400/40'}`}
                  >
                    {term.term}
                  </button>
                ))}
              </div>
              {/* 학습 완료 축하 메시지 */}
              {actualLearnedTerms.size === info.terms?.length && info.terms.length > 0 && (
                <div className="mt-4 text-center animate-bounce">
                  <span className="inline-block bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow">🎉 모든 용어 학습 완료! 재학습하려면 재시작하세요.</span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={handleLearnToggle}
          disabled={isLearned || isLearning}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all ${
            isLearned
              ? 'bg-green-500 text-white cursor-default'
              : isLearning
                ? 'bg-blue-600 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {isLearned ? '학습완료' : '학습완료'}
        </button>
        {/* 부분 초기화 버튼 제거됨 */}
        <button className="p-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* 학습 완료 알림 */}
      <AnimatePresence>
        {showLearnComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-xl shadow-2xl border border-green-300"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="font-bold text-sm">🎉 학습 완료!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 모든 용어 학습 완료 알림 제거됨 */}

      {/* 성취 알림 */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-xl shadow-2xl border border-yellow-300"
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 animate-bounce" />
              <div>
                <div className="font-bold text-lg">🎉 성취 달성!</div>
                <div className="text-sm opacity-90">새로운 성취를 획득했습니다!</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default AIInfoCard 

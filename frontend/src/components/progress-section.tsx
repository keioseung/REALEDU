'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, BookOpen, Target, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUserStats } from '@/hooks/use-user-progress'
import { userProgressAPI } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend)

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
  const chartData = periodStats?.period_data || []
  
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
  
  const maxAI = Math.max(...uniqueChartData.map((d: PeriodData) => d.ai_info), 1)
  const maxTerms = Math.max(...uniqueChartData.map((d: PeriodData) => d.terms), 1)
  const maxQuiz = Math.max(...uniqueChartData.map((d: PeriodData) => d.quiz_score), 1)

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

      {/* 기간별 추이 그래프 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">기간별 학습 추이</h3>
          <div className="text-white/60 text-sm">
            {periodStats?.start_date} ~ {periodStats?.end_date}
          </div>
        </div>
        {/* 개선된 그래프 컨테이너 */}
        <div className="glass rounded-2xl p-6">
          {uniqueChartData.length > 0 ? (
            <div className="space-y-8">
              {/* 통합 라인/바 그래프 */}
              <Line
                data={{
                  labels: uniqueChartData.map((d) => d.date),
                  datasets: [
                    {
                      type: 'bar',
                      label: 'AI 정보 학습',
                      data: uniqueChartData.map((d) => d.ai_info),
                      backgroundColor: 'rgba(59,130,246,0.5)',
                      borderColor: 'rgba(59,130,246,1)',
                      borderWidth: 1,
                      yAxisID: 'y',
                    },
                    {
                      type: 'bar',
                      label: '용어 학습',
                      data: uniqueChartData.map((d) => d.terms),
                      backgroundColor: 'rgba(168,85,247,0.5)',
                      borderColor: 'rgba(168,85,247,1)',
                      borderWidth: 1,
                      yAxisID: 'y',
                    },
                    {
                      type: 'line',
                      label: '퀴즈 점수(%)',
                      data: uniqueChartData.map((d) => d.quiz_score),
                      borderColor: 'rgba(34,197,94,1)',
                      backgroundColor: 'rgba(34,197,94,0.2)',
                      borderWidth: 2,
                      tension: 0.3,
                      yAxisID: 'y1',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { labels: { color: '#fff' } },
                    tooltip: { mode: 'index', intersect: false },
                  },
                  scales: {
                    x: {
                      ticks: { color: '#fff' },
                      grid: { color: 'rgba(255,255,255,0.1)' },
                    },
                    y: {
                      type: 'linear',
                      position: 'left',
                      beginAtZero: true,
                      title: { display: true, text: '학습 개수', color: '#fff' },
                      ticks: { color: '#fff' },
                      grid: { color: 'rgba(255,255,255,0.1)' },
                    },
                    y1: {
                      type: 'linear',
                      position: 'right',
                      beginAtZero: true,
                      min: 0,
                      max: 100,
                      title: { display: true, text: '퀴즈 점수(%)', color: '#fff' },
                      ticks: { color: '#fff' },
                      grid: { drawOnChartArea: false },
                    },
                  },
                }}
                height={320}
              />
            </div>
          ) : (
            <div className="text-center text-white/60 py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>선택한 기간에 학습 데이터가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgressSection 

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Calendar, Brain, Target, Trophy, TrendingUp, Search, Star, Download, Filter, Shuffle, Bookmark } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { aiInfoAPI } from '@/lib/api'

interface LearnedTermsSectionProps {
  sessionId: string
}

interface Term {
  term: string
  description: string
  learned_date: string
  info_index: number
}

interface LearnedTermsResponse {
  terms: Term[]
  total_terms: number
  learned_dates: string[]
  terms_by_date: Record<string, Term[]>
}

function LearnedTermsSection({ sessionId }: LearnedTermsSectionProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentTermIndex, setCurrentTermIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'length' | 'alphabet'>('date')
  const [favoriteTerms, setFavoriteTerms] = useState<Set<string>>(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoPlayInterval, setAutoPlayInterval] = useState(3000) // 3초

  const queryClient = useQueryClient()
  
  const { data: learnedData, isLoading } = useQuery<LearnedTermsResponse>({
    queryKey: ['learned-terms', sessionId],
    queryFn: async () => {
      const response = await aiInfoAPI.getLearnedTerms(sessionId)
      return response.data
    },
    enabled: !!sessionId,
    refetchInterval: 2000, // 2초마다 새로고침
    refetchIntervalInBackground: true,
  })

  // 필터링 및 정렬된 용어 목록
  const filteredTerms = (() => {
    if (!learnedData?.terms) return []
    
    let terms = selectedDate 
      ? learnedData.terms.filter(term => term.learned_date === selectedDate)
      : learnedData.terms

    // 중복 제거 (같은 용어가 여러 날짜에 있으면 최신 날짜 것만 유지)
    if (!selectedDate) {
      const uniqueTerms = new Map()
      terms.forEach(term => {
        const existing = uniqueTerms.get(term.term)
        if (!existing || new Date(term.learned_date) > new Date(existing.learned_date)) {
          uniqueTerms.set(term.term, term)
        }
      })
      terms = Array.from(uniqueTerms.values())
    }

    // 검색 필터
    if (searchQuery) {
      terms = terms.filter(term => 
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 즐겨찾기 필터
    if (showFavoritesOnly) {
      terms = terms.filter(term => favoriteTerms.has(term.term))
    }

    // 정렬
    switch (sortBy) {
      case 'length':
        return terms.sort((a, b) => a.term.length - b.term.length)
      case 'alphabet':
        return terms.sort((a, b) => a.term.localeCompare(b.term))
      case 'date':
      default:
        return terms.sort((a, b) => new Date(b.learned_date).getTime() - new Date(a.learned_date).getTime())
    }
  })()

  // 로컬 스토리지에서 즐겨찾기 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('favoriteTerms')
      if (stored) {
        setFavoriteTerms(new Set(JSON.parse(stored)))
      }
    }
  }, [])

  // 즐겨찾기 저장
  const toggleFavorite = (term: string) => {
    const newFavorites = new Set(favoriteTerms)
    if (newFavorites.has(term)) {
      newFavorites.delete(term)
    } else {
      newFavorites.add(term)
    }
    setFavoriteTerms(newFavorites)
    localStorage.setItem('favoriteTerms', JSON.stringify([...newFavorites]))
  }

  // 자동 재생 기능
  useEffect(() => {
    if (!autoPlay || !learnedData?.terms) return

    const interval = setInterval(() => {
      setCurrentTermIndex(prev => (prev + 1) % filteredTerms.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, learnedData?.terms])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextTerm()
      if (e.key === 'ArrowLeft') handlePrevTerm()
      if (e.key === ' ') {
        e.preventDefault()
        setAutoPlay(!autoPlay)
      }
      if (e.key === 'f' || e.key === 'F') {
        const currentTerm = filteredTerms[currentTermIndex]
        if (currentTerm) toggleFavorite(currentTerm.term)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTermIndex, autoPlay, filteredTerms])

  const handleDateSelect = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date)
    setCurrentTermIndex(0)
  }

  const handleNextTerm = () => {
    if (filteredTerms.length > 0) {
      setCurrentTermIndex((prev) => (prev + 1) % filteredTerms.length)
    }
  }

  const handlePrevTerm = () => {
    if (filteredTerms.length > 0) {
      setCurrentTermIndex((prev) => (prev - 1 + filteredTerms.length) % filteredTerms.length)
    }
  }

  const handleShuffle = () => {
    if (filteredTerms.length > 0) {
      setCurrentTermIndex(Math.floor(Math.random() * filteredTerms.length))
    }
  }

  // 용어 난이도 계산 (용어 길이 기반)
  const getDifficulty = (term: string) => {
    if (term.length <= 3) return { level: '쉬움', color: 'text-green-400', bg: 'bg-green-500/20' }
    if (term.length <= 6) return { level: '보통', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    return { level: '어려움', color: 'text-red-400', bg: 'bg-red-500/20' }
  }

  // 용어 목록 내보내기
  const exportTerms = () => {
    const data = filteredTerms.map(term => ({
      용어: term.term,
      설명: term.description,
      학습일: term.learned_date,
      난이도: getDifficulty(term.term).level
    }))
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `학습용어_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-8">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">학습한 용어를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!learnedData?.terms || learnedData.terms.length === 0) {
    return (
      <div className="glass rounded-2xl p-8">
        <div className="text-center text-white">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-60" />
          <h3 className="text-xl font-semibold mb-2">학습한 용어가 없습니다</h3>
          <p className="text-white/70 mb-4">
            AI 정보를 학습하고 용어를 등록한 후 여기서 확인해보세요!
          </p>
          <div className="text-sm text-white/50">
            총 학습 가능한 용어: 0개
          </div>
        </div>
      </div>
    )
  }

  const currentTerm = filteredTerms[currentTermIndex]
  const difficulty = currentTerm ? getDifficulty(currentTerm.term) : null

  return (
    <div className="glass rounded-2xl p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Brain className="w-8 h-8" />
          학습한 용어 모음
        </h2>
        <div className="text-white/70 text-sm">
          총 {filteredTerms.length}개 용어 (전체 {learnedData.total_terms}개)
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="mb-6 space-y-4">
        {/* 검색바 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
          <input
            type="text"
            placeholder="용어나 설명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* 필터 옵션 */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="date">최신순</option>
            <option value="alphabet">가나다순</option>
            <option value="length">길이순</option>
          </select>

          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              showFavoritesOnly
                ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Star className="w-4 h-4" />
            즐겨찾기만
          </button>

          <button
            onClick={handleShuffle}
            className="px-3 py-2 bg-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/50 transition-all text-sm font-medium flex items-center gap-2"
          >
            <Shuffle className="w-4 h-4" />
            랜덤
          </button>

          <button
            onClick={exportTerms}
            className="px-3 py-2 bg-green-500/30 text-green-300 rounded-lg hover:bg-green-500/50 transition-all text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>
      </div>

      {/* 상단 통계 카드 - 모바일 앱 유저 친화적 2x2 그리드, 카드형, 반응형 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="flex flex-col items-center justify-center rounded-2xl shadow-lg p-4 bg-gradient-to-br from-blue-500/30 to-blue-800/20 border-0 active:scale-95 transition-transform">
          <BookOpen className="w-7 h-7 text-blue-300 mb-1" />
          <div className="text-xl font-extrabold text-blue-100 mb-0.5">{filteredTerms.length}</div>
          <div className="text-xs font-semibold text-blue-200">표시</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl shadow-lg p-4 bg-gradient-to-br from-yellow-400/30 to-green-400/20 border-0 active:scale-95 transition-transform">
          <Star className="w-7 h-7 text-yellow-300 mb-1" />
          <div className="text-xl font-extrabold text-yellow-100 mb-0.5">{favoriteTerms.size}</div>
          <div className="text-xs font-semibold text-yellow-200">즐겨찾기</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl shadow-lg p-4 bg-gradient-to-br from-purple-500/30 to-pink-500/20 border-0 active:scale-95 transition-transform">
          <Calendar className="w-7 h-7 text-purple-300 mb-1" />
          <div className="text-xl font-extrabold text-purple-100 mb-0.5">{learnedData.learned_dates.length}</div>
          <div className="text-xs font-semibold text-purple-200">일</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl shadow-lg p-4 bg-gradient-to-br from-orange-400/30 to-yellow-400/20 border-0 active:scale-95 transition-transform">
          <TrendingUp className="w-7 h-7 text-orange-300 mb-1" />
          <div className="text-xl font-extrabold text-orange-100 mb-0.5">{Math.round((filteredTerms.length / learnedData.total_terms) * 100)}%</div>
          <div className="text-xs font-semibold text-orange-200">진행</div>
        </div>
      </div>

      {/* 날짜별 필터 */}
      {learnedData.learned_dates.length > 1 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            날짜별 필터
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDateSelect('')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                !selectedDate
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              전체 ({learnedData.total_terms})
            </button>
            {learnedData.learned_dates.map((date) => {
              const dateTerms = learnedData.terms_by_date[date] || []
              return (
                <button
                  key={date}
                  onClick={() => handleDateSelect(date)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedDate === date
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {date} ({dateTerms.length})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 현재 용어 표시 */}
      {currentTerm && (
        <motion.div
          key={currentTerm.term + currentTerm.learned_date}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`px-2 py-1 rounded-lg text-xs font-bold ${difficulty?.bg} ${difficulty?.color}`}>
                {difficulty?.level}
              </div>
            </div>
            <button
              onClick={() => toggleFavorite(currentTerm.term)}
              className={`p-2 rounded-lg transition-all ${
                favoriteTerms.has(currentTerm.term)
                  ? 'text-yellow-400 bg-yellow-500/20'
                  : 'text-white/50 hover:text-yellow-400 hover:bg-yellow-500/10'
              }`}
            >
              <Star className="w-5 h-5" fill={favoriteTerms.has(currentTerm.term) ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-white mb-3">{currentTerm.term}</div>
            <div className="text-white/80 text-lg leading-relaxed">{currentTerm.description}</div>
          </div>
          
          <div className="flex items-center justify-center text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>학습일: {currentTerm.learned_date}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 네비게이션 */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-white/70 text-sm">
          {currentTermIndex + 1} / {filteredTerms.length}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 ${
              autoPlay
                ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {autoPlay ? '정지' : '자동재생'}
          </button>
          <button
            onClick={handlePrevTerm}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-medium"
          >
            이전
          </button>
          <button
            onClick={handleNextTerm}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium"
          >
            다음
          </button>
        </div>
      </div>

      {/* 용어 목록 */}
      {filteredTerms.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            전체 용어 목록 ({filteredTerms.length}개)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {filteredTerms.map((term, index) => {
              const termDifficulty = getDifficulty(term.term)
              return (
                <motion.div
                  key={`${term.term}_${term.learned_date}_${term.info_index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    index === currentTermIndex
                      ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-blue-400/50'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                  onClick={() => setCurrentTermIndex(index)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-white text-sm">{term.term}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(term.term)
                      }}
                      className={`p-1 rounded ${
                        favoriteTerms.has(term.term)
                          ? 'text-yellow-400'
                          : 'text-white/30 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="w-3 h-3" fill={favoriteTerms.has(term.term) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="text-white/60 text-xs line-clamp-2 mb-1">{term.description}</div>
                  <div className="flex items-center justify-between">
                    <div className={`text-xs px-1 py-0.5 rounded ${termDifficulty.bg} ${termDifficulty.color}`}>
                      {termDifficulty.level}
                    </div>
                    <div className="text-white/40 text-xs">{term.learned_date}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default LearnedTermsSection 
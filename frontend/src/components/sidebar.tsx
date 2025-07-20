'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Settings, 
  Plus, 
  Trash2, 
  Brain, 
  BookOpen, 
  Trophy,
  Menu,
  X
} from 'lucide-react'
import { useAIInfoDates, useAddAIInfo, useDeleteAIInfo } from '@/hooks/use-ai-info'
import { useFetchAINews } from '@/hooks/use-ai-info'
import type { AIInfoItem } from '@/types'

interface SidebarProps {
  selectedDate: string
  onDateChange: (date: string) => void
  sessionId: string
}

function Sidebar({ selectedDate, onDateChange, sessionId }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAddingInfo, setIsAddingInfo] = useState(false)
  const [newInfoTitle, setNewInfoTitle] = useState('')
  const [newInfoContent, setNewInfoContent] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  
  const { data: dates } = useAIInfoDates()
  const { data: news } = useFetchAINews()
  const addAIInfoMutation = useAddAIInfo()
  const deleteAIInfoMutation = useDeleteAIInfo()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('currentUser')
      if (userStr) {
        const user = JSON.parse(userStr)
        setUserRole(user.role)
      }
    }
  }, [])

  const handleAddInfo = async () => {
    if (!newInfoTitle.trim() || !newInfoContent.trim()) return

    const newInfo: AIInfoItem = {
      title: newInfoTitle,
      content: newInfoContent
    }

    try {
      await addAIInfoMutation.mutateAsync({
        date: selectedDate,
        infos: [newInfo]
      })
      setNewInfoTitle('')
      setNewInfoContent('')
      setIsAddingInfo(false)
    } catch (error) {
      console.error('Failed to add AI info:', error)
    }
  }

  const handleDeleteInfo = async (date: string) => {
    try {
      await deleteAIInfoMutation.mutateAsync(date)
    } catch (error) {
      console.error('Failed to delete AI info:', error)
    }
  }

  return (
    <>
      {/* 모바일 메뉴 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-sm rounded-lg"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* 사이드바 */}
      <motion.aside
        initial={false}
        animate={{ x: 0 }}
        className={`w-full max-w-2xl glass rounded-2xl p-6 mx-auto mb-4`}
      >
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="text-center">
            <h2 className="text-2xl font-bold gradient-text">AI Mastery Hub</h2>
            <p className="text-white/70 text-sm">학습 관리</p>
          </div>

          {/* 날짜 선택 */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              날짜 선택
            </h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {/* 날짜 목록 */}
          {dates && dates.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">등록된 날짜</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {dates.map((date) => (
                  <div
                    key={date}
                    className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                  >
                    <button
                      onClick={() => onDateChange(date)}
                      className={`text-sm ${
                        date === selectedDate ? 'text-white font-semibold' : 'text-white/70'
                      }`}
                    >
                      {date}
                    </button>
                    <button
                      onClick={() => handleDeleteInfo(date)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 정보 추가 */}
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setIsAddingInfo(!isAddingInfo)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                AI 정보 추가
              </button>

              {isAddingInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-3"
                >
                  <input
                    type="text"
                    placeholder="제목"
                    value={newInfoTitle}
                    onChange={(e) => setNewInfoTitle(e.target.value)}
                    className="w-full p-2 bg-white border border-white/20 rounded text-black placeholder-black/50 text-sm"
                  />
                  <textarea
                    placeholder="내용"
                    value={newInfoContent}
                    onChange={(e) => setNewInfoContent(e.target.value)}
                    rows={3}
                    className="w-full p-2 bg-white border border-white/20 rounded text-black placeholder-black/50 text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddInfo}
                      disabled={addAIInfoMutation.isPending}
                      className="flex-1 p-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                    >
                      {addAIInfoMutation.isPending ? '추가 중...' : '추가'}
                    </button>
                    <button
                      onClick={() => setIsAddingInfo(false)}
                      className="flex-1 p-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      취소
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* 최신 뉴스 */}
          {news && news.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                최신 AI 뉴스
              </h3>
              <div className="space-y-3">
                {news.slice(0, 3).map((item: { title: string; content: string }, index: number) => (
                  <div key={index} className="p-3 bg-white/5 rounded-lg">
                    <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-white/70 text-xs line-clamp-2">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 관리자 메뉴 */}
          {userRole === 'admin' && (
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                관리
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left p-2 text-white/70 hover:text-white hover:bg-white/5 rounded text-sm">
                  퀴즈 관리
                </button>
                <button className="w-full text-left p-2 text-white/70 hover:text-white hover:bg-white/5 rounded text-sm">
                  프롬프트 관리
                </button>
                <button className="w-full text-left p-2 text-white/70 hover:text-white hover:bg-white/5 rounded text-sm">
                  사용자 통계
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar 

"use client"

import { useEffect, useState } from 'react'

export default function AdminStatsPage() {
  const [aiInfoCount, setAiInfoCount] = useState(0)
  const [quizCount, setQuizCount] = useState(0)
  const [promptCount, setPromptCount] = useState(0)
  const [baseContentCount, setBaseContentCount] = useState(0)

  useEffect(() => {
    const aiInfos = JSON.parse(localStorage.getItem('aiInfos') || '[]')
    setAiInfoCount(Array.isArray(aiInfos) ? aiInfos.length : 0)
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]')
    setQuizCount(Array.isArray(quizzes) ? quizzes.length : 0)
    const prompts = JSON.parse(localStorage.getItem('prompts') || '[]')
    setPromptCount(Array.isArray(prompts) ? prompts.length : 0)
    const baseContents = JSON.parse(localStorage.getItem('baseContents') || '[]')
    setBaseContentCount(Array.isArray(baseContents) ? baseContents.length : 0)
  }, [])

  return (
    <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-3xl shadow-2xl">
      <h2 className="text-3xl font-extrabold mb-8 text-blue-700 flex items-center gap-2">📊 사용자 통계</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 shadow flex flex-col items-center">
          <div className="text-4xl font-bold text-blue-700 mb-2">{aiInfoCount}</div>
          <div className="text-lg text-blue-900 font-semibold">AI 정보</div>
        </div>
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 shadow flex flex-col items-center">
          <div className="text-4xl font-bold text-purple-700 mb-2">{quizCount}</div>
          <div className="text-lg text-purple-900 font-semibold">퀴즈</div>
        </div>
        <div className="bg-gradient-to-r from-pink-100 to-blue-100 rounded-2xl p-6 shadow flex flex-col items-center">
          <div className="text-4xl font-bold text-pink-700 mb-2">{promptCount}</div>
          <div className="text-lg text-pink-900 font-semibold">프롬프트</div>
        </div>
        <div className="bg-gradient-to-r from-blue-100 to-pink-100 rounded-2xl p-6 shadow flex flex-col items-center">
          <div className="text-4xl font-bold text-blue-500 mb-2">{baseContentCount}</div>
          <div className="text-lg text-blue-900 font-semibold">기반 내용</div>
        </div>
      </div>
    </div>
  )
} 
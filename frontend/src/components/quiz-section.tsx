'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { quizAPI, userProgressAPI } from '@/lib/api'
import type { Quiz } from '@/types'

interface QuizSectionProps {
  sessionId: string
}

function QuizSection({ sessionId }: QuizSectionProps) {
  const [selectedTopic, setSelectedTopic] = useState('AI')
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)

  // 퀴즈 점수 업데이트 뮤테이션
  const updateQuizScoreMutation = useMutation({
    mutationFn: async ({ score, totalQuestions }: { score: number; totalQuestions: number }) => {
      const response = await userProgressAPI.updateQuizScore(sessionId, {
        score,
        total_questions: totalQuestions
      })
      return response.data
    }
  })

  const { data: topics } = useQuery({
    queryKey: ['quiz-topics'],
    queryFn: async () => {
      const response = await quizAPI.getTopics()
      return response.data as string[]
    },
  })

  const { data: quizzes } = useQuery({
    queryKey: ['quiz', selectedTopic],
    queryFn: async () => {
      const response = await quizAPI.getByTopic(selectedTopic)
      return response.data as Quiz[]
    },
    enabled: !!selectedTopic,
  })

  const currentQuiz = quizzes?.[currentQuizIndex]

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !currentQuiz) return

    const isCorrect = selectedAnswer === currentQuiz.correct
    if (isCorrect) {
      setScore(score + 1)
    }

    setShowResult(true)
  }

  const handleNextQuiz = () => {
    if (quizzes && currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else if (quizzes && currentQuizIndex === quizzes.length - 1) {
      // 퀴즈 완료 시 점수 업데이트
      setQuizCompleted(true)
      updateQuizScoreMutation.mutate({
        score,
        totalQuestions: quizzes.length
      })
    }
  }

  const handleResetQuiz = () => {
    setCurrentQuizIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
  }

  const getOptionClass = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index
        ? 'bg-blue-500 border-blue-500 text-white'
        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
    }

    if (index === currentQuiz?.correct) {
      return 'bg-green-500 border-green-500 text-white'
    }
    if (selectedAnswer === index && index !== currentQuiz?.correct) {
      return 'bg-red-500 border-red-500 text-white'
    }
    return 'bg-white/10 border-white/20 text-white/50'
  }

  return (
    <section className="mb-8">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <HelpCircle className="w-8 h-8" />
        퀴즈 도전
      </h2>

      <div className="glass rounded-2xl p-8">
        {/* 주제 선택 */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">주제 선택</h3>
          <div className="flex flex-wrap gap-3">
            {topics?.map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  setSelectedTopic(topic)
                  setCurrentQuizIndex(0)
                  setSelectedAnswer(null)
                  setShowResult(false)
                  setScore(0)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedTopic === topic
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* 퀴즈 진행상황 */}
        {quizzes && quizzes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/70">
                {currentQuizIndex + 1} / {quizzes.length}
              </span>
              <span className="text-white font-semibold">
                점수: {score} / {quizzes.length}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuizIndex + 1) / quizzes.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 퀴즈 내용 */}
        {currentQuiz ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                {currentQuiz.question}
              </h3>
            </div>

            <div className="space-y-3">
              {[currentQuiz.option1, currentQuiz.option2, currentQuiz.option3, currentQuiz.option4].map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${getOptionClass(index)}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                    <span>{option}</span>
                    {showResult && index === currentQuiz.correct && (
                      <CheckCircle className="w-5 h-5 ml-auto" />
                    )}
                    {showResult && selectedAnswer === index && index !== currentQuiz.correct && (
                      <XCircle className="w-5 h-5 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 결과 표시 */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-white/10 border border-white/20"
              >
                <h4 className="text-lg font-semibold text-white mb-2">
                  {selectedAnswer === currentQuiz.correct ? '정답입니다! 🎉' : '틀렸습니다 😅'}
                </h4>
                <p className="text-white/80">{currentQuiz.explanation}</p>
              </motion.div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3">
              {!showResult ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  답안 제출
                </button>
              ) : (
                <>
                  {currentQuizIndex < (quizzes?.length || 0) - 1 ? (
                    <button
                      onClick={handleNextQuiz}
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600"
                    >
                      다음 문제
                    </button>
                  ) : (
                    <div className="flex-1 text-center">
                      <h3 className="text-xl font-bold text-white mb-2">퀴즈 완료!</h3>
                      <p className="text-white/70">
                        최종 점수: {score} / {quizzes?.length}
                      </p>
                      {quizCompleted && (
                        <p className="text-green-400 text-sm mt-2">
                          점수가 저장되었습니다! 🎉
                        </p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleResetQuiz}
                    className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    다시 시작
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <HelpCircle className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <p className="text-white/70 text-lg">
              선택한 주제에 대한 퀴즈가 없습니다.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default QuizSection 

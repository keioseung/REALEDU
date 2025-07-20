"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quizAPI } from '@/lib/api'

// Quiz 타입을 API 응답에 맞게 수정
interface Quiz {
  id: number
  topic: string
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct: number
  explanation: string
}

export default function AdminQuizPage() {
  const queryClient = useQueryClient()
  const [topic, setTopic] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [choices, setChoices] = useState(['', '', '', ''])
  const [explanation, setExplanation] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // useQuery에서 받아온 데이터를 바로 사용
  const { data: quizzes = [], refetch } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const res = await quizAPI.getTopics()
      if (res.data.length > 0) {
        const quizRes = await quizAPI.getByTopic(res.data[0])
        return quizRes.data as Quiz[]
      }
      return []
    }
  })

  const addOrUpdateMutation = useMutation({
    mutationFn: async () => {
      const correctIndex = choices.findIndex(c => c.trim() === answer.trim())
      if (correctIndex === -1) {
        throw new Error('정답이 오답 목록에 없습니다.')
      }
      const quizPayload = {
        topic,
        question,
        option1: choices[0],
        option2: choices[1],
        option3: choices[2],
        option4: choices[3],
        correct: correctIndex,
        explanation
      }
      if (editId) {
        return quizAPI.update(Number(editId), quizPayload)
      } else {
        return quizAPI.add(quizPayload)
      }
    },
    onMutate: () => {
      setError('')
      setSuccess('')
    },
    onSuccess: () => {
      refetch()
      setTopic('')
      setQuestion('')
      setAnswer('')
      setChoices(['', '', '', ''])
      setExplanation('')
      setEditId(null)
      setSuccess('등록이 완료되었습니다!')
    },
    onError: (err: any) => {
      setError(err?.message || '등록에 실패했습니다. 다시 시도해주세요.')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!topic.trim() || !question.trim() || !answer.trim() || choices.some(c => !c.trim())) {
      setError('모든 항목(주제, 문제, 정답, 오답)을 입력하세요.')
      return
    }
    if (!choices.includes(answer)) {
      setError('정답은 오답 목록 중 하나여야 합니다.')
      return
    }
    addOrUpdateMutation.mutate()
  }

  const handleEdit = (q: Quiz) => {
    setEditId(q.id.toString())
    setTopic(q.topic)
    setQuestion(q.question)
    setAnswer(q.option1) // 편집 시 정답은 option1로 설정
    setChoices([q.option1, q.option2, q.option3, q.option4])
    setExplanation(q.explanation || '')
  }

  const handleDelete = async (id: string) => {
    try {
      await quizAPI.delete(Number(id))
      refetch()
      setSuccess('삭제가 완료되었습니다!')
    } catch {
      setError('삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-16 p-8 bg-white rounded-3xl shadow-2xl">
      <h2 className="text-3xl font-extrabold mb-8 text-purple-700 flex items-center gap-2">🎯 퀴즈 관리</h2>
      <form onSubmit={handleSubmit} className="mb-10 bg-purple-50 rounded-xl p-6 shadow flex flex-col gap-6">
        <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-purple-700">주제</label>
            <input type="text" placeholder="주제" value={topic} onChange={e => setTopic(e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-purple-700">문제</label>
            <input type="text" placeholder="문제" value={question} onChange={e => setQuestion(e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-purple-700">정답</label>
            <input type="text" placeholder="정답" value={answer} onChange={e => setAnswer(e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-purple-700">오답</label>
            {choices.map((c, i) => (
              <input key={i} type="text" placeholder={`오답${i+1}`} value={c} onChange={e => setChoices(choices.map((cc, idx) => idx === i ? e.target.value : cc))} className="p-2 border rounded focus:ring-2 focus:ring-purple-300 mb-1" />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-purple-700">해설</label>
            <textarea placeholder="해설 (선택)" value={explanation} onChange={e => setExplanation(e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-purple-300" rows={2} />
          </div>
        </div>
        {error && <div className="text-red-500 font-semibold text-center mt-2">{error}</div>}
        {success && <div className="text-green-600 font-semibold text-center mt-2">{success}</div>}
        <button type="submit" disabled={addOrUpdateMutation.isPending} className="mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed">
          {addOrUpdateMutation.isPending ? '등록 중...' : (editId ? '수정' : '등록')}
        </button>
      </form>
      <div className="grid gap-6">
        {quizzes.length === 0 && <div className="text-gray-400 text-center">등록된 퀴즈가 없습니다.</div>}
        {quizzes.map(q => {
          const options = [q.option1, q.option2, q.option3, q.option4];
          return (
            <div key={q.id} className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow">
              <div className="flex-1">
                <div className="font-bold text-lg text-purple-900 mb-1">{q.question}</div>
                <div className="text-green-700 text-sm mb-1">정답: {options[q.correct]}</div>
                <div className="text-gray-700 text-sm mb-1">오답: {options.filter((_,i)=>i!==q.correct).join(', ')}</div>
                {q.explanation && <div className="text-purple-700 text-sm bg-purple-50 rounded p-2 mt-2">해설: {q.explanation}</div>}
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button onClick={() => handleEdit(q)} className="px-4 py-2 bg-yellow-400 text-white rounded-xl font-bold hover:bg-yellow-500 transition">수정</button>
                <button onClick={() => handleDelete(q.id.toString())} className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition">삭제</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
} 
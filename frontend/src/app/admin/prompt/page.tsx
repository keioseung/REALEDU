"use client"

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiInfoAPI } from '@/lib/api'

interface Prompt {
  id: string
  title: string
  content: string
}
interface AIInfo {
  id: string
  date: string
  title: string
  content: string
}

export default function AdminPromptPage() {
  // AI 정보 관리 상태
  const queryClient = useQueryClient()
  const [date, setDate] = useState('')
  const [inputs, setInputs] = useState([{ title: '', content: '' }])
  const [editId, setEditId] = useState<boolean>(false)
  const [aiError, setAIError] = useState('')
  const [aiSuccess, setAISuccess] = useState('')

  // 프롬프트 관리
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [promptTitle, setPromptTitle] = useState('')
  const [promptContent, setPromptContent] = useState('')
  const [promptEditId, setPromptEditId] = useState<string | null>(null)

  // 기반 내용 관리
  const [baseContents, setBaseContents] = useState<AIInfo[]>([])
  const [baseTitle, setBaseTitle] = useState('')
  const [baseContent, setBaseContent] = useState('')
  const [baseEditId, setBaseEditId] = useState<string | null>(null)

  // 프롬프트+기반내용 합치기
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const pData = localStorage.getItem('prompts')
    if (pData) setPrompts(JSON.parse(pData))
    const bData = localStorage.getItem('baseContents')
    if (bData) setBaseContents(JSON.parse(bData))
  }, [])

  useEffect(() => {
    localStorage.setItem('prompts', JSON.stringify(prompts))
  }, [prompts])
  useEffect(() => {
    localStorage.setItem('baseContents', JSON.stringify(baseContents))
  }, [baseContents])

  // AI 정보 관리 쿼리
  const { data: dates = [], refetch: refetchDates } = useQuery({
    queryKey: ['ai-info-dates'],
    queryFn: async () => {
      const res = await aiInfoAPI.getAllDates()
      return res.data as string[]
    }
  })
  const { data: aiInfos = [], refetch: refetchAIInfo, isFetching } = useQuery({
    queryKey: ['ai-info', date],
    queryFn: async () => {
      if (!date) return []
      const res = await aiInfoAPI.getByDate(date)
      return res.data as { title: string, content: string }[]
    },
    enabled: !!date,
  })
  // AI 정보 등록/수정/삭제 핸들러 (기존과 동일)
  const handleBaseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!baseTitle || !baseContent) return
    if (baseEditId) {
      setBaseContents(baseContents.map(b => b.id === baseEditId ? { ...b, title: baseTitle, content: baseContent, date: new Date().toISOString().slice(0,10) } : b))
      setBaseEditId(null)
    } else {
      setBaseContents([
        ...baseContents,
        { id: Date.now().toString(), title: baseTitle, content: baseContent, date: new Date().toISOString().slice(0,10) }
      ])
    }
    setBaseTitle('')
    setBaseContent('')
  }
  const handleBaseEdit = (b: AIInfo) => {
    setBaseEditId(b.id)
    setBaseTitle(b.title)
    setBaseContent(b.content)
  }
  const handleBaseDelete = (id: string) => {
    setBaseContents(baseContents.filter(b => b.id !== id))
    if (baseEditId === id) {
      setBaseEditId(null)
      setBaseTitle('')
      setBaseContent('')
    }
  }

  // 프롬프트 관리 핸들러
  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!promptTitle || !promptContent) return
    if (promptEditId) {
      setPrompts(prompts.map(p => p.id === promptEditId ? { ...p, title: promptTitle, content: promptContent } : p))
      setPromptEditId(null)
    } else {
      setPrompts([
        ...prompts,
        { id: Date.now().toString(), title: promptTitle, content: promptContent }
      ])
    }
    setPromptTitle('')
    setPromptContent('')
  }
  const handlePromptEdit = (p: Prompt) => {
    setPromptEditId(p.id)
    setPromptTitle(p.title)
    setPromptContent(p.content)
  }
  const handlePromptDelete = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id))
    if (promptEditId === id) {
      setPromptEditId(null)
      setPromptTitle('')
      setPromptContent('')
    }
  }

  // 프롬프트+기반내용 합치기
  const getCombinedText = () => {
    const prompt = prompts.find(p => p.id === selectedPromptId)
    const base = baseContents.find(b => b.id === selectedBaseId)
    return [prompt?.content || '', base ? `\n\n[기반 내용]\n${base.content}` : ''].join('')
  }
  const handleCopyAndGo = () => {
    const text = getCombinedText()
    navigator.clipboard.writeText(text)
    setCopied(true)
    window.open('https://chat.openai.com/', '_blank')
    setTimeout(() => setCopied(false), 2000)
  }

  // 프롬프트+기반내용 합치기 영역 선택 기능 추가
  const combinedRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        if (document.activeElement === combinedRef.current) {
          e.preventDefault()
          const range = document.createRange()
          range.selectNodeContents(combinedRef.current!)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
      }
    }
    const node = combinedRef.current
    if (node) node.addEventListener('keydown', handleKeyDown)
    return () => { if (node) node.removeEventListener('keydown', handleKeyDown) }
  }, [])

  return (
    <div className="max-w-4xl mx-auto mt-16 p-8 bg-white rounded-3xl shadow-2xl flex flex-col gap-12">
      {/* 프롬프트 관리 */}
      <section>
        <h2 className="text-3xl font-extrabold mb-8 text-pink-700 flex items-center gap-2">🤖 프롬프트 관리</h2>
        <form onSubmit={handlePromptSubmit} className="mb-8 bg-pink-50 rounded-xl p-6 shadow flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className="font-semibold text-pink-700">프롬프트 제목</label>
            <input type="text" placeholder="프롬프트 제목" value={promptTitle} onChange={e => setPromptTitle(e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-pink-300" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label className="font-semibold text-pink-700">프롬프트 내용</label>
            <textarea placeholder="프롬프트 내용" value={promptContent} onChange={e => setPromptContent(e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-pink-300" rows={2} />
          </div>
          <div className="flex flex-col gap-2">
            <button type="submit" className="px-4 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition">{promptEditId ? '수정' : '등록'}</button>
            {promptEditId && <button type="button" onClick={() => { setPromptEditId(null); setPromptTitle(''); setPromptContent('') }} className="px-4 py-2 bg-gray-400 text-white rounded-xl font-bold hover:bg-gray-500 transition">취소</button>}
          </div>
        </form>
        <div className="grid gap-6 mb-10">
          {prompts.length === 0 && <div className="text-gray-400 text-center">등록된 프롬프트가 없습니다.</div>}
          {prompts.map(p => (
            <div key={p.id} className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow">
              <div className="flex-1">
                <div className="font-bold text-lg text-pink-900 mb-1">{p.title}</div>
                <div className="text-gray-700 text-sm whitespace-pre-line">{p.content}</div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button onClick={() => handlePromptEdit(p)} className="px-4 py-2 bg-yellow-400 text-white rounded-xl font-bold hover:bg-yellow-500 transition">수정</button>
                <button onClick={() => handlePromptDelete(p.id)} className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition">삭제</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* 기반 내용 관리 */}
      <section>
        <h2 className="text-3xl font-extrabold mb-8 text-pink-700 flex items-center gap-2">📄 기반 내용 관리</h2>
        <form onSubmit={handleBaseSubmit} className="mb-8 bg-pink-50 rounded-xl p-6 shadow flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className="font-semibold text-pink-700">기반 내용 제목</label>
            <input type="text" placeholder="기반 내용 제목" value={baseTitle} onChange={e => setBaseTitle(e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-pink-300" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label className="font-semibold text-pink-700">기반 내용</label>
            <textarea placeholder="기반 내용" value={baseContent} onChange={e => setBaseContent(e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-pink-300" rows={2} />
          </div>
          <div className="flex flex-col gap-2">
            <button type="submit" className="px-4 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition">{baseEditId ? '수정' : '등록'}</button>
            {baseEditId && <button type="button" onClick={() => { setBaseEditId(null); setBaseTitle(''); setBaseContent('') }} className="px-4 py-2 bg-gray-400 text-white rounded-xl font-bold hover:bg-gray-500 transition">취소</button>}
          </div>
        </form>
        <div className="grid gap-6 mb-10">
          {baseContents.length === 0 && <div className="text-gray-400 text-center">등록된 기반 내용이 없습니다.</div>}
          {baseContents.map(b => (
            <div key={b.id} className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow">
              <div className="flex-1">
                <div className="font-bold text-lg text-pink-900 mb-1">{b.title}</div>
                <div className="text-gray-700 text-sm whitespace-pre-line">{b.content}</div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button onClick={() => handleBaseEdit(b)} className="px-4 py-2 bg-yellow-400 text-white rounded-xl font-bold hover:bg-yellow-500 transition">수정</button>
                <button onClick={() => handleBaseDelete(b.id)} className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition">삭제</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* 프롬프트+기반내용 합치기 */}
      <section>
        <div className="mb-8 p-6 bg-gradient-to-r from-pink-200 to-purple-100 rounded-2xl border-2 border-pink-300 shadow flex flex-col gap-3">
          <div className="mb-2 font-semibold text-pink-700 text-lg">ChatGPT에 물어볼 프롬프트와 기반 내용을 선택하세요.</div>
          <select value={selectedPromptId || ''} onChange={e => setSelectedPromptId(e.target.value)} className="w-full p-2 border rounded mb-2">
            <option value="">프롬프트 선택</option>
            {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <select value={selectedBaseId || ''} onChange={e => setSelectedBaseId(e.target.value)} className="w-full p-2 border rounded mb-2">
            <option value="">기반 내용 선택(선택사항)</option>
            {baseContents.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          <button onClick={handleCopyAndGo} disabled={!selectedPromptId} className="w-full px-4 py-2 bg-pink-600 text-white rounded-xl font-bold mt-2 disabled:opacity-50 hover:bg-pink-700 transition">ChatGPT에 물어보기</button>
          {copied && <div className="text-green-600 mt-2">프롬프트+기반내용이 복사되었습니다!</div>}
          <div ref={combinedRef} tabIndex={0} className="mt-2 p-2 bg-white border rounded text-sm text-gray-700 whitespace-pre-line outline-none" style={{userSelect:'text'}}>
            {getCombinedText() || '선택된 프롬프트와 기반 내용이 여기에 미리보기로 표시됩니다.'}
          </div>
        </div>
      </section>
    </div>
  )
} 
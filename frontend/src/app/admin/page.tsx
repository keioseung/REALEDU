"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FaRobot, FaArrowRight, FaGlobe, FaCode, FaBrain, FaRocket, FaChartLine, FaTrophy, FaLightbulb, FaUsers, FaBookOpen, FaCalendar, FaClipboard, FaBullseye, FaCog, FaChartBar, FaComments, FaDatabase } from 'react-icons/fa'

const adminMenus = [
  { href: '/admin/ai-info', label: 'AI 정보 관리', icon: FaBrain, desc: 'AI 정보 등록, 수정, 삭제 등', color: 'from-blue-500 to-cyan-500' },
  { href: '/admin/prompt', label: '프롬프트 관리', icon: FaComments, desc: 'AI 프롬프트 관리', color: 'from-green-500 to-emerald-500' },
  { href: '/admin/stats', label: '사용자 통계', icon: FaChartBar, desc: '전체 사용자 학습/퀴즈 통계', color: 'from-yellow-500 to-orange-500' },
]

export default function AdminPage() {
  const router = useRouter()
  
  // 타이핑 애니메이션 상태
  const [typedText, setTypedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const fullText = "관리자 대시보드"
  
  // 환영 메시지 애니메이션
  const [currentWelcome, setCurrentWelcome] = useState(0)
  const welcomeMessages = [
    "AI Mastery Hub를 관리하세요! 🚀",
    "사용자들의 학습을 지원해보세요! 💡",
    "함께 성장하는 플랫폼을 만들어가요! 🌟"
  ]

  // 타이핑 애니메이션
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 150)
      return () => clearTimeout(timeout)
    } else {
      setIsTyping(false)
    }
  }, [currentIndex, fullText])

  // 환영 메시지 순환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWelcome((prev) => (prev + 1) % welcomeMessages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [welcomeMessages.length])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden px-4">
      {/* 고급스러운 배경 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,255,0.15),transparent_50%)]" />
      
      {/* 움직이는 파티클 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* 헤더 섹션 */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-8 md:pt-12 pb-6">
        {/* 상단 아이콘과 제목 */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6 md:mb-8 text-center md:text-left">
          <div className="relative">
            <span className="text-5xl md:text-6xl text-purple-400 drop-shadow-2xl animate-bounce-slow">
              <FaCog />
            </span>
            <div className="absolute -top-2 -right-2 w-4 h-4 md:w-6 md:h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-2xl tracking-tight leading-tight">
              {typedText}
              {isTyping && <span className="animate-blink">|</span>}
            </h1>
            <div className="h-6 md:h-8 mt-2">
              <p className="text-lg md:text-xl lg:text-2xl text-purple-300 font-medium animate-fade-in-out">
                {welcomeMessages[currentWelcome]}
              </p>
            </div>
          </div>
        </div>

        {/* 관리자 메뉴 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-4xl">
          {adminMenus.map((menu, index) => (
            <button
              key={menu.href}
              onClick={() => router.push(menu.href)}
              className="group glass card-hover p-8 md:p-10 border border-white/10 text-left flex flex-col gap-4 md:gap-6 shadow-lg"
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-r ${menu.color} flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <menu.icon className="text-white text-xl md:text-2xl" />
              </div>
              <h3 className="gradient-text font-bold text-xl md:text-2xl mb-2 md:mb-3">{menu.label}</h3>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">{menu.desc}</p>
              <div className="flex items-center gap-2 mt-4 md:mt-6 text-purple-300 group-hover:text-purple-200 transition-colors">
                <span className="text-sm md:text-base font-semibold">관리하기</span>
                <FaArrowRight className="text-sm md:text-base group-hover:translate-x-2 transition-transform duration-200" />
              </div>
            </button>
          ))}
        </div>

        {/* 하단 통계 */}
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 mt-8 md:mt-12 text-white/60 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <FaGlobe className="text-purple-400" />
            <span>관리자 전용 대시보드</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCode className="text-pink-400" />
            <span>AI Mastery Hub 관리</span>
          </div>
        </div>
      </div>

      {/* 커스텀 애니메이션 스타일 */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
        @keyframes fade-in-out {
          0%, 100% { opacity: 0; transform: translateY(10px); }
          20%, 80% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 1.5s cubic-bezier(0.22,1,0.36,1) both;
        }
      `}</style>
    </div>
  )
} 
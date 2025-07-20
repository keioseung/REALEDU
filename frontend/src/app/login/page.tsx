"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <div className="glass rounded-2xl p-8 w-full max-w-sm shadow-lg text-center text-white">
        <h2 className="text-2xl font-bold mb-4 gradient-text">로그인 페이지가 변경되었습니다</h2>
        <p>이제 <b>/auth</b>에서 로그인 및 회원가입을 이용해 주세요.</p>
      </div>
    </div>
  )
} 
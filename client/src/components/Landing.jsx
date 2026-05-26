import React, { useState, useEffect } from 'react'
import Button from './ui/Button.jsx'

const CAMPAIGN = {
  name: 'Hà Nội Yên Của Tôi',
  brand: 'La Vie',
  startDate: '01/06/2024',
  endDate: '30/06/2024',
  description: 'Chia sẻ góc Yên của bạn, nhận quà thú vị từ La Vie',
}

const RULES = [
  'Chụp ảnh tự sướng hoặc chọn ảnh từ thư viện của bạn.',
  'Điền thông tin đăng ký tham gia chương trình.',
  'AI sẽ tự động tạo sticker chibi cá nhân hoá từ ảnh của bạn.',
  'Tải sticker về và chia sẻ lên mạng xã hội với hashtag #HàNộiYênCủaTôi.',
  'Mỗi người tham gia nhận được quà tặng đặc biệt từ La Vie.',
]

export default function Landing({ onStart }) {
  const [visible, setVisible] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)

  useEffect(() => {
    // Trigger fade-in animation
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        }}
      />

      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
      />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
      />

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col min-h-screen px-6 pt-16 pb-8 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Brand badge */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full border border-white/30">
            <span className="text-white font-bold text-sm tracking-wider uppercase">
              {CAMPAIGN.brand}
            </span>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Chibi emoji decoration */}
          <div className="text-7xl mb-6 animate-float select-none">🎨</div>

          {/* Campaign name */}
          <h1 className="text-4xl font-black text-white leading-tight mb-3 drop-shadow-lg">
            {CAMPAIGN.name}
          </h1>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-white/50" />
            <div className="w-2 h-2 rounded-full bg-white/70" />
            <div className="h-px w-12 bg-white/50" />
          </div>

          {/* Description */}
          <p className="text-white/90 text-lg leading-relaxed mb-6 max-w-xs">
            {CAMPAIGN.description}
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <FeatureBadge icon="✨" text="AI Chibi Sticker" />
            <FeatureBadge icon="🎁" text="Quà tặng hấp dẫn" />
            <FeatureBadge icon="📸" text="Ảnh cá nhân hoá" />
          </div>

          {/* Date */}
          <p className="text-white/70 text-sm mb-10">
            📅 {CAMPAIGN.startDate} — {CAMPAIGN.endDate}
          </p>
        </div>

        {/* CTA Button */}
        <div className="space-y-4 max-w-sm w-full mx-auto">
          <button
            onClick={onStart}
            className="w-full py-5 px-6 rounded-2xl text-indigo-700 font-black text-xl
              bg-white shadow-2xl shadow-purple-900/30
              hover:shadow-purple-900/50 hover:scale-[1.02]
              active:scale-95 transform transition-all duration-200
              border-b-4 border-indigo-100"
          >
            THAM GIA CHƯƠNG TRÌNH ✨
          </button>

          {/* Rules toggle */}
          <button
            onClick={() => setRulesOpen(!rulesOpen)}
            className="w-full py-3 px-4 rounded-xl text-white/80 text-sm font-medium
              border border-white/30 bg-white/10 backdrop-blur-sm
              hover:bg-white/20 transition-colors duration-150
              flex items-center justify-center gap-2"
          >
            <span>Thể lệ chương trình</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${rulesOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Rules content */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              rulesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">
                Thể lệ tham gia
              </h3>
              <ol className="space-y-2">
                {RULES.map((rule, i) => (
                  <li key={i} className="flex gap-3 text-white/80 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-white/40 text-xs">
            © 2024 {CAMPAIGN.brand} — Powered by AI
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureBadge({ icon, text }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
      <span className="text-sm">{icon}</span>
      <span className="text-white text-xs font-medium">{text}</span>
    </div>
  )
}

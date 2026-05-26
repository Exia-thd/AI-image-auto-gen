import React, { useState, useEffect, useRef } from 'react'
import Button from './ui/Button.jsx'

const MESSAGES = [
  'Đang phân tích khuôn mặt...',
  'Đang phác thảo nét chibi...',
  'Tô màu đang chờ...',
  'Thêm hiệu ứng đặc biệt...',
  'Hoàn thiện đường nét...',
  'Sắp xong rồi...',
]

export default function GeneratingView({ generatePromise, onComplete, onCancel }) {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [error, setError] = useState(null)
  const [isDone, setIsDone] = useState(false)
  const progressRef = useRef(progress)
  const cancelledRef = useRef(false)
  const timerRef = useRef(null)
  const msgTimerRef = useRef(null)

  progressRef.current = progress

  useEffect(() => {
    if (!generatePromise) return

    cancelledRef.current = false

    // Fake progress: 0 → 90 over ~25 seconds
    let currentProgress = 0
    const FAKE_DURATION_MS = 25000
    const INTERVAL_MS = 200
    const INCREMENT = 90 / (FAKE_DURATION_MS / INTERVAL_MS)

    timerRef.current = setInterval(() => {
      if (cancelledRef.current) return
      currentProgress = Math.min(currentProgress + INCREMENT, 90)
      setProgress(currentProgress)
    }, INTERVAL_MS)

    // Rotate messages
    msgTimerRef.current = setInterval(() => {
      if (cancelledRef.current) return
      setMessageIndex(i => (i + 1) % MESSAGES.length)
    }, 3500)

    // Resolve/reject the promise
    generatePromise
      .then((data) => {
        if (cancelledRef.current) return
        clearInterval(timerRef.current)
        clearInterval(msgTimerRef.current)

        // Animate from current to 100%
        setProgress(100)
        setIsDone(true)
        setMessageIndex(MESSAGES.length - 1) // "Sắp xong rồi..."

        setTimeout(() => {
          if (!cancelledRef.current) {
            onComplete(data)
          }
        }, 600)
      })
      .catch((err) => {
        if (cancelledRef.current) return
        clearInterval(timerRef.current)
        clearInterval(msgTimerRef.current)
        setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
      })

    return () => {
      clearInterval(timerRef.current)
      clearInterval(msgTimerRef.current)
    }
  }, [generatePromise])

  function handleCancel() {
    cancelledRef.current = true
    clearInterval(timerRef.current)
    clearInterval(msgTimerRef.current)
    onCancel()
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Tạo sticker thất bại</h2>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <div className="space-y-3">
            <Button onClick={onCancel}>
              Thử lại
            </Button>
            <p className="text-gray-400 text-xs">
              Nếu lỗi tiếp tục, vui lòng liên hệ ban tổ chức.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <div className="max-w-sm w-full text-center">
        {/* Animated chibi icon */}
        <div className="mb-8 relative">
          <div className="text-8xl animate-bounce-slow select-none">🎨</div>
          {/* Orbiting stars */}
          <div className="absolute top-0 right-8 text-2xl animate-spin-slow">⭐</div>
          <div className="absolute bottom-2 left-6 text-xl animate-float">✨</div>
          <div className="absolute top-4 left-10 text-lg" style={{ animation: 'float 2.5s ease-in-out infinite reverse' }}>💫</div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-white mb-2">
          {isDone ? 'Sticker đã sẵn sàng!' : 'Đang tạo sticker...'}
        </h2>

        {/* Message */}
        <p className="text-white/80 text-base mb-8 min-h-[1.5rem] transition-all duration-300">
          {isDone ? '🎉 Chibi của bạn đã được tạo xong!' : MESSAGES[messageIndex]}
        </p>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="bg-white/20 rounded-full h-3 overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #a5b4fc, #f9a8d4)',
              }}
            />
          </div>
          <p className="text-white/60 text-xs">{Math.round(progress)}%</p>
        </div>

        {/* Steps indicator */}
        <div className="flex justify-center gap-3 mb-10">
          {['Phân tích', 'Vẽ chibi', 'Tô màu', 'Hoàn thành'].map((step, i) => {
            const stepProgress = (i + 1) * 25
            const isActive = progress >= stepProgress
            return (
              <div key={step} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                    transition-all duration-300
                    ${isActive ? 'bg-white text-indigo-600 shadow-lg' : 'bg-white/20 text-white/50'}`}
                >
                  {isActive ? '✓' : i + 1}
                </div>
                <span className={`text-xs transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/40'}`}>
                  {step}
                </span>
              </div>
            )
          })}
        </div>

        {/* Cancel button */}
        {!isDone && (
          <button
            onClick={handleCancel}
            className="text-white/60 text-sm hover:text-white/90 transition-colors underline underline-offset-2"
          >
            Hủy và chọn lại ảnh
          </button>
        )}

        {/* Info note */}
        <p className="text-white/40 text-xs mt-4">
          Quá trình tạo sticker có thể mất 20-40 giây
        </p>
      </div>
    </div>
  )
}

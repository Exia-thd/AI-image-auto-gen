import React, { useState, useRef, useEffect, useCallback } from 'react'
import Button from './ui/Button.jsx'
import { useCanvas } from '../hooks/useCanvas.js'
import { downloadImage, shareImage } from '../utils/shareUtils.js'

const FRAMES = [
  { id: 'classic', name: 'Classic', color: '#6366f1', accent: '#a855f7' },
  { id: 'nature', name: 'Nature', color: '#10b981', accent: '#34d399' },
  { id: 'sunset', name: 'Sunset', color: '#f59e0b', accent: '#f97316' },
  { id: 'ocean', name: 'Ocean', color: '#0ea5e9', accent: '#06b6d4' },
]

export default function FrameComposer({ chibiData, formData, onRestart }) {
  const [selectedFrame, setSelectedFrame] = useState(FRAMES[0])
  const [userName, setUserName] = useState(formData?.fullName || '')
  const [compositeUrl, setCompositeUrl] = useState(null)
  const [compositing, setCompositing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const canvasRef = useRef(null)
  const { compositeImage } = useCanvas()

  const chibiBase64 = chibiData?.image || chibiData

  // Composite whenever frame or name changes
  useEffect(() => {
    if (!chibiBase64) return
    let cancelled = false

    async function doComposite() {
      setCompositing(true)
      try {
        const dataUrl = await compositeImage({
          chibiBase64,
          frame: selectedFrame,
          userName,
          outputSize: 1080,
        })
        if (!cancelled) {
          setCompositeUrl(dataUrl)
        }
      } catch (err) {
        console.error('Compositing error:', err)
      } finally {
        if (!cancelled) setCompositing(false)
      }
    }

    // Debounce for name input
    const timer = setTimeout(doComposite, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [chibiBase64, selectedFrame, userName, compositeImage])

  const handleDownload = useCallback(() => {
    if (!compositeUrl) return
    downloadImage(compositeUrl, `chibi-sticker-${Date.now()}.png`)
  }, [compositeUrl])

  const handleShare = useCallback(async () => {
    if (!compositeUrl) return
    try {
      await shareImage(compositeUrl, 'Hà Nội Yên Của Tôi - Sticker Chibi #LaVie')
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 3000)
    } catch (err) {
      // Fallback: download
      handleDownload()
    }
  }, [compositeUrl, handleDownload])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Sticker của bạn!</h1>
            <p className="text-xs text-gray-400">Tùy chỉnh và chia sẻ</p>
          </div>
          {/* Step indicator */}
          <div className="ml-auto flex gap-1.5">
            <div className="w-8 h-1.5 rounded-full bg-indigo-500" />
            <div className="w-8 h-1.5 rounded-full bg-indigo-500" />
            <div className="w-8 h-1.5 rounded-full bg-indigo-500" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-5 py-6 gap-5 max-w-lg mx-auto w-full">
        {/* Success message */}
        <div className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-indigo-700 font-semibold text-sm">Sticker chibi đã hoàn thành!</p>
            <p className="text-indigo-500 text-xs">Tùy chỉnh và chia sẻ ngay thôi!</p>
          </div>
        </div>

        {/* Sticker preview */}
        <div className="relative w-full max-w-xs">
          {compositing && (
            <div className="absolute inset-0 z-10 bg-white/70 rounded-3xl flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          )}
          {compositeUrl ? (
            <img
              src={compositeUrl}
              alt="Sticker chibi"
              className="w-full rounded-3xl shadow-2xl shadow-indigo-200"
            />
          ) : (
            <div className="w-full aspect-square rounded-3xl bg-gray-100 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Frame selector */}
        <div className="w-full">
          <p className="text-sm font-semibold text-gray-700 mb-3">Chọn khung:</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {FRAMES.map((frame) => (
              <button
                key={frame.id}
                onClick={() => setSelectedFrame(frame)}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all duration-150`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl border-3 transition-all duration-150
                    ${selectedFrame.id === frame.id
                      ? 'scale-110 shadow-lg'
                      : 'opacity-70 hover:opacity-100'
                    }`}
                  style={{
                    background: `linear-gradient(135deg, ${frame.color}, ${frame.accent})`,
                    border: selectedFrame.id === frame.id ? `3px solid ${frame.color}` : '3px solid transparent',
                    outline: selectedFrame.id === frame.id ? `2px solid ${frame.color}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
                <span className={`text-xs font-medium ${selectedFrame.id === frame.id ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {frame.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="w-full">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Tên hiển thị trên sticker:
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Nhập tên của bạn..."
            maxLength={30}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-800
              focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none
              transition-colors duration-150"
          />
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3 pb-6">
          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={!compositeUrl || compositing}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white
              bg-gradient-to-r from-indigo-500 to-purple-600
              hover:from-indigo-600 hover:to-purple-700
              active:scale-95 transform transition-all duration-150
              shadow-lg shadow-indigo-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
              flex items-center justify-center gap-2"
          >
            {shareSuccess ? (
              <>✅ Đã chia sẻ thành công!</>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                CHIA SẺ STICKER
              </>
            )}
          </button>

          {/* Download button */}
          <Button
            variant="secondary"
            onClick={handleDownload}
            disabled={!compositeUrl || compositing}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              TẢI XUỐNG
            </span>
          </Button>

          {/* Social share icons */}
          <div className="flex justify-center gap-4 py-2">
            <SocialButton
              icon="📘"
              label="Facebook"
              onClick={() => {
                const url = encodeURIComponent(window.location.href)
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
              }}
            />
            <SocialButton
              icon="🐦"
              label="Twitter"
              onClick={() => {
                const text = encodeURIComponent('Tôi vừa tạo sticker chibi từ ảnh của mình! #HàNộiYênCủaTôi #LaVie')
                window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
              }}
            />
            <SocialButton
              icon="📸"
              label="Instagram"
              onClick={handleDownload}
            />
          </div>

          {/* Hashtag hint */}
          <div className="text-center py-2">
            <p className="text-indigo-500 text-sm font-medium">#HàNộiYênCủaTôi #LaVie</p>
            <p className="text-gray-400 text-xs mt-1">Đừng quên tag chúng tôi khi chia sẻ!</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 my-2" />

          {/* Done button */}
          <Button variant="ghost" onClick={onRestart} className="w-full text-gray-500">
            🏠 Tham gia lại từ đầu
          </Button>
        </div>
      </div>
    </div>
  )
}

function SocialButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-3 rounded-2xl
        hover:bg-gray-100 active:scale-95 transform transition-all duration-150"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </button>
  )
}

import React, { useState, useRef, useCallback } from 'react'
import Button from './ui/Button.jsx'
import { fixOrientation, resizeImage, cropSquare, imageToBase64 } from '../utils/imageUtils.js'

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export default function PhotoUpload({ formData, onReady, onBack }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const processImage = useCallback(async (file) => {
    setError(null)
    setProcessing(true)
    setPreviewUrl(null)
    setImageBase64(null)

    try {
      // File size check
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`Ảnh quá lớn. Vui lòng chọn ảnh dưới ${MAX_FILE_SIZE_MB}MB.`)
        return
      }

      // File type check
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, HEIC, ...)')
        return
      }

      // Fix EXIF orientation
      let processed = await fixOrientation(file)

      // Resize to max 1024px
      processed = await resizeImage(processed, 1024)

      // Crop to square
      processed = await cropSquare(processed)

      // Convert to base64
      const base64 = await imageToBase64(processed)

      // Set preview
      const objectUrl = URL.createObjectURL(processed)
      setPreviewUrl(objectUrl)
      setImageBase64(base64)
    } catch (err) {
      console.error('Image processing error:', err)
      setError('Không thể xử lý ảnh. Vui lòng thử ảnh khác.')
    } finally {
      setProcessing(false)
    }
  }, [])

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
    // Reset input value to allow re-selecting same file
    e.target.value = ''
  }, [processImage])

  const handleGenerate = useCallback(() => {
    if (!imageBase64 || !formData) return

    // Create the API call promise
    const generatePromise = fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formData.phone,
        image: imageBase64,
      }),
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi tạo sticker. Vui lòng thử lại.')
      }
      return data
    })

    onReady({ previewUrl, imageBase64 }, generatePromise)
  }, [imageBase64, formData, previewUrl, onReady])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center px-4 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors mr-3 -ml-1"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="font-bold text-gray-900 text-lg">Chụp ảnh selfie</h1>
          <p className="text-xs text-gray-400">Bước cuối cùng!</p>
        </div>
        {/* Step indicator */}
        <div className="ml-auto flex gap-1.5">
          <div className="w-8 h-1.5 rounded-full bg-indigo-500" />
          <div className="w-8 h-1.5 rounded-full bg-indigo-500" />
          <div className="w-8 h-1.5 rounded-full bg-indigo-200" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-5 py-6 gap-5 max-w-lg mx-auto w-full">
        {/* Instructions */}
        <div className="text-center">
          <div className="text-5xl mb-3">📸</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ảnh của bạn</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Chụp ảnh selfie hoặc chọn ảnh từ thư viện.
            <br />AI sẽ tạo sticker chibi cá nhân hoá từ ảnh của bạn!
          </p>
        </div>

        {/* Photo preview area */}
        <div
          className={`relative w-full max-w-xs aspect-square rounded-3xl overflow-hidden
            border-4 border-dashed transition-all duration-200
            ${previewUrl
              ? 'border-indigo-300 shadow-lg shadow-indigo-100'
              : processing
              ? 'border-indigo-300 bg-indigo-50'
              : 'border-gray-200 bg-gray-100'
            }`}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Ảnh đã chọn"
                className="w-full h-full object-cover"
              />
              {/* Change photo button overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm
                  px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700
                  shadow-lg hover:bg-white transition-colors"
              >
                Đổi ảnh
              </button>
            </>
          ) : processing ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-indigo-600 text-sm font-medium">Đang xử lý ảnh...</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <div className="text-5xl opacity-30">🖼️</div>
              <p className="text-gray-400 text-sm text-center px-4">
                Nhấn nút bên dưới để chọn ảnh
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full max-w-xs bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-2">
            <span className="text-red-500 mt-0.5">⚠️</span>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Photo selection buttons */}
        <div className="w-full max-w-xs flex gap-3">
          {/* Camera button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={processing}
            className="flex-1 py-4 rounded-2xl flex flex-col items-center gap-2
              bg-white border-2 border-gray-200 shadow-sm
              hover:border-indigo-300 hover:shadow-indigo-100 hover:shadow-md
              active:scale-95 transform transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-2xl">📷</span>
            <span className="text-xs font-semibold text-gray-600">Chụp ảnh</span>
          </button>

          {/* Gallery button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="flex-1 py-4 rounded-2xl flex flex-col items-center gap-2
              bg-white border-2 border-gray-200 shadow-sm
              hover:border-indigo-300 hover:shadow-indigo-100 hover:shadow-md
              active:scale-95 transform transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-2xl">🖼️</span>
            <span className="text-xs font-semibold text-gray-600">Thư viện</span>
          </button>
        </div>

        {/* Tips */}
        {!previewUrl && (
          <div className="w-full max-w-xs bg-indigo-50 rounded-2xl p-4">
            <p className="text-indigo-700 text-xs font-semibold mb-2">💡 Gợi ý để có sticker đẹp nhất:</p>
            <ul className="text-indigo-600 text-xs space-y-1">
              <li>• Ảnh rõ mặt, đủ ánh sáng</li>
              <li>• Nhìn thẳng vào camera</li>
              <li>• Nền đơn giản, không rối</li>
              <li>• Không đeo kính râm</li>
            </ul>
          </div>
        )}

        {/* Generate button */}
        <div className="w-full max-w-xs mt-auto pb-6">
          <Button
            disabled={!imageBase64 || processing}
            onClick={handleGenerate}
          >
            {processing ? 'Đang xử lý...' : '✨ TẠO STICKER NGAY'}
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

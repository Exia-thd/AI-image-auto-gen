import React, { useState } from 'react'
import Button from './ui/Button.jsx'
import Input from './ui/Input.jsx'

const PHONE_REGEX = /^(0[2-9]\d{8}|84[2-9]\d{8})$/

const FIELDS = [
  { key: 'fullName', label: 'Họ và tên', type: 'text', required: true, placeholder: 'Nguyễn Văn A' },
  { key: 'phone', label: 'Số điện thoại', type: 'tel', required: true, placeholder: '0912 345 678', hint: 'Dùng để quản lý lượt tạo sticker' },
  { key: 'email', label: 'Email', type: 'email', required: false, placeholder: 'email@example.com' },
  { key: 'story', label: 'Câu chuyện của bạn', type: 'textarea', required: false, placeholder: 'Góc Yên của bạn là gì?', maxLength: 500 },
]

export default function InfoForm({ onComplete, onBack }) {
  const [formValues, setFormValues] = useState({
    fullName: '',
    phone: '',
    email: '',
    story: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(message, type = 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormValues(prev => ({ ...prev, [name]: value }))
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  function validate() {
    const newErrors = {}

    if (!formValues.fullName || formValues.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.'
    }

    const normalizedPhone = formValues.phone.replace(/\s+/g, '').replace(/^\+84/, '84')
    if (!normalizedPhone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại.'
    } else if (!PHONE_REGEX.test(normalizedPhone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ. Ví dụ: 0912 345 678'
    }

    if (formValues.email && formValues.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formValues.email.trim())) {
        newErrors.email = 'Địa chỉ email không hợp lệ.'
      }
    }

    if (formValues.story && formValues.story.length > 500) {
      newErrors.story = 'Câu chuyện không được vượt quá 500 ký tự.'
    }

    return newErrors
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!termsAccepted) {
      showToast('Vui lòng đồng ý với điều khoản tham gia.')
      return
    }

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formValues.fullName.trim(),
          phone: formValues.phone.replace(/\s+/g, ''),
          email: formValues.email.trim(),
          story: formValues.story.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors)
        }
        showToast(data.error || 'Đăng ký thất bại. Vui lòng thử lại.')
        return
      }

      // Success - move to next step
      onComplete({
        ...formValues,
        phone: formValues.phone.replace(/\s+/g, ''),
        submissionId: data.id,
      })
    } catch (err) {
      console.error('Submit error:', err)
      showToast('Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.')
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="font-bold text-gray-900 text-lg leading-tight">Thông tin tham gia</h1>
          <p className="text-xs text-gray-400 font-medium">Hà Nội Yên Của Tôi • La Vie</p>
        </div>
        {/* Step indicator */}
        <div className="ml-auto flex gap-1.5">
          <div className="w-8 h-1.5 rounded-full bg-indigo-500" />
          <div className="w-8 h-1.5 rounded-full bg-indigo-200" />
          <div className="w-8 h-1.5 rounded-full bg-indigo-200" />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-5 py-6 gap-4 max-w-lg mx-auto w-full">
        {/* Greeting */}
        <div className="text-center pb-2">
          <div className="text-4xl mb-2">👋</div>
          <p className="text-gray-600 text-sm">Điền thông tin để nhận sticker chibi cá nhân hoá!</p>
        </div>

        {/* Fields */}
        {FIELDS.map((field) => (
          <Input
            key={field.key}
            name={field.key}
            label={field.label}
            type={field.type}
            value={formValues[field.key]}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            maxLength={field.maxLength}
            error={errors[field.key]}
            hint={field.hint}
          />
        ))}

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mt-1">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="sr-only peer"
            />
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
              ${termsAccepted ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-gray-300 hover:border-indigo-300'}`}
              onClick={() => setTermsAccepted(!termsAccepted)}
            >
              {termsAccepted && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-600 leading-relaxed">
            Tôi đồng ý với{' '}
            <span className="text-indigo-600 font-medium">điều khoản sử dụng</span>
            {' '}và cho phép La Vie sử dụng thông tin cho mục đích marketing.
          </span>
        </label>

        {/* Submit button */}
        <div className="pt-2 pb-6">
          <Button
            type="submit"
            loading={loading}
            disabled={!termsAccepted}
          >
            {loading ? 'Đang đăng ký...' : 'TIẾP TỤC →'}
          </Button>
        </div>
      </form>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-4 right-4 mx-auto max-w-sm z-50
            rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3
            animate-slide-up
            ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
        >
          <span className="text-lg">{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}
    </div>
  )
}

import React from 'react'

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  maxLength,
  rows = 4,
  className = '',
  hint,
}) {
  const baseClasses = `
    w-full px-4 py-3 rounded-xl border-2 text-gray-800 text-base
    placeholder-gray-400 bg-white
    transition-colors duration-150 outline-none
    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
    ${error ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100' : 'border-gray-200'}
  `

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 text-xs">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className={`${baseClasses} resize-none`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className={baseClasses}
          autoComplete={type === 'tel' ? 'tel' : type === 'email' ? 'email' : 'off'}
          inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : 'text'}
        />
      )}

      {/* Character count for textarea */}
      {type === 'textarea' && maxLength && (
        <div className="flex justify-end">
          <span className={`text-xs ${value?.length >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
            {value?.length || 0}/{maxLength}
          </span>
        </div>
      )}

      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

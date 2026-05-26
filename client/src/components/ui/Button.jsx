import React from 'react'

const variants = {
  primary: `
    w-full py-4 px-6 rounded-2xl text-white font-bold text-lg
    bg-gradient-to-r from-indigo-500 to-purple-600
    hover:from-indigo-600 hover:to-purple-700
    active:scale-95 transform transition-all duration-150
    shadow-lg shadow-indigo-200
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `,
  secondary: `
    w-full py-3 px-6 rounded-2xl font-semibold text-base
    border-2 border-indigo-300 text-indigo-600
    hover:bg-indigo-50 active:scale-95 transform transition-all duration-150
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `,
  danger: `
    w-full py-3 px-6 rounded-2xl font-semibold text-base
    border-2 border-red-300 text-red-500
    hover:bg-red-50 active:scale-95 transform transition-all duration-150
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `,
  ghost: `
    py-2 px-4 rounded-xl font-medium text-sm text-gray-500
    hover:text-gray-700 hover:bg-gray-100
    active:scale-95 transform transition-all duration-150
  `,
}

export default function Button({
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

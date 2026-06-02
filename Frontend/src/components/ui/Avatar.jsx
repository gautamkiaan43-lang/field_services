import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

function getInitials(name) {
  const cleaned = (name || '').trim()
  if (!cleaned) return '?'
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase()
}

function resolveSrc(src) {
  if (!src) return null
  if (typeof src !== 'string') return null
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src
  if (src.startsWith('/')) return src
  // Treat as uploads filename/path from backend
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  const origin = apiBase.replace(/\/api\/?$/, '')
  return `${origin}/uploads/${src}`
}

export function Avatar({
  name,
  src,
  className,
  imgClassName,
  alt = '',
  ...props
}) {
  const [imgFailed, setImgFailed] = React.useState(false)
  const resolvedSrc = resolveSrc(src)
  const initials = getInitials(name)

  const base = cn(
    'relative inline-flex items-center justify-center overflow-hidden select-none',
    'bg-gradient-to-br from-brand-cyan/20 via-brand-teal/10 to-brand-purple/20',
    'text-white font-bold',
    className
  )

  if (resolvedSrc && !imgFailed) {
    return (
      <img
        {...props}
        src={resolvedSrc}
        alt={alt}
        className={cn('object-cover', className, imgClassName)}
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <div {...props} className={base} aria-label={alt || name || 'avatar'}>
      <span className="leading-none">{initials}</span>
    </div>
  )
}


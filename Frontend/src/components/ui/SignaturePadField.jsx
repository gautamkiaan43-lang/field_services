import React, { useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'

export const isSignatureImageDataUrl = (value) =>
  typeof value === 'string' && value.startsWith('data:image/')

export function SignaturePadField({ value, onChange, height = 140 }) {
  const signatureRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!value && signatureRef.current) {
      signatureRef.current.clear()
    }
  }, [value])

  useEffect(() => {
    const sig = signatureRef.current
    const parent = containerRef.current
    if (!sig || !parent) return

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width))
      const h = height
      const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
      const canvas = sig.getCanvas()
      canvas.width = w * ratio
      canvas.height = h * ratio
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(ratio, ratio)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }

    resize()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    ro?.observe(parent)
    window.addEventListener('resize', resize)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [height])

  const handleClear = () => {
    signatureRef.current?.clear()
    onChange('')
  }

  const handleEnd = () => {
    const canvas = signatureRef.current
    if (!canvas) return
    if (canvas.isEmpty()) {
      onChange('')
      return
    }
    onChange(canvas.toDataURL('image/png'))
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full rounded-xl border border-white/10 overflow-hidden min-h-[80px] bg-slate-100"
      >
        <SignatureCanvas
          ref={signatureRef}
          penColor="#0f172a"
          backgroundColor="#f1f5f9"
          onEnd={handleEnd}
          canvasProps={{
            className: 'w-full touch-none',
            style: { height: `${height}px`, backgroundColor: '#f1f5f9' }
          }}
        />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
          Draw signature using mouse or touch
        </p>
        <button
          type="button"
          onClick={handleClear}
          disabled={!value}
          className="text-[11px] px-3 py-1 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-40"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

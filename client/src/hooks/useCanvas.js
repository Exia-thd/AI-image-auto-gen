import { useCallback } from 'react'

/**
 * Hook for canvas compositing operations.
 * Layers: white background → chibi image → frame overlay → username text
 */
export function useCanvas() {
  /**
   * Load an image from a URL or base64 string into an HTMLImageElement
   */
  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(new Error(`Failed to load image: ${src.substring(0, 50)}`))
      img.src = src
    })
  }, [])

  /**
   * Draw a decorative frame onto the canvas context
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} size - Canvas size
   * @param {{ color: string, accent: string, name: string }} frame
   */
  const drawFrame = useCallback((ctx, size, frame) => {
    const borderWidth = Math.round(size * 0.022) // ~24px at 1080
    const cornerRadius = Math.round(size * 0.055) // ~60px at 1080

    // Outer border gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, frame.color)
    gradient.addColorStop(1, frame.accent)

    // Draw rounded rectangle border
    ctx.strokeStyle = gradient
    ctx.lineWidth = borderWidth * 2
    ctx.lineJoin = 'round'

    // Rounded rect path
    const offset = borderWidth
    ctx.beginPath()
    ctx.moveTo(offset + cornerRadius, offset)
    ctx.lineTo(size - offset - cornerRadius, offset)
    ctx.quadraticCurveTo(size - offset, offset, size - offset, offset + cornerRadius)
    ctx.lineTo(size - offset, size - offset - cornerRadius)
    ctx.quadraticCurveTo(size - offset, size - offset, size - offset - cornerRadius, size - offset)
    ctx.lineTo(offset + cornerRadius, size - offset)
    ctx.quadraticCurveTo(offset, size - offset, offset, size - offset - cornerRadius)
    ctx.lineTo(offset, offset + cornerRadius)
    ctx.quadraticCurveTo(offset, offset, offset + cornerRadius, offset)
    ctx.closePath()
    ctx.stroke()

    // Corner decorations
    const cornerSize = Math.round(size * 0.07)
    const cornerOffset = Math.round(size * 0.03)
    const corners = [
      { x: cornerOffset, y: cornerOffset },
      { x: size - cornerOffset - cornerSize, y: cornerOffset },
      { x: cornerOffset, y: size - cornerOffset - cornerSize },
      { x: size - cornerOffset - cornerSize, y: size - cornerOffset - cornerSize },
    ]

    corners.forEach((corner) => {
      ctx.fillStyle = frame.color
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.arc(corner.x + cornerSize / 2, corner.y + cornerSize / 2, cornerSize / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // Brand watermark at bottom
    const brandText = 'La Vie × Hà Nội Yên Của Tôi'
    const brandFontSize = Math.round(size * 0.028)
    ctx.font = `bold ${brandFontSize}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Brand text background pill
    const textMetrics = ctx.measureText(brandText)
    const pillW = textMetrics.width + brandFontSize * 2
    const pillH = brandFontSize * 1.8
    const pillX = size / 2 - pillW / 2
    const pillY = size - Math.round(size * 0.07)

    ctx.fillStyle = gradient
    ctx.globalAlpha = 0.9
    roundRect(ctx, pillX, pillY - pillH / 2, pillW, pillH, pillH / 2)
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.fillStyle = '#ffffff'
    ctx.fillText(brandText, size / 2, pillY)
  }, [])

  /**
   * Draw user name text on canvas
   */
  const drawUserName = useCallback((ctx, size, name, frame) => {
    if (!name || !name.trim()) return

    const fontSize = Math.round(size * 0.042)
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const text = name.trim()
    const textMetrics = ctx.measureText(text)
    const pillW = textMetrics.width + fontSize * 2
    const pillH = fontSize * 1.8
    const pillX = size / 2 - pillW / 2
    const pillY = Math.round(size * 0.12)

    // Background
    ctx.fillStyle = frame.color
    ctx.globalAlpha = 0.85
    roundRect(ctx, pillX, pillY - pillH / 2, pillW, pillH, pillH / 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // Text
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, size / 2, pillY)
  }, [])

  /**
   * Main compositing function
   */
  const compositeImage = useCallback(async ({
    chibiBase64,
    frame,
    userName,
    outputSize = 1080,
  }) => {
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')

    // Layer 1: White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outputSize, outputSize)

    // Layer 2: Chibi image (centered with padding)
    const padding = Math.round(outputSize * 0.08) // 8% padding
    const chibiSize = outputSize - padding * 2

    let chibiSrc = chibiBase64
    if (chibiBase64 && !chibiBase64.startsWith('data:')) {
      chibiSrc = `data:image/png;base64,${chibiBase64}`
    }

    try {
      const chibiImg = await loadImage(chibiSrc)
      ctx.drawImage(chibiImg, padding, padding, chibiSize, chibiSize)
    } catch (err) {
      console.error('Failed to draw chibi image:', err)
      // Draw placeholder
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(padding, padding, chibiSize, chibiSize)
      ctx.fillStyle = '#aaa'
      ctx.font = `${outputSize * 0.05}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('🎨 Chibi', outputSize / 2, outputSize / 2)
    }

    // Layer 3: Frame overlay
    drawFrame(ctx, outputSize, frame)

    // Layer 4: User name
    drawUserName(ctx, outputSize, userName, frame)

    return canvas.toDataURL('image/png', 0.92)
  }, [loadImage, drawFrame, drawUserName])

  return { compositeImage }
}

/**
 * Helper: draw a rounded rectangle path
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

export default useCanvas

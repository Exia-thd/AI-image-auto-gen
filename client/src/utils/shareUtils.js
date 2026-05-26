/**
 * Sharing and downloading utilities.
 * Uses Web Share API with fallback to download.
 */

/**
 * Download a data URL as a file.
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {string} filename - Output filename
 */
export function downloadImage(dataUrl, filename = 'chibi-sticker.png') {
  try {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // Revoke object URL if it was one
    if (dataUrl.startsWith('blob:')) {
      URL.revokeObjectURL(dataUrl)
    }
  } catch (err) {
    console.error('Download failed:', err)
    // Last resort: open in new tab
    window.open(dataUrl, '_blank')
  }
}

/**
 * Share an image using the Web Share API, falling back to download.
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {string} title - Share title / caption
 * @returns {Promise<'shared' | 'downloaded'>} - Result method
 */
export async function shareImage(dataUrl, title = 'Chibi Sticker') {
  // Convert data URL to Blob for sharing
  const blob = await dataUrlToBlob(dataUrl)
  const file = new File([blob], 'chibi-sticker.png', { type: 'image/png' })

  // Try Web Share API (mobile-first)
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text: 'Tôi vừa tạo sticker chibi từ ảnh của mình! #HàNộiYênCủaTôi #LaVie',
        files: [file],
      })
      return 'shared'
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share API failed:', err)
      } else {
        // User cancelled
        throw err
      }
    }
  }

  // Try text-only Web Share API (without files)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: 'Tôi vừa tạo sticker chibi từ ảnh của mình! #HàNộiYênCủaTôi #LaVie',
        url: window.location.href,
      })
      return 'shared'
    } catch (err) {
      if (err.name === 'AbortError') throw err
      console.warn('Text share failed:', err)
    }
  }

  // Fallback: download
  downloadImage(dataUrl, `chibi-sticker-${Date.now()}.png`)
  return 'downloaded'
}

/**
 * Convert a base64 data URL to a Blob.
 * @param {string} dataUrl - Data URL string
 * @returns {Promise<Blob>}
 */
export function dataUrlToBlob(dataUrl) {
  return new Promise((resolve, reject) => {
    try {
      const [header, base64] = dataUrl.split(',')
      const mimeMatch = header.match(/:(.*?);/)
      const mime = mimeMatch ? mimeMatch[1] : 'image/png'
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      resolve(new Blob([bytes], { type: mime }))
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Copy image data URL to clipboard (as PNG)
 * @param {string} dataUrl - Image data URL
 * @returns {Promise<boolean>} - Success
 */
export async function copyImageToClipboard(dataUrl) {
  try {
    const blob = await dataUrlToBlob(dataUrl)
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ])
    return true
  } catch (err) {
    console.warn('Clipboard write failed:', err)
    return false
  }
}

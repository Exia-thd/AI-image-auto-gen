/**
 * Image utility functions for processing photos before AI generation.
 * Manual EXIF orientation fix without external libraries.
 */

/**
 * Read EXIF orientation tag from a JPEG file
 * Returns orientation value (1-8) or 1 if not found
 */
async function getExifOrientation(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target.result)

        // Check JPEG SOI marker
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve(1)
          return
        }

        let offset = 2
        const length = view.byteLength

        while (offset < length) {
          const marker = view.getUint16(offset, false)
          offset += 2

          // APP1 marker (contains EXIF)
          if (marker === 0xFFE1) {
            // Check for "Exif" string
            if (view.getUint32(offset + 2, false) !== 0x45786966) {
              resolve(1)
              return
            }

            const little = view.getUint16(offset + 8, false) === 0x4949
            offset += 8

            const tags = view.getUint16(offset + 8, little)
            offset += 10

            for (let i = 0; i < tags; i++) {
              if (view.getUint16(offset + (i * 12), little) === 0x0112) {
                resolve(view.getUint16(offset + (i * 12) + 8, little))
                return
              }
            }
          } else if ((marker & 0xFF00) !== 0xFF00) {
            break
          } else {
            offset += view.getUint16(offset, false)
          }
        }
        resolve(1)
      } catch {
        resolve(1)
      }
    }
    reader.onerror = () => resolve(1)
    // Only read first 64KB for EXIF data
    reader.readAsArrayBuffer(file.slice(0, 65536))
  })
}

/**
 * Fix EXIF orientation of an image file.
 * Reads EXIF, rotates canvas to correct orientation.
 * @param {File} file - Input image file
 * @returns {Promise<Blob>} - Corrected image blob
 */
export async function fixOrientation(file) {
  // Only JPEG files have EXIF orientation
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
    return file
  }

  const orientation = await getExifOrientation(file)

  // If no rotation needed (orientation 1 or unknown), return as-is
  if (orientation <= 1) return file

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Determine canvas dimensions based on orientation
      if (orientation > 4) {
        canvas.width = img.height
        canvas.height = img.width
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }

      // Apply transform based on EXIF orientation
      switch (orientation) {
        case 2: ctx.transform(-1, 0, 0, 1, img.width, 0); break
        case 3: ctx.transform(-1, 0, 0, -1, img.width, img.height); break
        case 4: ctx.transform(1, 0, 0, -1, 0, img.height); break
        case 5: ctx.transform(0, 1, 1, 0, 0, 0); break
        case 6: ctx.transform(0, 1, -1, 0, img.height, 0); break
        case 7: ctx.transform(0, -1, -1, 0, img.height, img.width); break
        case 8: ctx.transform(0, -1, 1, 0, 0, img.width); break
        default: break
      }

      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        0.92
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

/**
 * Resize an image blob to fit within maxSize x maxSize, preserving aspect ratio.
 * @param {Blob} blob - Input image blob
 * @param {number} maxSize - Maximum width or height in pixels
 * @returns {Promise<Blob>} - Resized image blob
 */
export function resizeImage(blob, maxSize = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const { width, height } = img

      // No resize needed if already small enough
      if (width <= maxSize && height <= maxSize) {
        resolve(blob)
        return
      }

      // Calculate new dimensions preserving aspect ratio
      const scale = maxSize / Math.max(width, height)
      const newWidth = Math.round(width * scale)
      const newHeight = Math.round(height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = newWidth
      canvas.height = newHeight
      const ctx = canvas.getContext('2d')

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      canvas.toBlob(
        (resizedBlob) => {
          if (resizedBlob) {
            resolve(resizedBlob)
          } else {
            reject(new Error('Failed to resize image'))
          }
        },
        blob.type || 'image/jpeg',
        0.85
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for resizing'))
    }

    img.src = objectUrl
  })
}

/**
 * Center-crop an image blob to a square.
 * @param {Blob} blob - Input image blob
 * @returns {Promise<Blob>} - Square cropped image blob
 */
export function cropSquare(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const { width, height } = img
      const size = Math.min(width, height)
      const x = Math.floor((width - size) / 2)
      const y = Math.floor((height - size) / 2)

      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, x, y, size, size, 0, 0, size, size)

      canvas.toBlob(
        (croppedBlob) => {
          if (croppedBlob) {
            resolve(croppedBlob)
          } else {
            reject(new Error('Failed to crop image'))
          }
        },
        blob.type || 'image/jpeg',
        0.92
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for cropping'))
    }

    img.src = objectUrl
  })
}

/**
 * Convert a blob to a base64 data URL.
 * @param {Blob} blob - Input image blob
 * @returns {Promise<string>} - Base64 data URL string
 */
export function imageToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Failed to convert image to base64'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Hash an image base64 string using SubtleCrypto SHA-256.
 * @param {string} base64 - Base64 data URL or raw base64 string
 * @returns {Promise<string>} - First 16 characters of the hex hash
 */
export async function hashImage(base64) {
  try {
    // Strip data URL prefix
    const raw = base64.includes(',') ? base64.split(',')[1] : base64

    // Decode base64 to bytes
    const binaryStr = atob(raw)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    // Hash with SubtleCrypto
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return hashHex.substring(0, 16)
  } catch (err) {
    console.error('Hash error:', err)
    // Fallback: use simple string hash
    return Math.random().toString(36).substring(2, 18)
  }
}

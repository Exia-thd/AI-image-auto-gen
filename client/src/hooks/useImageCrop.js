import { useState, useCallback } from 'react'

/**
 * Hook for managing image crop state.
 * v1: basic center crop (no drag interaction needed).
 */
export function useImageCrop(initialSize = 1.0) {
  const [cropScale, setCropScale] = useState(initialSize)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const resetCrop = useCallback(() => {
    setCropScale(initialSize)
    setCropOffset({ x: 0, y: 0 })
  }, [initialSize])

  const zoomIn = useCallback(() => {
    setCropScale(prev => Math.min(prev + 0.1, 3.0))
  }, [])

  const zoomOut = useCallback(() => {
    setCropScale(prev => Math.max(prev - 0.1, 0.5))
  }, [])

  /**
   * Calculate the crop rectangle for a center crop
   * @param {number} imageWidth - Source image width
   * @param {number} imageHeight - Source image height
   * @returns {{ x, y, size }} - Crop parameters
   */
  const getCropRect = useCallback((imageWidth, imageHeight) => {
    const size = Math.min(imageWidth, imageHeight)
    const x = (imageWidth - size) / 2 + cropOffset.x
    const y = (imageHeight - size) / 2 + cropOffset.y
    return { x: Math.max(0, x), y: Math.max(0, y), size }
  }, [cropOffset])

  return {
    cropScale,
    cropOffset,
    isDragging,
    setIsDragging,
    setCropOffset,
    resetCrop,
    zoomIn,
    zoomOut,
    getCropRect,
  }
}

export default useImageCrop

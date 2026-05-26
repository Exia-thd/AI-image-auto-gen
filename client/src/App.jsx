import React, { useState, useCallback } from 'react'
import Landing from './components/Landing.jsx'
import InfoForm from './components/InfoForm.jsx'
import PhotoUpload from './components/PhotoUpload.jsx'
import GeneratingView from './components/GeneratingView.jsx'
import FrameComposer from './components/FrameComposer.jsx'

// Steps: 1=Landing, 2=InfoForm, 3=PhotoUpload, 3.5=Generating, 4=FrameComposer
const STEPS = {
  LANDING: 1,
  FORM: 2,
  PHOTO: 3,
  GENERATING: 3.5,
  FRAME: 4,
}

export default function App() {
  const [currentStep, setCurrentStep] = useState(STEPS.LANDING)
  const [formData, setFormData] = useState(null)
  const [photoData, setPhotoData] = useState(null)
  const [chibiData, setChibiData] = useState(null)
  const [generatePromise, setGeneratePromise] = useState(null)

  const goToStep = useCallback((step) => {
    setCurrentStep(step)
  }, [])

  const handleLandingComplete = useCallback(() => {
    setCurrentStep(STEPS.FORM)
  }, [])

  const handleFormComplete = useCallback((data) => {
    setFormData(data)
    setCurrentStep(STEPS.PHOTO)
  }, [])

  const handlePhotoReady = useCallback((photo, promise) => {
    setPhotoData(photo)
    setGeneratePromise(() => promise)
    setCurrentStep(STEPS.GENERATING)
  }, [])

  const handleGenerateComplete = useCallback((chibi) => {
    setChibiData(chibi)
    setCurrentStep(STEPS.FRAME)
  }, [])

  const handleGenerateCancel = useCallback(() => {
    setCurrentStep(STEPS.PHOTO)
    setGeneratePromise(null)
  }, [])

  const handleRestart = useCallback(() => {
    setCurrentStep(STEPS.LANDING)
    setFormData(null)
    setPhotoData(null)
    setChibiData(null)
    setGeneratePromise(null)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        key={currentStep}
        className="animate-fade-in"
      >
        {currentStep === STEPS.LANDING && (
          <Landing onStart={handleLandingComplete} />
        )}

        {currentStep === STEPS.FORM && (
          <InfoForm
            onComplete={handleFormComplete}
            onBack={() => setCurrentStep(STEPS.LANDING)}
          />
        )}

        {currentStep === STEPS.PHOTO && (
          <PhotoUpload
            formData={formData}
            onReady={handlePhotoReady}
            onBack={() => setCurrentStep(STEPS.FORM)}
          />
        )}

        {currentStep === STEPS.GENERATING && (
          <GeneratingView
            generatePromise={generatePromise}
            onComplete={handleGenerateComplete}
            onCancel={handleGenerateCancel}
          />
        )}

        {currentStep === STEPS.FRAME && (
          <FrameComposer
            chibiData={chibiData}
            formData={formData}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  )
}

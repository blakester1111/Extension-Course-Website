'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'
import type { TourStep } from './tour-steps'

interface GuidedTourProps {
  steps: TourStep[]
  storageKey: string
  onComplete: () => void
}

export function GuidedTour({ steps, storageKey, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; arrowSide: string }>({ top: 0, left: 0, arrowSide: 'left' })
  const [visible, setVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1

  const positionTooltip = useCallback(() => {
    if (!step) return

    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (!el) {
      // Element not found — skip to next or finish
      if (!isLast) {
        setCurrentStep(prev => prev + 1)
      } else {
        handleFinish()
      }
      return
    }

    const rect = el.getBoundingClientRect()
    const tooltip = tooltipRef.current
    const tooltipW = tooltip?.offsetWidth || 320
    const tooltipH = tooltip?.offsetHeight || 120
    const pad = 12

    // Highlight the element
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    let top = 0
    let left = 0
    let arrowSide = 'left'
    const placement = step.placement || 'right'

    switch (placement) {
      case 'right':
        top = rect.top + rect.height / 2 - tooltipH / 2
        left = rect.right + pad
        arrowSide = 'left'
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipH / 2
        left = rect.left - tooltipW - pad
        arrowSide = 'right'
        break
      case 'bottom':
        top = rect.bottom + pad
        left = rect.left + rect.width / 2 - tooltipW / 2
        arrowSide = 'top'
        break
      case 'top':
        top = rect.top - tooltipH - pad
        left = rect.left + rect.width / 2 - tooltipW / 2
        arrowSide = 'bottom'
        break
    }

    // Clamp within viewport
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipH - 8))
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8))

    setTooltipPos({ top, left, arrowSide })
    setVisible(true)
  }, [step, isLast])

  useEffect(() => {
    // Small delay to let sidebar expand if needed
    const timer = setTimeout(positionTooltip, 300)
    window.addEventListener('resize', positionTooltip)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', positionTooltip)
    }
  }, [currentStep, positionTooltip])

  function handleFinish() {
    localStorage.setItem(storageKey, 'true')
    setVisible(false)
    onComplete()
  }

  function handleNext() {
    if (isLast) {
      handleFinish()
    } else {
      setVisible(false)
      setCurrentStep(prev => prev + 1)
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setVisible(false)
      setCurrentStep(prev => prev - 1)
    }
  }

  function handleSkip() {
    handleFinish()
  }

  if (!step || !visible) return null

  // Build highlight ring around target element
  const targetEl = document.querySelector(`[data-tour="${step.target}"]`)
  const targetRect = targetEl?.getBoundingClientRect()

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[60] pointer-events-none">
        {/* Semi-transparent backdrop with cutout for target */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 4}
                  y={targetRect.top - 4}
                  width={targetRect.width + 8}
                  height={targetRect.height + 8}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.5)"
            mask="url(#tour-mask)"
          />
        </svg>

        {/* Highlight ring */}
        {targetRect && (
          <div
            className="absolute border-2 border-primary rounded-lg pointer-events-none"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[61] w-80 bg-background border rounded-xl shadow-2xl pointer-events-auto"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm">{step.title}</h3>
            <button
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 rounded-b-xl">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} of {steps.length}
          </span>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={handlePrev} className="h-7 px-2 text-xs">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="h-7 px-3 text-xs">
              {isLast ? 'Finish' : 'Next'}
              {!isLast && <ArrowRight className="h-3 w-3 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

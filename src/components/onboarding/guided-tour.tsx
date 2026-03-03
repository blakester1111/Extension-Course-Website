'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  Award,
  UserCircle,
  Settings2,
} from 'lucide-react'
import type { TourStep } from './tour-steps'

const ICON_MAP: Record<string, React.ElementType> = {
  book: BookOpen,
  clipboard: ClipboardCheck,
  award: Award,
  user: UserCircle,
  settings: Settings2,
}

interface GuidedTourProps {
  steps: TourStep[]
  storageKey: string
  onComplete: () => void
}

export function GuidedTour({ steps, storageKey, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [arrowPath, setArrowPath] = useState<string | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1
  const isConceptStep = !step?.target
  const progress = ((currentStep + 1) / steps.length) * 100

  const positionTooltip = useCallback(() => {
    if (!step) return

    // Concept steps: centered, no target spotlight
    if (!step.target) {
      setTargetRect(null)
      setArrowPath(null)
      setTooltipStyle({})
      setVisible(true)
      return
    }

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
    setTargetRect(rect)
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    const tooltip = tooltipRef.current
    const tooltipW = tooltip?.offsetWidth || 340
    const tooltipH = tooltip?.offsetHeight || 160
    const gap = 24
    const placement = step.placement || 'right'

    let top = 0
    let left = 0

    switch (placement) {
      case 'right':
        top = rect.top + rect.height / 2 - tooltipH / 2
        left = rect.right + gap
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipH / 2
        left = rect.left - tooltipW - gap
        break
      case 'bottom':
        top = rect.bottom + gap
        left = rect.left + rect.width / 2 - tooltipW / 2
        break
      case 'top':
        top = rect.top - tooltipH - gap
        left = rect.left + rect.width / 2 - tooltipW / 2
        break
    }

    // Clamp within viewport
    top = Math.max(12, Math.min(top, window.innerHeight - tooltipH - 12))
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipW - 12))

    setTooltipStyle({ top, left })
    setVisible(true)

    // Calculate arrow after tooltip is positioned
    requestAnimationFrame(() => {
      if (tooltipRef.current) {
        const tRect = tooltipRef.current.getBoundingClientRect()
        setArrowPath(computeArrowPath(tRect, rect, placement))
      }
    })
  }, [step, isLast])

  useEffect(() => {
    const timer = setTimeout(positionTooltip, 350)
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
      setArrowPath(null)
      setCurrentStep(prev => prev + 1)
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setVisible(false)
      setArrowPath(null)
      setCurrentStep(prev => prev - 1)
    }
  }

  if (!step || !visible) return null

  const StepIcon = step.icon ? ICON_MAP[step.icon] : null

  return (
    <>
      {/* Dark overlay — blocks interaction with app beneath */}
      <div className="fixed inset-0 z-[60]">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="tour-spotlight">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 6}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="10"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#tour-spotlight)"
          />
        </svg>

        {/* Highlight ring around target */}
        {targetRect && (
          <div
            className="absolute rounded-lg pointer-events-none"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              boxShadow: '0 0 0 2px hsl(221 83% 53%), 0 0 12px 2px hsl(221 83% 53% / 0.3)',
            }}
          />
        )}
      </div>

      {/* Curved arrow connecting tooltip to target */}
      {arrowPath && !isConceptStep && (
        <svg className="fixed inset-0 z-[61] w-full h-full pointer-events-none">
          <defs>
            <marker
              id="tour-arrowhead"
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 10 4, 0 8" fill="white" opacity="0.8" />
            </marker>
          </defs>
          <path
            d={arrowPath}
            stroke="white"
            strokeWidth="2"
            fill="none"
            opacity="0.7"
            markerEnd="url(#tour-arrowhead)"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={`fixed z-[62] bg-background border rounded-2xl shadow-2xl pointer-events-auto overflow-hidden transition-opacity duration-200 ${
          isConceptStep
            ? 'w-[380px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            : 'w-[340px]'
        }`}
        style={isConceptStep ? undefined : tooltipStyle}
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5">
          {/* Concept step icon */}
          {StepIcon && (
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
          )}

          <h3 className={`font-semibold mb-2 ${isConceptStep ? 'text-lg text-center' : 'text-base'}`}>
            {step.title}
          </h3>
          <p className={`text-sm text-muted-foreground leading-relaxed ${isConceptStep ? 'text-center' : ''}`}>
            {step.description}
          </p>
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/30">
          <div className="w-16">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={handlePrev} className="h-8 px-2 text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back
              </Button>
            )}
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all ${
                  i === currentStep
                    ? 'w-5 h-1.5 bg-primary'
                    : i < currentStep
                    ? 'w-1.5 h-1.5 bg-primary/50'
                    : 'w-1.5 h-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 w-16 justify-end">
            <button
              onClick={handleFinish}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-1"
            >
              Skip
            </button>
            <Button size="sm" onClick={handleNext} className="h-8 px-3 text-xs">
              {isLast ? 'Done' : 'Next'}
              {!isLast && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

/** Compute a curved SVG path from the tooltip to the target element. */
function computeArrowPath(
  tooltipRect: DOMRect,
  targetRect: DOMRect,
  placement: string
): string {
  let sx: number, sy: number, ex: number, ey: number

  switch (placement) {
    case 'right':
      sx = tooltipRect.left
      sy = tooltipRect.top + tooltipRect.height / 2
      ex = targetRect.right + 8
      ey = targetRect.top + targetRect.height / 2
      break
    case 'left':
      sx = tooltipRect.right
      sy = tooltipRect.top + tooltipRect.height / 2
      ex = targetRect.left - 8
      ey = targetRect.top + targetRect.height / 2
      break
    case 'bottom':
      sx = tooltipRect.left + tooltipRect.width / 2
      sy = tooltipRect.top
      ex = targetRect.left + targetRect.width / 2
      ey = targetRect.bottom + 8
      break
    case 'top':
      sx = tooltipRect.left + tooltipRect.width / 2
      sy = tooltipRect.bottom
      ex = targetRect.left + targetRect.width / 2
      ey = targetRect.top - 8
      break
    default:
      sx = tooltipRect.left
      sy = tooltipRect.top + tooltipRect.height / 2
      ex = targetRect.right + 8
      ey = targetRect.top + targetRect.height / 2
  }

  const dx = ex - sx
  const dy = ey - sy
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 1) return ''

  // Quadratic bezier control point with perpendicular offset for curve
  const offset = Math.min(30, dist * 0.2)
  const mx = (sx + ex) / 2
  const my = (sy + ey) / 2
  const nx = -dy / dist
  const ny = dx / dist
  const cx = mx + nx * offset
  const cy = my + ny * offset

  return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`
}

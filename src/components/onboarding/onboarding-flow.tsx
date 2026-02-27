'use client'

import { useState, useEffect } from 'react'
import { WelcomeWizard } from './welcome-wizard'
import { GuidedTour } from './guided-tour'
import {
  studentTourSteps,
  supervisorTourSteps,
  adminTourSteps,
  type TourStep,
} from './tour-steps'
import type { UserRole } from '@/types/database'

interface OnboardingFlowProps {
  role: UserRole
  fullName: string
  needsOnboarding: boolean
  studyRoutes: { id: string; name: string }[]
  currentRouteId: string | null
  certMailPreference: string
}

function getTourSteps(role: UserRole): TourStep[] {
  switch (role) {
    case 'student':
      return studentTourSteps
    case 'supervisor':
      // Supervisor gets their own tour + student tour
      return [...supervisorTourSteps, ...studentTourSteps]
    case 'admin':
    case 'super_admin':
      // Admin gets admin + supervisor + student tour
      return [...adminTourSteps, ...supervisorTourSteps.filter(s => s.target !== 'my-learning'), ...studentTourSteps]
    default:
      return studentTourSteps
  }
}

function getTourStorageKey(role: UserRole): string {
  return `fcdc-tour-${role}-completed`
}

export function OnboardingFlow({
  role,
  fullName,
  needsOnboarding,
  studyRoutes,
  currentRouteId,
  certMailPreference,
}: OnboardingFlowProps) {
  const [showWizard, setShowWizard] = useState(needsOnboarding)
  const [showTour, setShowTour] = useState(false)
  const [tourReady, setTourReady] = useState(false)

  const storageKey = getTourStorageKey(role)

  // After wizard completes, check if tour should run
  useEffect(() => {
    if (tourReady) {
      const tourDone = localStorage.getItem(storageKey) === 'true'
      if (!tourDone) {
        // Delay tour start so the dashboard has time to render
        const timer = setTimeout(() => setShowTour(true), 500)
        return () => clearTimeout(timer)
      }
    }
  }, [tourReady, storageKey])

  function handleWizardComplete() {
    setShowWizard(false)
    setTourReady(true)
  }

  function handleTourComplete() {
    setShowTour(false)
  }

  // Also offer to re-run tour if wizard was already completed but tour not done
  useEffect(() => {
    if (!needsOnboarding) {
      const tourDone = localStorage.getItem(storageKey) === 'true'
      if (!tourDone) {
        const timer = setTimeout(() => setShowTour(true), 800)
        return () => clearTimeout(timer)
      }
    }
  }, [needsOnboarding, storageKey])

  return (
    <>
      {showWizard && (
        <WelcomeWizard
          role={role}
          fullName={fullName}
          studyRoutes={studyRoutes}
          currentRouteId={currentRouteId}
          certMailPreference={certMailPreference}
          onComplete={handleWizardComplete}
        />
      )}

      {showTour && !showWizard && (
        <GuidedTour
          steps={getTourSteps(role)}
          storageKey={storageKey}
          onComplete={handleTourComplete}
        />
      )}
    </>
  )
}

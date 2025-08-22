'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Skip Navigation Component
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
    >
      Aller au contenu principal
    </a>
  )
}

// Screen Reader Announcements
export function ScreenReaderAnnouncements() {
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    // Listen for custom announcement events
    const handleAnnouncement = (event: CustomEvent) => {
      setAnnouncement(event.detail.message)
      // Clear announcement after a delay
      setTimeout(() => setAnnouncement(''), 1000)
    }

    window.addEventListener('announce' as keyof WindowEventMap, handleAnnouncement as EventListener)
    return () => window.removeEventListener('announce' as keyof WindowEventMap, handleAnnouncement as EventListener)
  }, [])

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}

// Focus Management Hook
export function useFocusManagement() {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
    }
  }

  const trapFocus = (containerSelector: string) => {
    const container = document.querySelector(containerSelector) as HTMLElement
    if (!container) return

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    return () => container.removeEventListener('keydown', handleTabKey)
  }

  return { focusElement, trapFocus }
}

// High Contrast Mode Toggle
export function HighContrastToggle() {
  const [highContrast, setHighContrast] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('high-contrast')
    if (saved === 'true') {
      setHighContrast(true)
      document.documentElement.classList.add('high-contrast')
    }
  }, [])

  const toggleHighContrast = () => {
    const newValue = !highContrast
    setHighContrast(newValue)
    localStorage.setItem('high-contrast', newValue.toString())
    
    if (newValue) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    // Announce the change
    window.dispatchEvent(new CustomEvent('announce', {
      detail: { message: `Mode contraste élevé ${highContrast ? 'activé' : 'désactivé'}` }
    }))
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleHighContrast}
      aria-label={`${highContrast ? 'Désactiver' : 'Activer'} le mode contraste élevé`}
      className="text-sm"
    >
      {highContrast ? 'Contraste Normal' : 'Contraste Élevé'}
    </Button>
  )
}

// Font Size Control
export function FontSizeControl() {
  const [fontSize, setFontSize] = useState('normal')

  useEffect(() => {
    const saved = localStorage.getItem('font-size')
    if (saved) {
      setFontSize(saved)
      document.documentElement.setAttribute('data-font-size', saved)
    }
  }, [])

  const changeFontSize = (size: 'small' | 'normal' | 'large') => {
    setFontSize(size)
    localStorage.setItem('font-size', size)
    document.documentElement.setAttribute('data-font-size', size)

    // Announce the change
    const sizeLabels = {
      small: 'petite',
      normal: 'normale',
      large: 'grande'
    }
    window.dispatchEvent(new CustomEvent('announce', {
      detail: { message: `Taille de police changée à ${sizeLabels[size]}` }
    }))
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Taille du texte:</span>
      <div className="flex gap-1">
        {(['small', 'normal', 'large'] as const).map((size) => (
          <Button
            key={size}
            variant={fontSize === size ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeFontSize(size)}
            aria-label={`Taille de police ${size === 'small' ? 'petite' : size === 'normal' ? 'normale' : 'grande'}`}
            className={cn(
              'text-xs px-2 py-1',
              size === 'small' && 'text-xs',
              size === 'normal' && 'text-sm',
              size === 'large' && 'text-base'
            )}
          >
            A{size === 'large' && 'A'}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Keyboard Navigation Helper
export function KeyboardNavigationHelper() {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help with Ctrl+?
      if (e.ctrlKey && e.key === '?') {
        e.preventDefault()
        setShowHelp(true)
      }
      // Hide help with Escape
      if (e.key === 'Escape') {
        setShowHelp(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!showHelp) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowHelp(true)}
        aria-label="Afficher l'aide pour la navigation au clavier"
        className="fixed bottom-4 right-4 z-50"
      >
        ?
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Navigation au clavier</h2>
        <div className="space-y-2 text-sm">
          <div><kbd className="px-2 py-1 bg-muted rounded">Tab</kbd> - Naviguer vers l&apos;avant</div>
            <div><kbd className="px-2 py-1 bg-muted rounded">Shift+Tab</kbd> - Naviguer vers l&apos;arrière</div>
            <div><kbd className="px-2 py-1 bg-muted rounded">Enter</kbd> - Activer un élément</div>
            <div><kbd className="px-2 py-1 bg-muted rounded">Espace</kbd> - Activer un bouton</div>
            <div><kbd className="px-2 py-1 bg-muted rounded">Échap</kbd> - Fermer les modales</div>
            <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+?</kbd> - Afficher cette aide</div>
        </div>
        <Button
          onClick={() => setShowHelp(false)}
          className="mt-4 w-full"
        >
          Fermer
        </Button>
      </div>
    </div>
  )
}

// Utility function to announce messages to screen readers
export function announceToScreenReader(message: string) {
  window.dispatchEvent(new CustomEvent('announce', {
    detail: { message }
  }))
}
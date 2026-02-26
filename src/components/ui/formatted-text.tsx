import React from 'react'

/**
 * Renders text with basic markdown-style formatting:
 * - *text* renders as italic
 * - Preserves line breaks (whitespace-pre-line)
 */
export function FormattedText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*[^*]+\*)/)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>
        }
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </span>
  )
}

'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Pen,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Undo2,
  Redo2,
  Trash2,
  Check,
  X,
  Palette,
} from 'lucide-react'

type Tool = 'pen' | 'line' | 'rect' | 'circle' | 'arrow'

interface Point {
  x: number
  y: number
}

interface SketchPadProps {
  onSave: (blob: Blob) => void
  onCancel: () => void
}

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff']
const STROKE_SIZES = [2, 4, 6, 10]

export function SketchPad({ onSave, onCancel }: SketchPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#000000')
  const [strokeSize, setStrokeSize] = useState(4)
  const [isDrawing, setIsDrawing] = useState(false)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [shapeStart, setShapeStart] = useState<Point | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Save initial blank state
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory([initialState])
    setHistoryIndex(0)
  }, [])

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(imageData)
      return newHistory
    })
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getPos(e)
    setIsDrawing(true)

    if (tool === 'pen') {
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      ctx.strokeStyle = color
      ctx.lineWidth = strokeSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    } else {
      setShapeStart(pos)
      // Save current canvas state for shape preview
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setHistory(prev => {
        const newHistory = [...prev]
        // Store snapshot temporarily at current index + 1
        newHistory[historyIndex + 1] = snapshot
        return newHistory
      })
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getPos(e)

    if (tool === 'pen') {
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    } else if (shapeStart) {
      // Restore to pre-shape state for preview
      const snapshot = history[historyIndex]
      if (snapshot) ctx.putImageData(snapshot, 0, 0)

      ctx.strokeStyle = color
      ctx.lineWidth = strokeSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      drawShape(ctx, shapeStart, pos)
    }
  }

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    setIsDrawing(false)

    if (tool !== 'pen' && shapeStart) {
      const pos = getPos(e)
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Restore and draw final shape
          const snapshot = history[historyIndex]
          if (snapshot) ctx.putImageData(snapshot, 0, 0)
          ctx.strokeStyle = color
          ctx.lineWidth = strokeSize
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          drawShape(ctx, shapeStart, pos)
        }
      }
      setShapeStart(null)
    }

    saveToHistory()
  }

  function drawShape(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
    ctx.beginPath()
    switch (tool) {
      case 'line':
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        break
      case 'rect':
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
        break
      case 'circle': {
        const rx = Math.abs(end.x - start.x) / 2
        const ry = Math.abs(end.y - start.y) / 2
        const cx = start.x + (end.x - start.x) / 2
        const cy = start.y + (end.y - start.y) / 2
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.stroke()
        break
      }
      case 'arrow': {
        // Line
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        // Arrowhead
        const angle = Math.atan2(end.y - start.y, end.x - start.x)
        const headLen = 15
        ctx.beginPath()
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(
          end.x - headLen * Math.cos(angle - Math.PI / 6),
          end.y - headLen * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(
          end.x - headLen * Math.cos(angle + Math.PI / 6),
          end.y - headLen * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()
        break
      }
    }
  }

  function undo() {
    if (historyIndex <= 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const newIndex = historyIndex - 1
    ctx.putImageData(history[newIndex], 0, 0)
    setHistoryIndex(newIndex)
  }

  function redo() {
    if (historyIndex >= history.length - 1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const newIndex = historyIndex + 1
    ctx.putImageData(history[newIndex], 0, 0)
    setHistoryIndex(newIndex)
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveToHistory()
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (blob) onSave(blob)
    }, 'image/png')
  }

  const tools: { id: Tool; icon: typeof Pen; label: string }[] = [
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Ellipse' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  ]

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        {/* Tools */}
        {tools.map(t => (
          <Button
            key={t.id}
            type="button"
            variant={tool === t.id ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setTool(t.id)}
            title={t.label}
          >
            <t.icon className="h-4 w-4" />
          </Button>
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Stroke Size */}
        {STROKE_SIZES.map(size => (
          <Button
            key={size}
            type="button"
            variant={strokeSize === size ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setStrokeSize(size)}
            title={`${size}px`}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: Math.min(size + 2, 14), height: Math.min(size + 2, 14) }}
            />
          </Button>
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Color */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Color"
          >
            <div className="h-5 w-5 rounded border" style={{ backgroundColor: color }} />
          </Button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-lg shadow-lg z-50 flex gap-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`h-7 w-7 rounded border-2 transition-transform ${
                    color === c ? 'border-primary scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => { setColor(c); setShowColorPicker(false) }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={undo} title="Undo" disabled={historyIndex <= 0}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={redo} title="Redo" disabled={historyIndex >= history.length - 1}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={clearCanvas} title="Clear">
          <Trash2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-8">
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={handleSave} className="h-8">
          <Check className="h-4 w-4 mr-1" />
          Save Drawing
        </Button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair touch-none"
        style={{ height: 400 }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </div>
  )
}

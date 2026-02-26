'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Pen, Square, Circle, Minus, ArrowRight, Eraser, Type,
  Hand, Undo2, Redo2, Trash2, Check, X,
} from 'lucide-react'

type ToolType = 'pen' | 'eraser' | 'text' | 'line' | 'rect' | 'circle' | 'arrow' | 'grab'

interface Point { x: number; y: number }

interface PenObj { type: 'pen'; points: Point[]; color: string; strokeSize: number }
interface EraserObj { type: 'eraser'; points: Point[]; strokeSize: number }
interface LineObj { type: 'line'; start: Point; end: Point; color: string; strokeSize: number }
interface RectObj { type: 'rect'; start: Point; end: Point; color: string; strokeSize: number }
interface CircleObj { type: 'circle'; start: Point; end: Point; color: string; strokeSize: number }
interface ArrowObj { type: 'arrow'; start: Point; end: Point; color: string; strokeSize: number }
interface TextObj { type: 'text'; pos: Point; text: string; color: string; fontSize: number }
type DrawObject = PenObj | EraserObj | LineObj | RectObj | CircleObj | ArrowObj | TextObj

interface SketchPadProps {
  onSave: (blob: Blob) => void
  onCancel: () => void
  initialImageUrl?: string
}

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff']
const STROKE_SIZES = [2, 4, 6, 10]

export function SketchPad({ onSave, onCancel, initialImageUrl }: SketchPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<ToolType>('pen')
  const [color, setColor] = useState('#000000')
  const [strokeSize, setStrokeSize] = useState(4)
  const [fontSize, setFontSize] = useState(16)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Object-based drawing state
  const objectsRef = useRef<DrawObject[]>([])
  const historyRef = useRef<DrawObject[][]>([[]])
  const historyIndexRef = useRef(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Background image for re-editing
  const bgImageRef = useRef<HTMLImageElement | null>(null)

  // Drawing refs (hot path — no React re-renders)
  const isDrawingRef = useRef(false)
  const penPointsRef = useRef<Point[]>([])
  const shapeStartRef = useRef<Point | null>(null)

  // Grab refs
  const selectedIndexRef = useRef<number | null>(null)
  const dragStartRef = useRef<Point | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // Text state (needs re-render for overlay input)
  const [textInput, setTextInput] = useState('')
  const [textPos, setTextPos] = useState<Point | null>(null)
  const textInputRef = useRef<HTMLInputElement>(null)

  // --- Rendering ---

  const renderAll = useCallback((objs?: DrawObject[], selIdx?: number | null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawObjs = objs ?? objectsRef.current
    const sel = selIdx !== undefined ? selIdx : selectedIndexRef.current

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Background image
    const bg = bgImageRef.current
    if (bg) {
      const scale = Math.min(canvas.width / bg.width, canvas.height / bg.height)
      const w = bg.width * scale
      const h = bg.height * scale
      ctx.drawImage(bg, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
    }

    for (const obj of drawObjs) {
      drawObject(ctx, obj)
    }

    // Selection outline
    if (sel !== null && sel < drawObjs.length) {
      const bounds = getObjectBounds(drawObjs[sel], ctx)
      if (bounds) {
        ctx.save()
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8)
        ctx.restore()
      }
    }
  }, [])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    if (initialImageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        bgImageRef.current = img
        renderAll()
      }
      img.src = initialImageUrl
    } else {
      renderAll()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Object drawing ---

  function drawObject(ctx: CanvasRenderingContext2D, obj: DrawObject) {
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    switch (obj.type) {
      case 'pen':
        if (obj.points.length < 2) break
        ctx.strokeStyle = obj.color
        ctx.lineWidth = obj.strokeSize
        ctx.beginPath()
        ctx.moveTo(obj.points[0].x, obj.points[0].y)
        for (let i = 1; i < obj.points.length; i++) ctx.lineTo(obj.points[i].x, obj.points[i].y)
        ctx.stroke()
        break

      case 'eraser':
        if (obj.points.length < 2) break
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = obj.strokeSize * 4
        ctx.beginPath()
        ctx.moveTo(obj.points[0].x, obj.points[0].y)
        for (let i = 1; i < obj.points.length; i++) ctx.lineTo(obj.points[i].x, obj.points[i].y)
        ctx.stroke()
        break

      case 'line':
        ctx.strokeStyle = obj.color
        ctx.lineWidth = obj.strokeSize
        ctx.beginPath()
        ctx.moveTo(obj.start.x, obj.start.y)
        ctx.lineTo(obj.end.x, obj.end.y)
        ctx.stroke()
        break

      case 'rect':
        ctx.strokeStyle = obj.color
        ctx.lineWidth = obj.strokeSize
        ctx.strokeRect(obj.start.x, obj.start.y, obj.end.x - obj.start.x, obj.end.y - obj.start.y)
        break

      case 'circle': {
        ctx.strokeStyle = obj.color
        ctx.lineWidth = obj.strokeSize
        const rx = Math.abs(obj.end.x - obj.start.x) / 2
        const ry = Math.abs(obj.end.y - obj.start.y) / 2
        const cx = obj.start.x + (obj.end.x - obj.start.x) / 2
        const cy = obj.start.y + (obj.end.y - obj.start.y) / 2
        ctx.beginPath()
        ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2)
        ctx.stroke()
        break
      }

      case 'arrow': {
        ctx.strokeStyle = obj.color
        ctx.lineWidth = obj.strokeSize
        ctx.beginPath()
        ctx.moveTo(obj.start.x, obj.start.y)
        ctx.lineTo(obj.end.x, obj.end.y)
        ctx.stroke()
        const angle = Math.atan2(obj.end.y - obj.start.y, obj.end.x - obj.start.x)
        const headLen = 15
        ctx.beginPath()
        ctx.moveTo(obj.end.x, obj.end.y)
        ctx.lineTo(obj.end.x - headLen * Math.cos(angle - Math.PI / 6), obj.end.y - headLen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(obj.end.x, obj.end.y)
        ctx.lineTo(obj.end.x - headLen * Math.cos(angle + Math.PI / 6), obj.end.y - headLen * Math.sin(angle + Math.PI / 6))
        ctx.stroke()
        break
      }

      case 'text':
        ctx.font = `${obj.fontSize}px sans-serif`
        ctx.fillStyle = obj.color
        ctx.textBaseline = 'top'
        ctx.fillText(obj.text, obj.pos.x, obj.pos.y)
        break
    }
    ctx.restore()
  }

  // --- Bounds & hit testing ---

  function getObjectBounds(obj: DrawObject, ctx: CanvasRenderingContext2D): { x: number; y: number; w: number; h: number } | null {
    switch (obj.type) {
      case 'pen':
      case 'eraser': {
        if (obj.points.length === 0) return null
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const p of obj.points) {
          minX = Math.min(minX, p.x); minY = Math.min(minY, p.y)
          maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y)
        }
        const pad = (obj.type === 'eraser' ? obj.strokeSize * 4 : obj.strokeSize) / 2
        return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 }
      }
      case 'line':
      case 'arrow': {
        const minX = Math.min(obj.start.x, obj.end.x)
        const minY = Math.min(obj.start.y, obj.end.y)
        const maxX = Math.max(obj.start.x, obj.end.x)
        const maxY = Math.max(obj.start.y, obj.end.y)
        const pad = obj.strokeSize / 2 + 5
        return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 }
      }
      case 'rect':
      case 'circle': {
        const minX = Math.min(obj.start.x, obj.end.x)
        const minY = Math.min(obj.start.y, obj.end.y)
        const maxX = Math.max(obj.start.x, obj.end.x)
        const maxY = Math.max(obj.start.y, obj.end.y)
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
      }
      case 'text': {
        ctx.font = `${obj.fontSize}px sans-serif`
        const metrics = ctx.measureText(obj.text)
        return { x: obj.pos.x, y: obj.pos.y, w: metrics.width, h: obj.fontSize * 1.2 }
      }
    }
  }

  function hitTest(pos: Point): number | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const objs = objectsRef.current
    for (let i = objs.length - 1; i >= 0; i--) {
      const bounds = getObjectBounds(objs[i], ctx)
      if (!bounds) continue
      if (pos.x >= bounds.x && pos.x <= bounds.x + bounds.w &&
          pos.y >= bounds.y && pos.y <= bounds.y + bounds.h) {
        return i
      }
    }
    return null
  }

  // --- Object manipulation ---

  function moveObject(obj: DrawObject, dx: number, dy: number): DrawObject {
    switch (obj.type) {
      case 'pen':
        return { ...obj, points: obj.points.map(p => ({ x: p.x + dx, y: p.y + dy })) }
      case 'eraser':
        return { ...obj, points: obj.points.map(p => ({ x: p.x + dx, y: p.y + dy })) }
      case 'line':
      case 'arrow':
      case 'rect':
      case 'circle':
        return { ...obj, start: { x: obj.start.x + dx, y: obj.start.y + dy }, end: { x: obj.end.x + dx, y: obj.end.y + dy } }
      case 'text':
        return { ...obj, pos: { x: obj.pos.x + dx, y: obj.pos.y + dy } }
    }
  }

  // --- History ---

  function commitToHistory(newObjects: DrawObject[]) {
    objectsRef.current = newObjects
    const h = historyRef.current
    const idx = historyIndexRef.current
    historyRef.current = [...h.slice(0, idx + 1), newObjects.map(o => ({ ...o }))]
    historyIndexRef.current = idx + 1
    setCanUndo(true)
    setCanRedo(false)
  }

  function undo() {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const objs = historyRef.current[historyIndexRef.current].map(o => ({ ...o }))
    objectsRef.current = objs
    selectedIndexRef.current = null
    setSelectedIndex(null)
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(true)
    renderAll(objs, null)
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    const objs = historyRef.current[historyIndexRef.current].map(o => ({ ...o }))
    objectsRef.current = objs
    selectedIndexRef.current = null
    setSelectedIndex(null)
    setCanUndo(true)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    renderAll(objs, null)
  }

  function clearCanvas() {
    objectsRef.current = []
    commitToHistory([])
    selectedIndexRef.current = null
    setSelectedIndex(null)
    renderAll([], null)
  }

  // --- Text ---

  function commitText() {
    if (!textPos || !textInput) return
    const newObj: TextObj = { type: 'text', pos: textPos, text: textInput, color, fontSize }
    const newObjects = [...objectsRef.current, newObj]
    commitToHistory(newObjects)
    setTextPos(null)
    setTextInput('')
    renderAll(newObjects)
  }

  // --- Event handlers ---

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getPos(e)

    if (tool === 'text') {
      if (textPos && textInput) commitText()
      setTextPos(pos)
      setTextInput('')
      setTimeout(() => textInputRef.current?.focus(), 0)
      return
    }

    if (tool === 'grab') {
      const idx = hitTest(pos)
      selectedIndexRef.current = idx
      setSelectedIndex(idx)
      dragStartRef.current = idx !== null ? pos : null
      renderAll(undefined, idx)
      return
    }

    isDrawingRef.current = true

    if (tool === 'pen' || tool === 'eraser') {
      penPointsRef.current = [pos]
    } else {
      shapeStartRef.current = pos
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)

    // Grab drag
    if (tool === 'grab' && selectedIndexRef.current !== null && dragStartRef.current) {
      const dx = pos.x - dragStartRef.current.x
      const dy = pos.y - dragStartRef.current.y
      const idx = selectedIndexRef.current
      objectsRef.current = objectsRef.current.map((obj, i) =>
        i === idx ? moveObject(obj, dx, dy) : obj
      )
      dragStartRef.current = pos
      renderAll(undefined, idx)
      return
    }

    if (!isDrawingRef.current) return

    if (tool === 'pen' || tool === 'eraser') {
      const pts = penPointsRef.current
      // Draw segment incrementally
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      if (tool === 'eraser') {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = strokeSize * 4
      } else {
        ctx.strokeStyle = color
        ctx.lineWidth = strokeSize
      }
      if (pts.length > 0) {
        ctx.beginPath()
        ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      }
      ctx.restore()
      penPointsRef.current.push(pos)
    } else if (shapeStartRef.current) {
      // Re-render all objects + shape preview
      renderAll()
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = strokeSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      drawShapePreview(ctx, shapeStartRef.current, pos)
      ctx.restore()
    }
  }

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()

    if (tool === 'grab') {
      if (selectedIndexRef.current !== null && dragStartRef.current) {
        commitToHistory([...objectsRef.current])
        renderAll(undefined, selectedIndexRef.current)
      }
      dragStartRef.current = null
      return
    }

    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    const pos = getPos(e)

    if (tool === 'pen' || tool === 'eraser') {
      penPointsRef.current.push(pos)
      const newObj: DrawObject = tool === 'pen'
        ? { type: 'pen', points: [...penPointsRef.current], color, strokeSize }
        : { type: 'eraser', points: [...penPointsRef.current], strokeSize }
      const newObjects = [...objectsRef.current, newObj]
      commitToHistory(newObjects)
      penPointsRef.current = []
      renderAll(newObjects)
    } else if (shapeStartRef.current) {
      const start = shapeStartRef.current
      let newObj: DrawObject
      switch (tool) {
        case 'line':  newObj = { type: 'line', start, end: pos, color, strokeSize }; break
        case 'rect':  newObj = { type: 'rect', start, end: pos, color, strokeSize }; break
        case 'circle': newObj = { type: 'circle', start, end: pos, color, strokeSize }; break
        case 'arrow': newObj = { type: 'arrow', start, end: pos, color, strokeSize }; break
        default: shapeStartRef.current = null; return
      }
      const newObjects = [...objectsRef.current, newObj]
      commitToHistory(newObjects)
      shapeStartRef.current = null
      renderAll(newObjects)
    }
  }

  function drawShapePreview(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
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
        ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2)
        ctx.stroke()
        break
      }
      case 'arrow': {
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        const angle = Math.atan2(end.y - start.y, end.x - start.x)
        const headLen = 15
        ctx.beginPath()
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6))
        ctx.stroke()
        break
      }
    }
  }

  // --- Save ---

  function handleSave() {
    if (textPos && textInput) commitText()
    const canvas = canvasRef.current
    if (!canvas) return
    // Render without selection box
    renderAll(undefined, null)
    canvas.toBlob((blob) => {
      if (blob) onSave(blob)
    }, 'image/png')
  }

  // --- Delete selected object ---

  function deleteSelected() {
    if (selectedIndexRef.current === null) return
    const newObjects = objectsRef.current.filter((_, i) => i !== selectedIndexRef.current)
    commitToHistory(newObjects)
    selectedIndexRef.current = null
    setSelectedIndex(null)
    renderAll(newObjects, null)
  }

  // Keyboard handler for deleting selected objects
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't intercept if text input is focused
        if (textPos) return
        if (selectedIndexRef.current !== null) {
          e.preventDefault()
          deleteSelected()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [textPos]) // eslint-disable-line react-hooks/exhaustive-deps

  const tools: { id: ToolType; icon: typeof Pen; label: string }[] = [
    { id: 'grab', icon: Hand, label: 'Grab / Move' },
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Ellipse' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  ]

  const cursor = tool === 'grab'
    ? (dragStartRef.current ? 'grabbing' : 'grab')
    : tool === 'text' ? 'text'
    : tool === 'eraser' ? 'cell'
    : 'crosshair'

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        {tools.map(t => (
          <Button
            key={t.id}
            type="button"
            variant={tool === t.id ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setTool(t.id)
              if (t.id !== 'grab') {
                selectedIndexRef.current = null
                setSelectedIndex(null)
                renderAll(undefined, null)
              }
            }}
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

        {/* Font size (text tool) */}
        {tool === 'text' && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="h-8 text-xs rounded border bg-background px-1"
              title="Font size"
            >
              {[12, 14, 16, 20, 24, 32, 40].map(s => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
          </>
        )}

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

        {/* Delete selected (grab mode) */}
        {selectedIndex !== null && tool === 'grab' && (
          <Button type="button" variant="ghost" size="sm" className="h-8 text-destructive" onClick={deleteSelected} title="Delete selected">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}

        {/* Actions */}
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={undo} title="Undo" disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={redo} title="Redo" disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={clearCanvas} title="Clear all">
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

      {/* Canvas container */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full touch-none"
          style={{ height: 400, cursor }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />

        {/* Text input overlay */}
        {textPos && (
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitText()
              else if (e.key === 'Escape') { setTextPos(null); setTextInput('') }
            }}
            onBlur={() => { if (textInput) commitText(); else setTextPos(null) }}
            className="absolute bg-transparent border border-dashed border-blue-400 outline-none px-1"
            style={{
              left: textPos.x,
              top: textPos.y,
              fontSize: `${fontSize}px`,
              color: color,
              fontFamily: 'sans-serif',
              minWidth: 60,
            }}
            placeholder="Type..."
          />
        )}
      </div>
    </div>
  )
}

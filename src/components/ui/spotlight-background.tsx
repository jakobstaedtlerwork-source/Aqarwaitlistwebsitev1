"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface SpotlightBackgroundProps {
  className?: string
  children?: React.ReactNode
  colors?: string | string[]
  size?: number
  blur?: number
  smoothing?: number
  ambient?: boolean
  opacity?: number
}

interface SpotlightPosition {
  x: number
  y: number
  targetX: number
  targetY: number
}

export function SpotlightBackground({
  className,
  children,
  colors = ["rgba(35, 85, 245, 0.12)"],
  size = 500,
  blur = 70,
  smoothing = 0.08,
  ambient = true,
  opacity = 1,
}: SpotlightBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const spotlightsRef = useRef<SpotlightPosition[]>([])
  const animationRef = useRef<number>()
  const lastMouseMoveRef = useRef<number>(0)
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([])

  const colorArray = Array.isArray(colors) ? colors : [colors]

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const { width, height } = container.getBoundingClientRect()
    const centerX = width / 2
    const centerY = height / 2
    spotlightsRef.current = colorArray.map((_, i) => ({
      x: centerX + (i - (colorArray.length - 1) / 2) * 50,
      y: centerY,
      targetX: centerX + (i - (colorArray.length - 1) / 2) * 50,
      targetY: centerY,
    }))
    setPositions(spotlightsRef.current.map(s => ({ x: s.x, y: s.y })))
  }, [colorArray.length])

  const lerp = useCallback((start: number, end: number, factor: number) => {
    return start + (end - start) * factor
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const { width, height } = container.getBoundingClientRect()
    let tick = 0

    const animate = () => {
      tick++
      const now = Date.now()
      const timeSinceMouseMove = now - lastMouseMoveRef.current
      const isAmbient = ambient && timeSinceMouseMove > 2000

      spotlightsRef.current = spotlightsRef.current.map((spotlight, i) => {
        let { x, y, targetX, targetY } = spotlight
        if (isAmbient) {
          const offset = i * 0.5
          targetX = width / 2 + Math.sin(tick * 0.005 + offset) * (width * 0.2)
          targetY = height / 2 + Math.cos(tick * 0.003 + offset) * (height * 0.15)
        }
        x = lerp(x, targetX, smoothing)
        y = lerp(y, targetY, smoothing)
        return { x, y, targetX, targetY }
      })

      setPositions(spotlightsRef.current.map(s => ({ x: s.x, y: s.y })))
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [ambient, smoothing, lerp])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    lastMouseMoveRef.current = Date.now()
    spotlightsRef.current = spotlightsRef.current.map((spotlight, i) => ({
      ...spotlight,
      targetX: x + (i - (colorArray.length - 1) / 2) * 30,
      targetY: y + (i - (colorArray.length - 1) / 2) * 20,
    }))
  }, [colorArray.length])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current
    if (!container || !e.touches[0]) return
    const rect = container.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const y = e.touches[0].clientY - rect.top
    lastMouseMoveRef.current = Date.now()
    spotlightsRef.current = spotlightsRef.current.map((spotlight, i) => ({
      ...spotlight,
      targetX: x + (i - (colorArray.length - 1) / 2) * 30,
      targetY: y + (i - (colorArray.length - 1) / 2) * 20,
    }))
  }, [colorArray.length])

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-white", className)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {colorArray.map((color, i) => (
        <div
          key={i}
          className="pointer-events-none absolute inset-0"
          style={{
            opacity,
            background: positions[i]
              ? `radial-gradient(${size}px circle at ${positions[i].x}px ${positions[i].y}px, ${color}, transparent 70%)`
              : "transparent",
            filter: `blur(${blur}px)`,
          }}
        />
      ))}
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  )
}

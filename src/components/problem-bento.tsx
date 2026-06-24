"use client"

import { useEffect, useRef } from "react"
import { motion, type Variants } from "motion/react"
import { FileQuestion, TrendingDown, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const RADIUS = 300

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.1 },
  },
}

export function ProblemBento() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null])

  useEffect(() => {
    let rafId: number

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        cardRefs.current.forEach((card) => {
          if (!card) return
          const rect = card.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const dist = Math.hypot(e.clientX - cx, e.clientY - cy)
          const opacity = Math.max(0, 1 - dist / RADIUS)
          card.style.borderColor = `rgba(35, 85, 245, ${opacity})`
        })
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const base = "rounded-2xl border border-transparent bg-gray-50 transition-[border-color] duration-150"

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">

          {/* Featured cell — left, spans 2 rows */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="md:col-start-1 md:row-span-2"
          >
            <Card ref={(el) => { cardRefs.current[0] = el }} className={`flex h-full flex-col ${base}`}>
              <CardContent className="flex flex-1 flex-col p-6">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2355F5]">
                  The Problem
                </span>
                <h2 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
                  Chaos.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  If you own rental property in the UAE, you know the drill.
                </p>
                <p className="mt-auto pt-10 text-sm font-bold text-gray-900">
                  Zero solutions. Until now.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cell 1 */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="md:col-start-2 md:row-start-1"
          >
            <Card ref={(el) => { cardRefs.current[1] = el }} className={`h-full ${base}`}>
              <CardContent className="p-6">
                <FileQuestion className="h-5 w-5 text-[#2355F5]" />
                <p className="mt-4 text-sm font-semibold text-gray-900">
                  No single source of truth
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Messages, Spreadsheets, Emails and PDFs. Everything is everywhere.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cell 2 */}
          <motion.div
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="md:col-start-3 md:row-start-1"
          >
            <Card ref={(el) => { cardRefs.current[2] = el }} className={`h-full ${base}`}>
              <CardContent className="p-6">
                <TrendingDown className="h-5 w-5 text-[#2355F5]" />
                <p className="mt-4 text-sm font-semibold text-gray-900">
                  No real time data
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Profitability, yield, expenses - always a guess, never a fact.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cell 3 — spans both right columns */}
          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="md:col-start-2 md:col-end-4 md:row-start-2"
          >
            <Card ref={(el) => { cardRefs.current[3] = el }} className={`h-full ${base}`}>
              <CardContent className="p-6">
                <Clock className="h-5 w-5 text-[#2355F5]" />
                <p className="mt-4 text-sm font-semibold text-gray-900">
                  Always catching up
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Missing payments, documents expire and deadlines pass.
                </p>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

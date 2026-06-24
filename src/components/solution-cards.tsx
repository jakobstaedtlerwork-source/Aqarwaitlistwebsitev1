"use client"

import { useEffect, useRef } from "react"
import { motion } from "motion/react"
import { X, Check } from "lucide-react"

const RADIUS = 350

const LEFT_GROUPS = [
  {
    heading: "No single source of truth",
    items: [
      "Contracts in WhatsApp, cheques in a drawer",
      "Lease documents lost across email and PDFs",
      "No overview of what's where",
    ],
  },
  {
    heading: "Flying blind financially",
    items: [
      "Yield and profitability always a guess",
      "No real-time view of income vs. expenses",
      "Tax season is always a surprise",
    ],
  },
  {
    heading: "Always one step behind",
    items: [
      "Ejari renewals missed",
      "Late payment follow-ups done manually",
      "Cheque dates tracked in your head",
    ],
  },
]

const RIGHT_ITEMS = [
  {
    label: "One place for everything",
    desc: "Contracts, cheques, documents and contacts in a single dashboard.",
  },
  {
    label: "Real-time financials",
    desc: "Yield, expenses and collection rate always up to date.",
  },
  {
    label: "Never miss a deadline",
    desc: "Ejari renewals, cheque dates and lease expirations tracked automatically.",
  },
  {
    label: "Built for Dubai landlords",
    desc: "Understands UAE lease logic, PDC cheques and Ejari compliance.",
  },
  {
    label: "Your portfolio at a glance",
    desc: "Always know where you stand, across every property.",
  },
]

export function SolutionCards() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([null, null])

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

  return (
    <section className="px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-5xl">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2355F5]">
          The Solution
        </span>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Stop managing.
          <br />
          Start running.
        </h2>
        <p className="mt-3 text-lg font-semibold text-[#2355F5]">
          Built for Dubai from day one.
        </p>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
          Aqar is the operating system for your rental portfolio — everything in
          one place, always in real time.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Left card — Status Quo */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div
              ref={(el) => { cardRefs.current[0] = el }}
              className="h-full rounded-2xl border border-transparent bg-white p-7 shadow-sm transition-[border-color] duration-150"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Status Quo
              </p>
              <h3 className="mt-2 text-lg font-bold text-gray-900">
                How landlords manage today
              </h3>

              <div className="mt-6 space-y-6">
                {LEFT_GROUPS.map((group, gi) => (
                  <div key={gi}>
                    {gi > 0 && <div className="mb-6 h-px bg-gray-100" />}
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {group.heading}
                    </p>
                    <ul className="space-y-2">
                      {group.items.map((item, ii) => (
                        <li key={ii} className="flex items-start gap-2.5">
                          <X className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right card — With Aqar */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <div
              ref={(el) => { cardRefs.current[1] = el }}
              className="h-full rounded-2xl border border-[#2355F5]/20 bg-[#F5F7FF] p-7 shadow-sm transition-[border-color] duration-150"
            >
              <img src="/aqar-logo.svg" alt="Aqar" className="mb-2 h-6 w-auto" />
              <h3 className="mt-2 text-lg font-bold text-gray-900">
                With Aqar
              </h3>

              <ul className="mt-6 space-y-5">
                {RIGHT_ITEMS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#2355F5]/10">
                      <Check className="h-3 w-3 text-[#2355F5]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

import Image from "next/image"
import { WaitlistForm } from "@/components/waitlist-form"
import { ProblemBento } from "@/components/problem-bento"
import { SolutionCards } from "@/components/solution-cards"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const AVATARS = [
  { initials: "AK", className: "bg-blue-500" },
  { initials: "MR", className: "bg-amber-500" },
  { initials: "SR", className: "bg-emerald-500" },
  { initials: "FH", className: "bg-violet-500" },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1 md:px-8">
          <Image
            src="/aqar-logo.svg"
            alt="Aqar"
            width={160}
            height={64}
            className="h-10 w-auto md:h-16"
          />
          <span className="text-sm font-bold text-[#2355F5]">Sign in</span>
        </div>
      </nav>

      <main>
        {/* ── Hero ── */}
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 md:px-8">
          {/* Skyline background animation */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <iframe
              src="/skyline-animation.html"
              scrolling="no"
              style={{
                opacity: 0.15,
                border: "none",
                width: "100%",
                height: "100%",
                position: "absolute",
                bottom: 0,
                left: 0,
                transform: "scale(1.35)",
                transformOrigin: "bottom center",
              }}
            />
          </div>

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
              The smart way to{" "}
              <span style={{ color: "#2355F5" }}>manage</span> your properties.
            </h1>
            <p className="mt-4 text-base font-semibold text-gray-900 md:mt-5 md:text-xl">
              Maximum control. Minimum effort.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:mt-4 md:text-base">
              Made in Dubai, for Dubai landlords. One platform for your entire
              portfolio - without the chaos.
            </p>

            <div className="relative z-10 mt-8 md:mt-10">
              <a href="#waitlist" className="block w-full md:inline md:w-auto">
                <button className="w-full rounded-xl bg-[#2355F5] px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 md:w-auto">
                  Join Waitlist
                </button>
              </a>
            </div>
          </div>
        </section>

        <ProblemBento />

        <SolutionCards />

        {/* ── Waitlist CTA ── */}
        <section id="waitlist" className="px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-2xl">
            <Card className="rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50">
              <CardContent className="p-6 md:p-14">
                {/* Avatar stack */}
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {AVATARS.map((a) => (
                      <div
                        key={a.initials}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white ${a.className}`}
                      >
                        {a.initials}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    +39 landlords already in
                  </span>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Get early access.</h2>
                <p className="mb-6 text-sm text-gray-500 md:text-base">
                  The first 100 landlords get 3 months free. No strings attached.
                </p>

                <WaitlistForm />

                <div className="mt-6">
                  <Progress value={43} className="h-1.5" />
                  <p className="mt-2 text-center text-sm text-gray-500">
                    43 of 100 early bird spots claimed
                  </p>
                </div>

                <p className="mt-3 text-center text-xs text-muted-foreground/60">
                  No spam · Unsubscribe anytime
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Image
            src="/aqar-logo.svg"
            alt="Aqar"
            width={60}
            height={24}
            className="h-6 w-auto"
          />
          <p className="text-sm text-muted-foreground">
            Built for UAE landlords · hello@aqar.io
          </p>
        </div>
      </footer>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [units, setUnits] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !units) return
    setStatus("loading")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, units }),
      })
      setStatus(res.ok ? "success" : "error")
    } catch {
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="mt-6 flex flex-col items-center gap-2 rounded-xl bg-emerald-50 px-4 py-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <p className="font-semibold text-emerald-800">You&apos;re on the list.</p>
        <p className="text-sm text-emerald-700">We&apos;ll reach out when your spot is ready.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-14 flex-1 text-base"
        />
        <Select value={units} onValueChange={setUnits} required>
          <SelectTrigger className="h-14 w-full text-base sm:w-[120px]">
            <SelectValue placeholder="Units" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 unit</SelectItem>
            <SelectItem value="2-5">2–5</SelectItem>
            <SelectItem value="6-10">6–10</SelectItem>
            <SelectItem value="11-20">11–20</SelectItem>
            <SelectItem value="20+">20+</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="submit"
          disabled={status === "loading" || !email || !units}
          className="h-14 w-full bg-[#2355F5] text-base hover:bg-[#1a44e0] sm:w-auto"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            "Join Waitlist"
          )}
        </Button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-500">Something went wrong. Please try again.</p>
      )}
    </form>
  )
}

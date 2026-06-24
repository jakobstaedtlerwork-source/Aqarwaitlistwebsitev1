import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { email, units } = await req.json()

    if (!email || !units) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`[Waitlist] ${new Date().toISOString()} — ${email} — ${units} units`)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

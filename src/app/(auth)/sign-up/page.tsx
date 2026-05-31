"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import InsiderInsightsLogo from "@/components/logo"
import { AuthBackground } from "@/components/auth-background"

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const { error: authError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/dashboard",
    })

    if (authError) {
      setError(authError.message ?? "Registration failed. Try a different email.")
      setPending(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="dark relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4">
      <AuthBackground />

      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="mb-10 flex flex-col items-center gap-3">
          <InsiderInsightsLogo size={1.25} className="text-primary" />
          <div className="font-mono text-[11px] tracking-[0.22em] text-white/35 uppercase">
            Stay ahead. Stay inside.
          </div>
        </div>

        <div className="w-full max-w-[400px] border border-white/[0.08] bg-card/85 backdrop-blur-sm shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          <div className="px-5 py-3 border-b border-border">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50">
              Create Account
            </span>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground/55"
              >
                Display Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                autoFocus
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary transition-colors duration-100"
                placeholder="J. Smith"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground/55"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary transition-colors duration-100"
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground/55"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary transition-colors duration-100"
                placeholder="min. 8 characters"
              />
            </div>

            {error && (
              <div className="font-mono text-[11px] tracking-wide border border-destructive/30 bg-destructive/8 px-3 py-2 text-destructive">
                <span className="opacity-50">ERR</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full font-mono text-[12px] uppercase tracking-[0.18em] border px-4 py-2.5 transition-colors duration-100 disabled:opacity-40 bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 cursor-pointer"
            >
              {pending ? "Creating Account…" : "Create Account"}
            </button>
          </form>

          <div className="px-5 py-3 border-t border-border">
            <span className="font-mono text-[11px] text-muted-foreground/45">
              Already registered?{" "}
              <Link
                href="/sign-in"
                className="text-primary hover:opacity-75 transition-opacity duration-100"
              >
                Log in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}

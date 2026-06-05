"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import InsiderInsightsLogo from "@/components/logo"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border">
      <div className="px-5 py-4 border-b border-border bg-card">
        <span className="font-mono text-[13px] uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-start gap-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground pt-2.5">
        {label}
      </span>
      <div>{children}</div>
    </div>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full bg-background border border-border px-3 py-2 font-mono text-[12px] text-foreground",
        "placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors duration-100",
        className
      )}
      {...props}
    />
  )
}

function SaveButton({ pending, label = "Save Changes" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-100 disabled:opacity-40 cursor-pointer"
    >
      {pending ? "Saving…" : label}
    </button>
  )
}

function StatusMsg({ msg }: { msg: { type: "ok" | "err"; text: string } | null }) {
  if (!msg) return null
  return (
    <p className={cn("font-mono text-[11px] mt-2", msg.type === "ok" ? "text-chart-1" : "text-destructive")}>
      {msg.type === "ok" ? "✓ " : "✗ "}{msg.text}
    </p>
  )
}

export function ProfileSettings() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const user = session?.user
  const { resolvedTheme, setTheme } = useTheme()

  // Avatar
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarPending, setAvatarPending] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Display name
  const [name, setName] = useState("")
  const [namePending, setNamePending] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Email
  const [newEmail, setNewEmail] = useState("")
  const [emailPending, setEmailPending] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Password
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwPending, setPwPending] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deletePending, setDeletePending] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?"

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg({ type: "err", text: "Image must be under 2 MB." })
      return
    }
    setAvatarPending(true)
    setAvatarMsg(null)
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const { error } = await authClient.updateUser({ image: dataUrl })
      setAvatarPending(false)
      if (error) setAvatarMsg({ type: "err", text: error.message ?? "Failed to update avatar." })
      else setAvatarMsg({ type: "ok", text: "Avatar updated." })
    }
    reader.readAsDataURL(file)
  }

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setNamePending(true)
    setNameMsg(null)
    const { error } = await authClient.updateUser({ name: name.trim() })
    setNamePending(false)
    if (error) setNameMsg({ type: "err", text: error.message ?? "Failed to update name." })
    else { setNameMsg({ type: "ok", text: "Display name updated." }); setName("") }
  }

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setEmailPending(true)
    setEmailMsg(null)
    const { error } = await (authClient as any).changeEmail({ newEmail: newEmail.trim() })
    setEmailPending(false)
    if (error) setEmailMsg({ type: "err", text: error.message ?? "Failed to change email." })
    else { setEmailMsg({ type: "ok", text: "Verification sent to new email." }); setNewEmail("") }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { setPwMsg({ type: "err", text: "Passwords do not match." }); return }
    if (newPw.length < 8) { setPwMsg({ type: "err", text: "Password must be at least 8 characters." }); return }
    setPwPending(true)
    setPwMsg(null)
    const { error } = await authClient.changePassword({ currentPassword: currentPw, newPassword: newPw, revokeOtherSessions: true })
    setPwPending(false)
    if (error) setPwMsg({ type: "err", text: error.message ?? "Failed to change password." })
    else { setPwMsg({ type: "ok", text: "Password updated. Other sessions revoked." }); setCurrentPw(""); setNewPw(""); setConfirmPw("") }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (deleteConfirm !== "DELETE") { setDeleteMsg({ type: "err", text: 'Type DELETE to confirm.' }); return }
    setDeletePending(true)
    setDeleteMsg(null)
    const { error } = await authClient.deleteUser()
    if (error) { setDeleteMsg({ type: "err", text: error.message ?? "Failed to delete account." }); setDeletePending(false) }
    else router.push("/sign-in")
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen bg-background font-mono text-muted-foreground text-[12px]">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-mono">
      {/* Nav */}
      <nav aria-label="Page navigation" className="h-20 border-b border-border relative flex items-center px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity duration-100">
            <InsiderInsightsLogo size={0.95} className="text-primary" />
          </Link>
          <div className="h-5 w-px bg-border" />
          <Link
            href="/dashboard"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <span>←</span> Dashboard
          </Link>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 font-mono text-[18px] uppercase tracking-[0.2em] text-foreground">
          Profile
        </div>
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="ml-auto flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-foreground transition-colors duration-100"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </nav>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

          {/* Avatar + identity hero */}
          <div className="border border-border bg-card flex items-center gap-6 px-6 py-6">
            <div className="relative shrink-0">
              <button
                onClick={() => fileRef.current?.click()}
                className="group relative w-20 h-20 border border-border overflow-hidden focus:outline-none focus:border-primary"
                aria-label="Change profile picture"
              >
                {user?.image ? (
                  <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white">Edit</span>
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              {avatarPending && <p className="font-mono text-[10px] text-muted-foreground mt-1">Uploading…</p>}
              <StatusMsg msg={avatarMsg} />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{user?.name ?? "—"}</div>
              <div className="font-mono text-[12px] text-muted-foreground mt-0.5">{user?.email ?? "—"}</div>
              <div className="font-mono text-[11px] text-muted-foreground/50 mt-1">
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
              </div>
            </div>
          </div>

          {/* Display name */}
          <Section title="Personal Info">
            <form onSubmit={handleNameSave} className="space-y-4">
              <Field label="Display Name">
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={user?.name ?? "Your name"}
                  autoComplete="name"
                />
                <StatusMsg msg={nameMsg} />
              </Field>
              <div className="flex justify-end">
                <SaveButton pending={namePending} />
              </div>
            </form>
          </Section>

          {/* Email */}
          <Section title="Email Address">
            <form onSubmit={handleEmailSave} className="space-y-4">
              <Field label="Current Email">
                <Input value={user?.email ?? ""} disabled className="opacity-50 cursor-not-allowed" />
              </Field>
              <Field label="New Email">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                  autoComplete="email"
                />
                <p className="font-mono text-[10px] text-muted-foreground/50 mt-1.5">
                  A verification link will be sent to the new address.
                </p>
                <StatusMsg msg={emailMsg} />
              </Field>
              <div className="flex justify-end">
                <SaveButton pending={emailPending} label="Send Verification" />
              </div>
            </form>
          </Section>

          {/* Password */}
          <Section title="Security">
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <Field label="Current Password">
                <Input
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>
              <Field label="New Password">
                <Input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm Password">
                <Input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <StatusMsg msg={pwMsg} />
              </Field>
              <p className="font-mono text-[10px] text-muted-foreground/50 pl-[196px]">
                All other active sessions will be signed out.
              </p>
              <div className="flex justify-end">
                <SaveButton pending={pwPending} label="Update Password" />
              </div>
            </form>
          </Section>

          {/* Danger zone */}
          <Section title="Danger Zone">
            <form onSubmit={handleDelete} className="space-y-4">
              <Field label="Delete Account">
                <p className="font-mono text-[11px] text-muted-foreground/70 mb-3 leading-relaxed">
                  This is permanent. All your data will be erased and cannot be recovered.
                  Type <span className="text-destructive font-bold">DELETE</span> to confirm.
                </p>
                <Input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="border-destructive/30 focus:border-destructive"
                />
                <StatusMsg msg={deleteMsg} />
              </Field>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={deletePending || deleteConfirm !== "DELETE"}
                  className="px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors duration-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  {deletePending ? "Deleting…" : "Delete Account"}
                </button>
              </div>
            </form>
          </Section>

        </div>
      </div>
    </div>
  )
}

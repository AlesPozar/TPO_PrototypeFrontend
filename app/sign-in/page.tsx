'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SolaraLogo } from '@/components/logo'
import { Eye, EyeOff } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  function proceed() {
    sessionStorage.setItem('solara_authed', '1')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Logo + brand */}
        <div className="flex flex-col items-center gap-3">
          <SolaraLogo size={48} />
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Solara</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your financial dashboard</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5">
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              defaultValue="demo@solara.app"
              className="h-10 px-3 rounded-lg bg-[oklch(0.20_0_0)] border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.19_45_/_0.6)] transition-all"
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                defaultValue="password"
                className="w-full h-10 px-3 pr-10 rounded-lg bg-[oklch(0.20_0_0)] border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.19_45_/_0.6)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Forgot password link */}
          <div className="flex justify-end -mt-2">
            <button
              onClick={proceed}
              className="text-xs text-[oklch(0.72_0.19_45)] hover:text-[oklch(0.80_0.19_45)] transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign in button */}
          <button
            onClick={proceed}
            className="h-10 rounded-lg bg-[oklch(0.72_0.19_45)] hover:bg-[oklch(0.78_0.19_45)] text-[oklch(0.12_0_0)] text-sm font-semibold transition-colors"
          >
            Sign In
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* SSO / other providers — prototype buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={proceed}
              className="h-10 rounded-lg bg-[oklch(0.20_0_0)] hover:bg-[oklch(0.24_0_0)] border border-border text-sm font-medium text-foreground flex items-center justify-center gap-2.5 transition-colors"
            >
              {/* Google icon */}
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        {/* Sign up link */}
        <p className="text-center text-xs text-muted-foreground">
          {"Don't have an account? "}
          <button onClick={proceed} className="text-[oklch(0.72_0.19_45)] hover:text-[oklch(0.80_0.19_45)] transition-colors font-medium">
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}

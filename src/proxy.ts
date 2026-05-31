import { NextResponse, type NextRequest } from "next/server"

const AUTH_COOKIE = "better-auth.session_token"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthRoute = pathname === "/sign-in" || pathname === "/sign-up"
  const isLandingPage = pathname === "/"
  const hasSession = request.cookies.has(AUTH_COOKIE)

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!isLandingPage && !isAuthRoute && !hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

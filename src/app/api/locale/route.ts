import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/lib/dictionaries";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const lang = searchParams.get("lang");
  const next = searchParams.get("next") ?? "/";
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const response = NextResponse.redirect(new URL(target, origin));
  if (isLocale(lang)) {
    response.cookies.set(LOCALE_COOKIE, lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

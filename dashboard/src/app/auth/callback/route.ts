import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    const next = searchParams.get("next") || "/dashboard";
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    // Expose the real error so we can diagnose
    const msg = encodeURIComponent(error.message || error.name || "unknown");
    return NextResponse.redirect(`${origin}/login?error=callback_failed&detail=${msg}`);
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * OAuth Callback Handler
 *
 * After the user approves Google OAuth, Supabase redirects here with a
 * one-time `code`. We exchange it for a session and store it in HTTP-only
 * cookies via @supabase/ssr — so the session persists on both server and
 * client after redirect.
 *
 * Supabase Dashboard → Authentication → URL Configuration must include:
 *   https://<your-app>.vercel.app/auth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Optional: redirect to a specific page after login (e.g. /portfolio)
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[Auth Callback] exchangeCodeForSession error:', error.message);
  }

  // Redirect home with an error flag so the UI can show a message if needed
  return NextResponse.redirect(`${origin}/?auth_error=callback_failed`);
}

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Sessions are persisted via HTTP-only cookies so they
 * survive page refreshes and server-side rendering.
 *
 * Do NOT import this in Client Components — use `@/lib/supabase` instead.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` is called from a Server Component — cookies can only be
            // mutated from middleware or Route Handlers. Silently ignore in RSC.
          }
        },
      },
    }
  );
}

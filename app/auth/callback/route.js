import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  
  console.log('🔴 Callback called with:', { code: code ? 'exists' : 'missing', type });

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    console.log('🔴 Exchange result:', { error: error?.message || 'no error', type });
    
    if (!error) {
      // If this is a password recovery, redirect to reset-password page
      if (type === 'recovery' || type === 'password_recovery') {
        console.log('🔴 Redirecting to /reset-password');
        return NextResponse.redirect(new URL('/reset-password', request.url));
      }
      
      console.log('🔴 Redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  console.log('🔴 No code or error, redirecting to home');
  return NextResponse.redirect(new URL('/', request.url));
}

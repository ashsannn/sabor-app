'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase';
import { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';

export default function AuthComponent({ onSuccess, onBack }) {
  const supabase = createClient();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && onSuccess) {
        onSuccess();
      }
    });

    return () => subscription.unsubscribe();
  }, [onSuccess]);

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header with back button */}
      <div className="bg-white border-b border-stone-200 p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-xl font-bold text-amber-700">SABOR</h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Auth content */}
      <div className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
            <p className="text-gray-600">Sign up to save your preferences across devices</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#d97706',
                      brandAccent: '#b45309',
                    },
                  },
                },
              }}
              providers={['google']}
              redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

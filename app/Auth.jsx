'use client';

import { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/app/lib/supabase';
import { Menu, X } from 'lucide-react';

export default function AuthComponent({ onSuccess, onBack }) {
  const supabase = createClient();
  const [view, setView] = useState('sign_in'); // 'sign_in', 'sign_up', 'forgotten_password'
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Listen for successful sign in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Redirect to home on successful sign in
        if (onSuccess) onSuccess();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, onSuccess]);

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      {/* Hamburger Menu */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-700 hover:text-amber-600 transition-colors p-2"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* Simple Sidebar */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-amber-600">SABOR</h2>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <button
              onClick={() => {
                setSidebarOpen(false);
                if (onBack) onBack();
              }}
              className="w-full text-left px-4 py-2 hover:bg-amber-50 rounded-lg transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </>
      )}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-700 mb-2">SABOR</h1>
          <p className="text-gray-600">
            {view === 'forgotten_password' 
              ? 'Reset your password' 
              : 'Sign in to save your preferences'}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          <div className="hide-supabase-forgot-password">
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
              view={view}
              providers={[]}
              redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
              onlyThirdPartyProviders={false}
              magicLink={false}
            />
          </div>

          <style jsx>{`
            .hide-supabase-forgot-password :global(a[href*="forgotten"]),
            .hide-supabase-forgot-password :global(button:has(+ a)) {
              display: none !important;
            }
          `}</style>

          {view === 'forgotten_password' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setView('sign_in');
                  setMessage('');
                }}
                className="text-sm text-amber-700 hover:text-amber-800 underline"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

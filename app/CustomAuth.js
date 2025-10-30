'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function CustomAuth({ onSuccess, onBack }) {
  const supabase = createClient();
  const [view, setView] = useState('sign_in'); // 'sign_in' or 'sign_up'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else if (data.user) {
      setMessage({ type: 'success', text: 'Signed in successfully!' });
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 500);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else if (data.user) {
      setMessage({ 
        type: 'success', 
        text: 'Check your email to confirm your account!' 
      });
    }
  };

  return (
    <div>
      {/* Large SABOR Title */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '700',
          color: '#E4703E',
          fontFamily: 'Birdie, serif',
          letterSpacing: '0.02em',
          marginBottom: '8px'
        }}>
          SABOR
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#6B7280'
        }}>
          Sign in to save your preferences
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '600',
          backgroundColor: message.type === 'error' ? '#FEE2E2' : '#D1FAE5',
          color: message.type === 'error' ? '#991B1B' : '#065F46'
        }}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        backgroundColor: '#F3F4F6',
        padding: '4px',
        borderRadius: '12px'
      }}>
        <button
          onClick={() => setView('sign_in')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: view === 'sign_in' ? 'white' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            color: view === 'sign_in' ? '#E4703E' : '#6B7280',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: view === 'sign_in' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
          }}
        >
          Sign In
        </button>
        <button
          onClick={() => setView('sign_up')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: view === 'sign_up' ? 'white' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            color: view === 'sign_up' ? '#E4703E' : '#6B7280',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: view === 'sign_up' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
          }}
        >
          Sign Up
        </button>
      </div>

      {/* Sign In Form */}
      {view === 'sign_in' && (
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'Karla, sans-serif'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Your Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'Karla, sans-serif'
              }}
            />
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                alert('Password reset functionality coming soon!');
              }}
              style={{
                display: 'block',
                textAlign: 'right',
                fontSize: '14px',
                color: '#E4703E',
                textDecoration: 'none',
                marginTop: '8px'
              }}
            >
              Forgot your password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#D1D5DB' : '#D97706',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: '8px'
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '14px',
            color: '#6B7280'
          }}>
            Don't have an account?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setView('sign_up');
                setMessage({ type: '', text: '' });
              }}
              style={{
                color: '#E4703E',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Sign up
            </a>
          </div>
        </form>
      )}

      {/* Sign Up Form */}
      {view === 'sign_up' && (
        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'Karla, sans-serif'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'Karla, sans-serif'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'Karla, sans-serif'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#D1D5DB' : '#D97706',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: '8px'
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '14px',
            color: '#6B7280'
          }}>
            Already have an account?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setView('sign_in');
                setMessage({ type: '', text: '' });
              }}
              style={{
                color: '#E4703E',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Sign in
            </a>
          </div>
        </form>
      )}
    </div>
  );
}

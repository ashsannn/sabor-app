'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function ResetPassword() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    // Check if user is in recovery mode (after clicking reset link)
    const checkRecoverySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setTokenValid(false);
        setMessage({ 
          type: 'error', 
          text: 'Password reset link expired or invalid. Please request a new one.' 
        });
      }
    };

    checkRecoverySession();
  }, [supabase]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ 
        type: 'success', 
        text: 'Password updated successfully! Redirecting...' 
      });
      
      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-700 mb-2">SABOR</h1>
          <p className="text-gray-600">Set your new password</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
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

          {tokenValid ? (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
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
                  placeholder="Confirm your new password"
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
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '20px'
              }}>
                Please request a new password reset link.
              </p>
              <a
                href="/auth"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#D97706',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Back to Sign In
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
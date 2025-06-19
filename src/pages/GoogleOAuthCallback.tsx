// GoogleOAuthCallback.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const GoogleOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithGoogle } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange authorization code for tokens
        const response = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange authorization code');
        }

        const data = await response.json();
        
        if (data.credential) {
          await signInWithGoogle(data.credential);
          setStatus('success');
          
          // Redirect to the intended page or dashboard
          const stateData = state ? JSON.parse(atob(state)) : null;
          const returnUrl = stateData?.returnUrl || '/dashboard';
          
          setTimeout(() => {
            navigate(returnUrl);
          }, 2000);
        } else {
          throw new Error('No credential received from callback');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
        setStatus('error');
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, signInWithGoogle, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {status === 'processing' && 'Processing Google Sign-In...'}
            {status === 'success' && 'Sign-In Successful!'}
            {status === 'error' && 'Sign-In Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Please wait while we complete your sign-in.'}
            {status === 'success' && 'Redirecting you to the dashboard...'}
            {status === 'error' && 'Redirecting you back to the login page...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'processing' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          {status === 'success' && (
            <div className="text-green-600">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="mt-2">Welcome! You have been successfully signed in.</p>
            </div>
          )}
          {status === 'error' && (
            <div className="text-red-600">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="mt-2">Something went wrong during sign-in.</p>
              {errorMessage && (
                <p className="mt-1 text-sm text-gray-600">{errorMessage}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleOAuthCallback;

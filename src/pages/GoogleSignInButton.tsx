// GoogleSignInButton.tsx
import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const GoogleSignInButton = () => {
  const { signInWithGoogle } = useAuth();
  const [useRedirect, setUseRedirect] = useState(false);

  // Enhanced Google Sign-In using redirect flow (COOP-safe)
  const handleGoogleSignInRedirect = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const state = btoa(JSON.stringify({ 
      timestamp: Date.now(),
      returnUrl: window.location.pathname 
    }));
    
    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`;
    
    // Use location.replace to avoid COOP issues
    window.location.replace(googleAuthUrl);
  };

  // Handle popup sign-in with COOP error fallback
  const handlePopupSignIn = (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        signInWithGoogle(credentialResponse.credential);
      }
    } catch (error) {
      console.error("Popup sign-in failed:", error);
      setUseRedirect(true);
    }
  };

  const handlePopupError = () => {
    console.error("Google Sign-In popup failed due to COOP policy, switching to redirect method");
    setUseRedirect(true);
  };

  // If we detected COOP issues, show only redirect option
  if (useRedirect) {
    return (
      <div className="space-y-3">
        <Button
          onClick={handleGoogleSignInRedirect}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
        <p className="text-xs text-gray-500 text-center">
          Using secure redirect method for compatibility
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Primary Google Sign-In (popup) with error handling */}
      <GoogleLogin
        onSuccess={handlePopupSignIn}
        onError={handlePopupError}
        useOneTap={false}
        auto_select={false}
        cancel_on_tap_outside={true}
        context="signin"
        size="large"
        text="signin_with"
        shape="rectangular"
        logo_alignment="left"
        theme="outline"
      />
      
      {/* Alternative: Redirect-based Google Sign-In */}
      <div className="text-center">
        <Button
          onClick={handleGoogleSignInRedirect}
          variant="outline"
          size="sm"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Having trouble? Try alternative sign-in method        </Button>
      </div>
    </div>
  );
};

export default GoogleSignInButton;

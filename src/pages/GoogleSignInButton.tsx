// GoogleSignInButton.tsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';

const GoogleSignInButton = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <GoogleLogin
      onSuccess={credentialResponse => {
        if (credentialResponse.credential) {
          signInWithGoogle(credentialResponse.credential);
        }
      }}
      onError={() => {
        console.error("Google Sign-In failed");
      }}
      useOneTap={false}
      auto_select={false}
      cancel_on_tap_outside={true}
      context="signin"
      size="large"
    />
  );
};

export default GoogleSignInButton;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import SecureSignUpForm from '@/components/auth/SecureSignUpForm';

// Enhanced registration with detailed validation error reporting - v2.1

const SignUpPage: React.FC = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleSignUp = async (formData: any) => {
    setIsLoading(true);
    setError('');

    console.log('🎯 SignUp.tsx received data from form:', formData);
    console.log('🔢 Number of fields received:', Object.keys(formData || {}).length);
    console.log('📋 Field names received:', Object.keys(formData || {}));

    try {
      console.log('🔍 Sending registration data:', JSON.stringify(formData, null, 2));
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📝 Response data:', data);

      if (response.ok) {
        // Registration successful
        navigate('/thank-you', { 
          state: { 
            message: 'Account created successfully! Please check your email to verify your account.' 
          }
        });
      } else {
        // Show detailed validation errors if available
        let errorMessage = data.message || 'Registration failed. Please try again.';
        if (data.errors && Array.isArray(data.errors)) {
          const validationErrors = data.errors.map((err: any) => `${err.path || err.param || 'Field'}: ${err.msg}`);
          errorMessage = validationErrors.join('\n');
          console.error('🚨 Detailed validation errors:', data.errors);
        }
        setError(errorMessage);
        console.error('❌ Registration failed:', data);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
          <p className="text-gray-600">Join our educational feedback platform</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Security & Privacy Notice
            </CardTitle>
            <CardDescription>
              By creating an account, you agree to our security policies and data protection measures.
              All information is encrypted and handled according to privacy best practices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <SecureSignUpForm 
              onSubmit={handleSignUp}
              isLoading={isLoading}
              error={error}
            />
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;

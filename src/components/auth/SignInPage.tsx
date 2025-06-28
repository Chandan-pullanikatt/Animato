import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Film, Play, Settings, ExternalLink } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { useAuthStore } from '../../store/authStore';
import { useForm } from 'react-hook-form';

interface SignInForm {
  email: string;
  password: string;
}

interface SignInPageProps {
  onSwitchToSignUp: () => void;
  onClose: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSwitchToSignUp, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { login, isLoading } = useAuthStore();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch,
    setValue
  } = useForm<SignInForm>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  const onSubmit = async (data: SignInForm) => {
    setAuthError(null);
    
    try {
      await login(data.email.trim(), data.password.trim());
      onClose();
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthError(error.message || 'Sign in failed');
    }
  };

  const handleDemoLogin = () => {
    setValue('email', 'demo@animato.com');
    setValue('password', 'demo123');
    // Auto-submit after setting values
    setTimeout(() => {
      handleSubmit(onSubmit)();
    }, 100);
  };

  const hasValidEmail = watchedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail);
  const hasValidPassword = watchedPassword && watchedPassword.length >= 6;
  const canSubmit = hasValidEmail && hasValidPassword && !isLoading;

  // Check if error is related to email confirmation
  const isEmailConfirmationError = authError && (
    authError.includes('Email confirmation') || 
    authError.includes('email confirmation') ||
    authError.includes('confirmation link') ||
    authError.includes('Supabase project settings') ||
    authError.includes('email confirmation to be disabled') ||
    authError.includes('disable email confirmation')
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="shadow-xl border-0">
        <CardContent className="p-6">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                <Film className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Animato
              </h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to continue creating
            </p>
          </div>

          {/* Error Display */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 border rounded-lg ${
                isEmailConfirmationError 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start space-x-3">
                {isEmailConfirmationError ? (
                  <Settings className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className={`text-sm font-medium mb-1 ${
                    isEmailConfirmationError 
                      ? 'text-amber-800 dark:text-amber-200'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {isEmailConfirmationError ? 'Email Confirmation Required' : 'Sign In Error'}
                  </div>
                  <div className={`text-sm ${
                    isEmailConfirmationError 
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {authError}
                  </div>
                  {isEmailConfirmationError && (
                    <div className="mt-4 space-y-3">
                      <div className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
                        <div className="font-medium">To fix this issue:</div>
                        <div>1. Go to your Supabase project dashboard</div>
                        <div>2. Navigate to Authentication → Settings</div>
                        <div>3. Toggle off "Email Confirm" under Email Sign-up</div>
                        <div>4. Save changes and try signing in again</div>
                      </div>
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-medium"
                      >
                        Open Supabase Dashboard
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
              error={errors.email?.message}
              placeholder="Enter your email"
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={<Lock className="w-4 h-4" />}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                error={errors.password?.message}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={!canSubmit}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Demo Account */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-center">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                🎬 Try the Demo Experience
              </div>
              <Button
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                {isLoading ? 'Signing In...' : 'Sign In with Demo Account'}
              </Button>
              <div className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                <div>✨ Pre-loaded with sample stories</div>
                <div>🎭 AI-generated characters and content</div>
                <div>🚀 Full platform experience</div>
              </div>
              {isEmailConfirmationError && (
                <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded text-xs text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> Demo account requires email confirmation to be disabled in Supabase settings.
                </div>
              )}
            </div>
          </div>

          {/* Switch to Sign Up */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                Create account
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
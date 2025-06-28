import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Film } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { useAuthStore } from '../../store/authStore';
import { useForm } from 'react-hook-form';

interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpPageProps {
  onSwitchToSignIn: () => void;
  onClose: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToSignIn, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { signup, isLoading } = useAuthStore();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch
  } = useForm<SignUpForm>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');

  const onSubmit = async (data: SignUpForm) => {
    setAuthError(null);
    
    if (data.password !== data.confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    
    try {
      await signup(data.email.trim(), data.password.trim());
      onClose();
    } catch (error: any) {
      console.error('Sign up error:', error);
      setAuthError(error.message || 'Sign up failed');
    }
  };

  const hasValidEmail = watchedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail);
  const hasValidPassword = watchedPassword && watchedPassword.length >= 6;
  const passwordsMatch = watchedPassword && watchedConfirmPassword && watchedPassword === watchedConfirmPassword;
  const canSubmit = hasValidEmail && hasValidPassword && passwordsMatch && !isLoading;

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    return {
      strength,
      label: labels[Math.min(strength - 1, 4)] || '',
      color: colors[Math.min(strength - 1, 4)] || 'bg-gray-300'
    };
  };

  const passwordStrength = getPasswordStrength(watchedPassword || '');

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
              <div className="p-2 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-lg">
                <Film className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent">
                Animato
              </h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Create Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Start your storytelling journey
            </p>
          </div>

          {/* Error Display */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-300">{authError}</span>
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
                placeholder="Create a password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              
              {/* Password Strength Indicator */}
              {watchedPassword && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                icon={<Lock className="w-4 h-4" />}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === watchedPassword || 'Passwords do not match'
                })}
                error={errors.confirmPassword?.message}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <a href="#" className="text-secondary-600 hover:text-secondary-700 font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-secondary-600 hover:text-secondary-700 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-secondary-600 to-accent-600 hover:from-secondary-700 hover:to-accent-700"
              isLoading={isLoading}
              disabled={!canSubmit}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Benefits */}
          <div className="mt-6 p-4 bg-gradient-to-r from-secondary-50 to-accent-50 dark:from-secondary-900/20 dark:to-accent-900/20 border border-secondary-200 dark:border-secondary-800 rounded-lg">
            <div className="text-center">
              <div className="text-sm font-medium text-secondary-800 dark:text-secondary-200 mb-2">
                What you get:
              </div>
              <div className="text-xs text-secondary-700 dark:text-secondary-300 space-y-1">
                <div>✨ 100 free credits to start</div>
                <div>🎬 AI story & video generation</div>
                <div>👥 Character creation with photos</div>
              </div>
            </div>
          </div>

          {/* Switch to Sign In */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
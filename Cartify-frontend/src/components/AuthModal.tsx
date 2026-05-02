import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ArrowRight, Github, Chrome, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
  onLoginSuccess: (userData: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, showToast, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          showToast?.('Passwords do not match', 'error');
          setIsLoading(false);
          return;
        }

        // ✅ REMOVED: console.log leaking password in plain text
        const userData = {
          email: formData.email,
          password: formData.password,
          username: formData.name,
          role: 'USER'
        };

        const response = await api.register(userData);
        // ✅ REMOVED: console.log('Registration response') - may contain sensitive data

        if (response?.success || response?.data || response?.user || response?.id) {
          showToast?.('Registration successful! You can now sign in.', 'success');
          setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: ''
          }));
          setMode('login');
        } else {
          const errorMessage = response?.message || response?.error || 'Registration failed';
          showToast?.(errorMessage, 'error');
        }

      } else if (mode === 'login') {
        if (!formData.email || !formData.password) {
          showToast?.('Please enter email and password', 'error');
          setIsLoading(false);
          return;
        }

        // ✅ REMOVED: console.log('Sending login data') - was exposing password in plain text
        const credentials = {
          email: formData.email,
          password: formData.password
        };

        const response = await api.login(credentials);
        // ✅ REMOVED: console.log('Login response') - may contain token data

        if (response?.user) {
          showToast?.('Login successful!', 'success');
          onLoginSuccess(response.user);
          setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            otp: '',
            newPassword: '',
            confirmNewPassword: ''
          });
          onClose();
        } else {
          showToast?.('Login failed - no user data received', 'error');
        }

      } else if (mode === 'forgot-password') {
        if (!formData.email) {
          showToast?.('Please enter your email', 'error');
          setIsLoading(false);
          return;
        }

        await api.generateOtp(formData.email);
        showToast?.('OTP sent to your email!', 'success');
        setMode('reset-password');

      } else if (mode === 'reset-password') {
        if (formData.newPassword !== formData.confirmNewPassword) {
          showToast?.('Passwords do not match', 'error');
          setIsLoading(false);
          return;
        }

        if (!formData.otp || formData.otp.length !== 6) {
          showToast?.('Please enter a valid 6-digit OTP', 'error');
          setIsLoading(false);
          return;
        }

        await api.resetPassword({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword
        });

        showToast?.('Password reset successful! You can now sign in.', 'success');
        setMode('login');
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          otp: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      }
    } catch (error) {
      // ✅ Only log error type, never the error content which may contain credentials
      showToast?.(error instanceof Error ? error.message : 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);
      showToast?.('Coming soon!', 'info');
      setIsLoading(false);
    } catch (error) {
      showToast?.(`${provider} login failed`, 'error');
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Create Account';
      case 'forgot-password': return 'Forgot Password';
      case 'reset-password': return 'Reset Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Enter your details to access your account';
      case 'register': return 'Join cartify for a premium shopping experience';
      case 'forgot-password': return 'Enter your email to receive a password reset OTP';
      case 'reset-password': return 'Enter the OTP sent to your email and your new password';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white dark:bg-brand-900 z-[210] rounded-3xl overflow-hidden shadow-2xl p-8"
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 md:top-4 md:right-4 p-3 md:p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-full transition-colors z-10 touch-manipulation"
              style={{ minWidth: '44px', minHeight: '44px' }}
              type="button"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold mb-2">
                {getTitle()}
              </h2>
              <p className="text-brand-500 text-sm">
                {getSubtitle()}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                  />
                </div>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'forgot-password' || mode === 'reset-password') && (
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    readOnly={mode === 'reset-password'}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors disabled:opacity-50"
                  />
                </div>
              )}

              {mode === 'reset-password' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                  <input
                    type="text"
                    name="otp"
                    required
                    maxLength={6}
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                  />
                </div>
              )}

              {(mode === 'login' || mode === 'register') && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 dark:hover:text-brand-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {mode === 'register' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 dark:hover:text-brand-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {mode === 'reset-password' && (
                <>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                    <input
                      type="password"
                      name="newPassword"
                      required
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="New Password"
                      className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                    <input
                      type="password"
                      name="confirmNewPassword"
                      required
                      value={formData.confirmNewPassword}
                      onChange={handleChange}
                      placeholder="Confirm New Password"
                      className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                    />
                  </div>
                </>
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-xs font-bold text-brand-500 hover:text-brand-950 dark:hover:text-white uppercase tracking-widest"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-brand-950 dark:bg-white dark:text-brand-950 text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'login' ? 'Sign In' :
                        mode === 'register' ? 'Create Account' :
                          mode === 'forgot-password' ? 'Send OTP' : 'Reset Password'}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {(mode === 'login' || mode === 'register') && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-brand-100 dark:border-brand-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest">
                    <span className="bg-white dark:bg-brand-900 px-4 text-brand-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 py-3 border border-brand-100 dark:border-brand-800 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors disabled:opacity-50"
                  >
                    <Chrome className="w-5 h-5" />
                    <span className="text-sm font-medium">Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('github')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 py-3 border border-brand-100 dark:border-brand-800 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors disabled:opacity-50"
                  >
                    <Github className="w-5 h-5" />
                    <span className="text-sm font-medium">GitHub</span>
                  </button>
                </div>
              </>
            )}

            <p className="mt-8 text-center text-sm text-brand-500">
              {mode === 'login' ? "Don't have an account?" :
                mode === 'register' ? "Already have an account?" :
                  "Remember your password?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : mode === 'login' ? 'register' : 'login');
                  setFormData(prev => ({
                    ...prev,
                    password: '',
                    confirmPassword: '',
                    otp: '',
                    newPassword: '',
                    confirmNewPassword: ''
                  }));
                }}
                className="font-bold text-brand-950 dark:text-white hover:underline"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

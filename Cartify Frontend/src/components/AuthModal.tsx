import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ArrowRight, Github, Chrome, Loader2 } from 'lucide-react';
import { api } from '../services/api';

// Define proper types
type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';
type ToastType = 'success' | 'info' | 'error';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (text: string, type?: ToastType) => void;
  onLoginSuccess: (user: any) => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface ApiResponse {
  success?: boolean;
  data?: any;
  user?: any;
  id?: string;
  message?: string;
  error?: string;
}

interface MessageEventData {
  type: 'AUTH_SUCCESS' | 'AUTH_ERROR';
  user?: any;
  message?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  showToast, 
  onLoginSuccess 
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Use ref for cleanup
  const popupRef = useRef<Window | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Cleanup function for social login
  const cleanupSocialLogin = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSocialLogin();
    };
  }, [cleanupSocialLogin]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        otp: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      setMode('login');
    }
  }, [isOpen]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!validateEmail(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (mode === 'login' || mode === 'register') {
      if (!validatePassword(formData.password)) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const userData = {
          email: formData.email.trim(),
          password: formData.password,
          username: formData.name.trim(),
          role: 'USER'
        };

        const response = await api.register(userData) as ApiResponse;

        // Check different possible success indicators
        if (response?.success || response?.data || response?.user || response?.id) {
          showToast('Registration successful! You can now sign in.', 'success');

          // Clear sensitive form data but keep email
          setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: '',
            name: '' // Clear name for security
          }));

          setMode('login');
        } else {
          const errorMessage = response?.message || response?.error || 'Registration failed';
          throw new Error(errorMessage);
        }

      } else if (mode === 'login') {
        if (!formData.email || !formData.password) {
          throw new Error('Please enter email and password');
        }

        const credentials = {
          email: formData.email.trim(),
          password: formData.password
        };

        const response = await api.login(credentials) as ApiResponse;

        if (response?.user) {
          showToast('Login successful!', 'success');
          onLoginSuccess(response.user);

          // Clear form
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
          throw new Error('Login failed - no user data received');
        }

      } else if (mode === 'forgot-password') {
        if (!formData.email) {
          throw new Error('Please enter your email');
        }

        await api.generateOtp(formData.email.trim());
        showToast('OTP sent to your email!', 'success');
        setMode('reset-password');

      } else if (mode === 'reset-password') {
        if (formData.newPassword !== formData.confirmNewPassword) {
          throw new Error('Passwords do not match');
        }

        if (!validatePassword(formData.newPassword)) {
          throw new Error('Password must be at least 6 characters long');
        }

        if (!formData.otp || formData.otp.length !== 6 || !/^\d+$/.test(formData.otp)) {
          throw new Error('Please enter a valid 6-digit OTP');
        }

        await api.resetPassword({
          email: formData.email.trim(),
          otp: formData.otp,
          newPassword: formData.newPassword
        });

        showToast('Password reset successful! You can now sign in.', 'success');
        setMode('login');
        setFormData({
          name: '',
          email: formData.email, // Keep email for convenience
          password: '',
          confirmPassword: '',
          otp: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      showToast(error instanceof Error ? error.message : 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for OTP - only allow digits
    if (name === 'otp') {
      const digitsOnly = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const apiUrl = process.env.REACT_APP_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      popupRef.current = window.open(
        `${apiUrl}/auth/${provider}`,
        `${provider} Auth`,
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );

      if (!popupRef.current) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      const messageHandler = (event: MessageEvent<MessageEventData>) => {
        // Validate origin
        if (event.origin !== apiUrl) return;

        const { data } = event;
        
        if (data.type === 'AUTH_SUCCESS' && data.user) {
          onLoginSuccess(data.user);
          onClose();
          showToast(`Successfully logged in with ${provider}!`, 'success');
          cleanupSocialLogin();
          popupRef.current?.close();
        } else if (data.type === 'AUTH_ERROR') {
          showToast(data.message || `${provider} login failed`, 'error');
          cleanupSocialLogin();
          popupRef.current?.close();
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if popup is closed
      intervalRef.current = setInterval(() => {
        if (popupRef.current?.closed) {
          cleanupSocialLogin();
          window.removeEventListener('message', messageHandler);
        }
      }, 1000);

      // Cleanup after 5 minutes maximum
      setTimeout(() => {
        cleanupSocialLogin();
        window.removeEventListener('message', messageHandler);
        popupRef.current?.close();
      }, 300000); // 5 minutes

    } catch (error) {
      console.error('Social login error:', error);
      showToast(error instanceof Error ? error.message : `${provider} login failed`, 'error');
      cleanupSocialLogin();
    }
  };

  const getTitle = (): string => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Create Account';
      case 'forgot-password': return 'Forgot Password';
      case 'reset-password': return 'Reset Password';
      default: return 'Authentication';
    }
  };

  const getSubtitle = (): string => {
    switch (mode) {
      case 'login': return 'Enter your details to access your account';
      case 'register': return 'Join cartify for a premium shopping experience';
      case 'forgot-password': return 'Enter your email to receive a password reset OTP';
      case 'reset-password': return 'Enter the OTP sent to your email and your new password';
      default: return '';
    }
  };

  const getButtonText = (): string => {
    switch (mode) {
      case 'login': return 'Sign In';
      case 'register': return 'Create Account';
      case 'forgot-password': return 'Send OTP';
      case 'reset-password': return 'Reset Password';
      default: return 'Submit';
    }
  };

  const handleModeSwitch = () => {
    if (mode === 'login') {
      setMode('register');
    } else if (mode === 'register') {
      setMode('login');
    } else {
      setMode('login');
    }
    
    // Clear sensitive data when switching modes
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
      otp: '',
      newPassword: '',
      confirmNewPassword: ''
    }));
  };

  const handleBackToLogin = () => {
    setMode('login');
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
      otp: '',
      newPassword: '',
      confirmNewPassword: ''
    }));
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
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white dark:bg-brand-900 z-[210] rounded-3xl overflow-hidden shadow-2xl p-8"
          >
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-full transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold mb-2">
                {getTitle()}
              </h2>
              <p className="text-brand-500 text-sm">
                {getSubtitle()}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
                    disabled={isLoading}
                    minLength={2}
                    maxLength={50}
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors disabled:opacity-50"
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
                    disabled={isLoading}
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors disabled:opacity-50 read-only:opacity-50"
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
                    disabled={isLoading}
                    inputMode="numeric"
                    pattern="\d*"
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors disabled:opacity-50"
                  />
                </div>
              )}

              {(mode === 'login' || mode === 'register') && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    disabled={isLoading}
                    minLength={6}
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors disabled:opacity-50"
                  />
                </div>
              )}

              {mode === 'register' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    disabled={isLoading}
                    minLength={6}
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors disabled:opacity-50"
                  />
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
                      disabled={isLoading}
                      minLength={6}
                      className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors disabled:opacity-50"
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
                      disabled={isLoading}
                      minLength={6}
                      className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors disabled:opacity-50"
                    />
                  </div>
                </>
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    disabled={isLoading}
                    className="text-xs font-bold text-brand-500 hover:text-brand-950 dark:hover:text-white uppercase tracking-widest disabled:opacity-50"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-brand-950 dark:bg-white dark:text-brand-950 text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{getButtonText()}</span>
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
                    className="flex items-center justify-center space-x-2 py-3 border border-brand-100 dark:border-brand-800 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Chrome className="w-5 h-5" />
                    <span className="text-sm font-medium">Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('github')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 py-3 border border-brand-100 dark:border-brand-800 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
               mode === 'forgot-password' || mode === 'reset-password' ? "Remember your password?" : ''}{' '}
              <button
                type="button"
                onClick={mode === 'forgot-password' || mode === 'reset-password' ? handleBackToLogin : handleModeSwitch}
                disabled={isLoading}
                className="font-bold text-brand-950 dark:text-white hover:underline disabled:opacity-50"
              >
                {mode === 'login' ? 'Sign Up' : 
                 mode === 'register' ? 'Sign In' : 
                 'Sign In'}
              </button>
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

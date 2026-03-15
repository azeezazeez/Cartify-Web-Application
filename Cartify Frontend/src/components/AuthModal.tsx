import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ArrowRight, Github, Chrome, Loader2 } from 'lucide-react';
import { api } from '../services/api'; // Adjust the import path as needed

// Define types for better type safety
type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';
type ToastType = 'success' | 'info' | 'error';

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  token?: string;
}

interface AuthResponse {
  success?: boolean;
  user?: User;
  data?: any;
  id?: string;
  message?: string;
  error?: string;
}

interface MessageData {
  type: string;
  user?: User;
  message?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (text: string, type?: ToastType) => void;
  onLoginSuccess: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  showToast,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const popupRef = useRef<Window | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup event listener on unmount
  useEffect(() => {
    return () => {
      if (messageHandlerRef.current) {
        window.removeEventListener('message', messageHandlerRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
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
      setIsLoading(false);
      
      // Clean up any existing popup intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isOpen]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Common validations
      if (!formData.email) {
        throw new Error('Email is required');
      }
      
      if (!validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (mode === 'register') {
        if (!formData.name) {
          throw new Error('Name is required');
        }
        
        if (!formData.password) {
          throw new Error('Password is required');
        }
        
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        const userData = {
          email: formData.email,
          password: formData.password,
          username: formData.name,
          role: 'USER'
        };

        const response = await api.register(userData) as AuthResponse;

        if (response?.success || response?.data || response?.user || response?.id) {
          showToast('Registration successful! You can now sign in.', 'success');
          setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: ''
          }));
          setMode('login');
        } else {
          const errorMessage = response?.message || response?.error || 'Registration failed';
          throw new Error(errorMessage);
        }

      } else if (mode === 'login') {
        if (!formData.password) {
          throw new Error('Password is required');
        }

        const credentials = {
          email: formData.email,
          password: formData.password
        };

        const response = await api.login(credentials) as AuthResponse;

        if (response?.user) {
          showToast('Login successful!', 'success');
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
          throw new Error(response?.message || 'Login failed - no user data received');
        }

      } else if (mode === 'forgot-password') {
        await api.generateOtp(formData.email);
        showToast('OTP sent to your email!', 'success');
        setMode('reset-password');

      } else if (mode === 'reset-password') {
        if (!formData.otp) {
          throw new Error('OTP is required');
        }
        
        if (formData.otp.length !== 6) {
          throw new Error('Please enter a valid 6-digit OTP');
        }
        
        if (!formData.newPassword) {
          throw new Error('New password is required');
        }
        
        if (formData.newPassword !== formData.confirmNewPassword) {
          throw new Error('Passwords do not match');
        }

        if (formData.newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        await api.resetPassword({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword
        });

        showToast('Password reset successful! You can now sign in.', 'success');
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
      console.error('Auth error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

      // Close any existing popup
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }

      const popup = window.open(
        `${apiUrl}/auth/${provider}`,
        `${provider} Auth`,
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      popupRef.current = popup;

      const messageHandler = (event: MessageEvent) => {
        // Validate event origin
        if (!event.origin || event.origin !== apiUrl) return;

        // Validate event data
        if (!event.data || typeof event.data !== 'object') return;

        const data = event.data as MessageData;

        if (data.type === 'AUTH_SUCCESS' && data.user) {
          onLoginSuccess(data.user);
          showToast(`Successfully logged in with ${provider}!`, 'success');
          
          // Clean up
          window.removeEventListener('message', messageHandler);
          if (popup && !popup.closed) {
            popup.close();
          }
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          onClose();
        } else if (data.type === 'AUTH_ERROR') {
          const errorMessage = data.message || `${provider} login failed`;
          showToast(errorMessage, 'error');
          
          // Clean up
          window.removeEventListener('message', messageHandler);
          if (popup && !popup.closed) {
            popup.close();
          }
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          setIsLoading(false);
        }
      };

      messageHandlerRef.current = messageHandler;
      window.addEventListener('message', messageHandler);

      // Check if popup was closed by user
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        if (popup.closed) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          window.removeEventListener('message', messageHandler);
          setIsLoading(false);
        }
      }, 1000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `${provider} login failed`;
      showToast(errorMessage, 'error');
      setIsLoading(false);
    }
  };

  const getTitle = (): string => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Create Account';
      case 'forgot-password': return 'Forgot Password';
      case 'reset-password': return 'Reset Password';
      default: return '';
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

  const handleCloseClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handleModeSwitch = () => {
    setMode(prev => {
      if (prev === 'register') return 'login';
      if (prev === 'login') return 'register';
      return 'login';
    });
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
      otp: '',
      newPassword: '',
      confirmNewPassword: ''
    }));
  };

  const handleForgotPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMode('forgot-password');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100000]"
      />
      <motion.div
        key="modal"
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={handleModalClick}
        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white dark:bg-brand-900 z-[100001] rounded-3xl overflow-hidden shadow-2xl p-8"
      >
        <button
          onClick={handleCloseClick}
          className="absolute top-4 right-4 p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-full transition-colors z-[100002] cursor-pointer"
          type="button"
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
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 pointer-events-none" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                disabled={isLoading}
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot-password' || mode === 'reset-password') && (
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 pointer-events-none" />
              <input
                type="email"
                name="email"
                required
                readOnly={mode === 'reset-password'}
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors disabled:opacity-50"
                disabled={isLoading || mode === 'reset-password'}
              />
            </div>
          )}

          {mode === 'reset-password' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 pointer-events-none" />
              <input
                type="text"
                name="otp"
                required
                maxLength={6}
                value={formData.otp}
                onChange={handleChange}
                placeholder="Enter 6-digit OTP"
                className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                disabled={isLoading}
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 pointer-events-none" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                disabled={isLoading}
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 pointer-events-none" />
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                disabled={isLoading}
              />
            </div>
          )}

          {mode === 'reset-password' && (
            <>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 pointer-events-none" />
                <input
                  type="password"
                  name="newPassword"
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="New Password"
                  className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 pointer-events-none" />
                <input
                  type="password"
                  name="confirmNewPassword"
                  required
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  placeholder="Confirm New Password"
                  className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-brand-500 hover:text-brand-950 dark:hover:text-white uppercase tracking-widest"
                disabled={isLoading}
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
              "Remember your password?"}{' '}
          <button
            type="button"
            onClick={handleModeSwitch}
            className="font-bold text-brand-950 dark:text-white hover:underline disabled:opacity-50"
            disabled={isLoading}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ArrowRight, Github, Chrome, Loader2 } from 'lucide-react';
import { api } from '../services/api'; // Adjust the import path as needed

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  onLoginSuccess: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  showToast,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
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

  // Add ref for message handler to use in cleanup
  const messageHandlerRef = useRef<(event: MessageEvent) => void>();

  // Cleanup event listener on unmount
  useEffect(() => {
    return () => {
      if (messageHandlerRef.current) {
        window.removeEventListener('message', messageHandlerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Log the data being sent
        console.log('Sending registration data:', {
          email: formData.email,
          password: formData.password,
          username: formData.name,
          role: 'USER'
        });

        const userData = {
          email: formData.email,
          password: formData.password,
          username: formData.name,
          role: 'USER'
        };

        const response = await api.register(userData);

        // Log the response for debugging
        console.log('Registration response:', response);

        // Check different possible success indicators
        if (response?.success || response?.data || response?.user || response?.id) {
          showToast('Registration successful! You can now sign in.', 'success');

          // Clear sensitive form data
          setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: ''
          }));

          // Switch to login mode
          setMode('login');
        } else {
          // If response has a message, show it
          const errorMessage = response?.message || response?.error || 'Registration failed';
          throw new Error(errorMessage);
        }

      } else if (mode === 'login') {
        if (!formData.email || !formData.password) {
          throw new Error('Please enter email and password');
        }

        console.log('Sending login data:', {
          email: formData.email,
          password: formData.password
        });

        const credentials = {
          email: formData.email,
          password: formData.password
        };

        const response = await api.login(credentials);

        console.log('Login response:', response);

        if (response?.user) {
          showToast('Login successful!', 'success');
          onLoginSuccess(response.user);

          // Clear form and close modal
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

        await api.generateOtp(formData.email);
        showToast('OTP sent to your email!', 'success');
        setMode('reset-password');

      } else if (mode === 'reset-password') {
        if (formData.newPassword !== formData.confirmNewPassword) {
          throw new Error('Passwords do not match');
        }

        if (!formData.otp || formData.otp.length !== 6) {
          throw new Error('Please enter a valid 6-digit OTP');
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
      showToast(error instanceof Error ? error.message : 'Authentication failed', 'error');
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

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        `${process.env.REACT_APP_API_URL}/auth/${provider}`,
        `${provider} Auth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Check if popup was blocked
      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      const messageHandler = (event: MessageEvent) => {
        // Add null check for event.origin
        if (!event.origin) return;
        
        if (event.origin !== process.env.REACT_APP_API_URL) return;

        if (event.data.type === 'AUTH_SUCCESS' && event.data.user) {
          onLoginSuccess(event.data.user);
          onClose();
          showToast(`Successfully logged in with ${provider}!`, 'success');
          window.removeEventListener('message', messageHandler);
          popup?.close();
        } else if (event.data.type === 'AUTH_ERROR') {
          showToast(event.data.message || `${provider} login failed`, 'error');
          window.removeEventListener('message', messageHandler);
          popup?.close();
        }
      };

      // Store the handler in ref for cleanup
      messageHandlerRef.current = messageHandler;
      window.addEventListener('message', messageHandler);

      const checkPopupClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', messageHandler);
          setIsLoading(false);
        }
      }, 1000);

    } catch (error) {
      showToast(error instanceof Error ? error.message : `${provider} login failed`, 'error');
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Create Account';
      case 'forgot-password': return 'Forgot Password';
      case 'reset-password': return 'Reset Password';
      default: return ''; // Add default return
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Enter your details to access your account';
      case 'register': return 'Join cartify for a premium shopping experience';
      case 'forgot-password': return 'Enter your email to receive a password reset OTP';
      case 'reset-password': return 'Enter the OTP sent to your email and your new password';
      default: return ''; // Add default return
    }
  };

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
    }
  }, [isOpen]);

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
              className="absolute top-4 right-4 p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-full transition-colors"
              type="button"
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
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
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
                    className="w-full bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
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

export default AuthModal;

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ArrowRight, Github, Chrome, Loader2 } from 'lucide-react';
import { api } from '../services/api';

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

  const messageHandlerRef = useRef<(event: MessageEvent) => void>();

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

        const response = await api.register({
          email: formData.email,
          password: formData.password,
          username: formData.name,
          role: 'USER'
        });

        if (response?.success || response?.data || response?.user || response?.id) {
          showToast('Registration successful! You can now sign in.', 'success');

          setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: ''
          }));

          setMode('login');
        } else {
          throw new Error(response?.message || 'Registration failed');
        }

      }

      else if (mode === 'login') {

        if (!formData.email || !formData.password) {
          throw new Error('Please enter email and password');
        }

        const response = await api.login({
          email: formData.email,
          password: formData.password
        });

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
          throw new Error('Login failed');
        }

      }

      else if (mode === 'forgot-password') {

        await api.generateOtp(formData.email);
        showToast('OTP sent to your email!', 'success');
        setMode('reset-password');

      }

      else if (mode === 'reset-password') {

        if (formData.newPassword !== formData.confirmNewPassword) {
          throw new Error('Passwords do not match');
        }

        await api.resetPassword({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword
        });

        showToast('Password reset successful!', 'success');

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

      showToast(
        error instanceof Error ? error.message : 'Authentication failed',
        'error'
      );

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

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Create Account';
      case 'forgot-password': return 'Forgot Password';
      case 'reset-password': return 'Reset Password';
      default: return '';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Enter your details to access your account';
      case 'register': return 'Join cartify for a premium shopping experience';
      case 'forgot-password': return 'Enter your email to receive a password reset OTP';
      case 'reset-password': return 'Enter OTP and your new password';
      default: return '';
    }
  };

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

        <motion.div
          className="fixed inset-0 flex items-center justify-center z-[100000]"
          onClick={onClose}
        >

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative md:w-full md:max-w-md bg-white dark:bg-brand-900 rounded-3xl overflow-hidden shadow-2xl p-8"
          >

            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-full transition-colors"
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
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400"/>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full bg-brand-50 border rounded-xl py-3 pl-12 pr-4"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400"/>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full bg-brand-50 border rounded-xl py-3 pl-12 pr-4"
                />
              </div>

              {(mode === 'login' || mode === 'register') && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400"/>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full bg-brand-50 border rounded-xl py-3 pl-12 pr-4"
                  />
                </div>
              )}

              <button
                disabled={isLoading}
                className="w-full py-4 bg-brand-950 text-white rounded-xl font-bold flex items-center justify-center space-x-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : (
                  <>
                    <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-5 h-5"/>
                  </>
                )}
              </button>

            </form>

          </motion.div>

        </motion.div>

      )}

    </AnimatePresence>

  );

};

export default AuthModal;

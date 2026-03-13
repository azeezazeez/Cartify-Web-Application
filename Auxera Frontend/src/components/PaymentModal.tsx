import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, ShieldCheck, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, total, onSuccess }) => {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '' });
  const [upiId, setUpiId] = useState('');

  const handlePay = () => {
    // Basic validation
    if (paymentMethod === 'card') {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc) {
        alert('Please fill in all card details');
        return;
      }
    } else {
      if (!upiId || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID');
        return;
      }
    }

    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
        setStep('details'); // Reset for next time
      }, 2000);
    }, 2000);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-brand-900 z-[260] rounded-3xl overflow-hidden shadow-2xl p-8"
          >
            {step !== 'processing' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}

            {step === 'details' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-serif font-bold mb-2">Checkout</h2>
                  <p className="text-brand-500 text-sm">Secure payment for your order</p>
                </div>

                <div className="p-6 bg-brand-50 dark:bg-brand-800 rounded-2xl border border-brand-100 dark:border-brand-700">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-brand-500">Total Amount</span>
                    <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-600 text-xs font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Encrypted & Secure</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-brand-500">Payment Method</h3>
                  </div>
                  
                  {/* Method Selector */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={cn(
                        "py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2",
                        paymentMethod === 'card' 
                          ? "border-brand-950 dark:border-white bg-brand-50 dark:bg-brand-800" 
                          : "border-brand-100 dark:border-brand-800 hover:border-brand-300"
                      )}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Card</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={cn(
                        "py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2",
                        paymentMethod === 'upi' 
                          ? "border-brand-950 dark:border-white bg-brand-50 dark:bg-brand-800" 
                          : "border-brand-100 dark:border-brand-800 hover:border-brand-300"
                      )}
                    >
                      <div className="w-5 h-5 flex items-center justify-center font-bold text-sm">@</div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">UPI</span>
                    </button>
                  </div>

                  {/* Card Section */}
                  {paymentMethod === 'card' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Debit / Credit Card</span>
                        <div className="flex space-x-2">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" />
                          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-3" />
                        </div>
                      </div>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                        <input
                          type="text"
                          placeholder="Card Number"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                          className="w-full bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          className="w-full bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-700 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="CVC"
                          value={cardDetails.cvc}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                          className="w-full bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-700 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* UPI Section */}
                  {paymentMethod === 'upi' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">UPI Payment</span>
                        <div className="flex space-x-3">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-3" />
                          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Pay_Logo.svg" alt="GPay" className="h-3" />
                          <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-3" />
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                          <span className="text-brand-400 font-bold text-xs">@</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter UPI ID (e.g., user@bank)"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-950 dark:focus:border-white transition-colors"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <button
                  onClick={handlePay}
                  className="w-full py-4 bg-brand-950 dark:bg-white dark:text-brand-950 text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-lg mt-6"
                >
                  <Lock className="w-4 h-4" />
                  <span>Pay ${total.toFixed(2)}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="flex justify-center space-x-4 opacity-30 pt-4">
                  <Lock className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">PCI DSS Compliant</span>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-950 dark:border-brand-800 dark:border-t-white rounded-full animate-spin" />
                <div className="text-center">
                  <h3 className="text-xl font-bold">Processing Payment</h3>
                  <p className="text-brand-500 text-sm">Please do not refresh the page</p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-2xl font-serif font-bold">Payment Successful</h3>
                  <p className="text-brand-500 text-sm">Thank you for your order!</p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, ShieldCheck, Lock, ArrowRight, CheckCircle2, Wallet } from 'lucide-react';

// Utility function for conditional classes
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onSuccess: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

interface CardType {
  id: string;
  name: string;
  icon: string;
}

interface UpiApp {
  id: string;
  name: string;
  icon: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, total, onSuccess }) => {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [selectedCardType, setSelectedCardType] = useState<string>('');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState({
    card: { number: '', expiry: '', cvc: '' },
    upi: { id: '' }
  });
  const [errors, setErrors] = useState<{
    card?: { number?: string; expiry?: string; cvc?: string };
    upi?: { id?: string };
  }>({});

  // Payment methods configuration with icons8 logos
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'https://img.icons8.com/?size=100&id=22186&format=png&color=000000'
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: 'https://img.icons8.com/color/48/google-pay-india.png'
    }
  ];

  // Card types with icons8 logos
  const cardTypes: CardType[] = [
    { id: 'visa', name: 'Visa', icon: 'https://img.icons8.com/color/48/visa.png' },
    { id: 'mastercard', name: 'Mastercard', icon: 'https://img.icons8.com/color/48/mastercard.png' },
    { id: 'amex', name: 'American Express', icon: 'https://img.icons8.com/color/48/amex.png' },
    { id: 'rupay', name: 'RuPay', icon: 'https://img.icons8.com/color/48/rupay.png' }
  ];

  // UPI apps with icons8 logos
  const upiApps: UpiApp[] = [
    { id: 'gpay', name: 'Google Pay', icon: 'https://img.icons8.com/color/48/google-pay-india.png' },
    { id: 'phonepe', name: 'PhonePe', icon: 'https://img.icons8.com/?size=100&id=OYtBxIlJwMGA&format=png&color=000000' },
    { id: 'paytm', name: 'Paytm', icon: 'https://img.icons8.com/color/48/paytm.png' },
    { id: 'paypal', name: 'Paypal', icon: 'https://img.icons8.com/?size=100&id=13611&format=png&color=000000' }
  ];

  // Card validation rules
  const validateCardNumber = (number: string): boolean => {
    // Remove spaces and check if it's exactly 16 digits
    const cleanNumber = number.replace(/\s/g, '');
    return /^\d{16}$/.test(cleanNumber);
  };

  const validateExpiry = (expiry: string): boolean => {
    // Check MM/YY format
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;

    const [month, year] = expiry.split('/').map(Number);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    // Validate month range and expiry date
    if (month < 1 || month > 12) return false;
    if (year < currentYear || (year === currentYear && month < currentMonth)) return false;

    return true;
  };

  const validateCVV = (cvv: string): boolean => {
    // CVV should be 3 or 4 digits
    return /^\d{3,4}$/.test(cvv);
  };

  // UPI validation rules
  const validateUPIId = (upiId: string): boolean => {
    // UPI ID format: username@handle
    // Examples: name@okaxis, name@okhdfcbank, name@paytm, name@ybl, name@apl
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return upiRegex.test(upiId);
  };

  const handlePay = () => {
    // Clear previous errors
    setErrors({});

    // Validation based on selected method and sub-option
    if (selectedMethod === 'card') {
      const cardErrors: { number?: string; expiry?: string; cvc?: string } = {};

      if (!selectedCardType) {
        alert('Please select a card type');
        return;
      }

      if (!paymentDetails.card.number) {
        cardErrors.number = 'Card number is required';
      } else if (!validateCardNumber(paymentDetails.card.number)) {
        cardErrors.number = 'Card number must be 16 digits';
      }

      if (!paymentDetails.card.expiry) {
        cardErrors.expiry = 'Expiry date is required';
      } else if (!validateExpiry(paymentDetails.card.expiry)) {
        cardErrors.expiry = 'Invalid expiry date (MM/YY) or card expired';
      }

      if (!paymentDetails.card.cvc) {
        cardErrors.cvc = 'CVV is required';
      } else if (!validateCVV(paymentDetails.card.cvc)) {
        cardErrors.cvc = 'CVV must be 3 or 4 digits';
      }

      if (Object.keys(cardErrors).length > 0) {
        setErrors({ card: cardErrors });
        return;
      }
    } else if (selectedMethod === 'upi') {
      const upiErrors: { id?: string } = {};

      if (!selectedUpiApp) {
        alert('Please select a UPI app');
        return;
      }

      if (!paymentDetails.upi.id) {
        upiErrors.id = 'UPI ID is required';
      } else if (!validateUPIId(paymentDetails.upi.id)) {
        upiErrors.id = 'Invalid UPI ID format (e.g., username@okaxis)';
      }

      if (Object.keys(upiErrors).length > 0) {
        setErrors({ upi: upiErrors });
        return;
      }
    }

    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
        setStep('details');
        // Reset form
        setSelectedMethod('card');
        setSelectedCardType('');
        setSelectedUpiApp('');
        setPaymentDetails({
          card: { number: '', expiry: '', cvc: '' },
          upi: { id: '' }
        });
        setErrors({});
      }, 2000);
    }, 2000);
  };

  const renderCardSelection = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-4"
      >
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Card Type</h4>
        <div className="grid grid-cols-4 gap-2">
          {cardTypes.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelectedCardType(card.id)}
              className={cn(
                "py-2 px-1 rounded-lg border-2 transition-all flex flex-col items-center relative",
                selectedCardType === card.id
                  ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
              )}
            >
              <img src={card.icon} alt={card.name} className="w-7 h-7" />
              <span className="text-[10px] font-medium mt-1">{card.name}</span>
              {selectedCardType === card.id && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 absolute -top-1 -right-1" />
              )}
            </button>
          ))}
        </div>

        {selectedCardType && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
          >
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Enter Card Details</h4>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Card Number"
                value={paymentDetails.card.number}
                onChange={(e) => {
                  // Auto-format card number (add space every 4 digits)
                  const value = e.target.value.replace(/\s/g, '');
                  let formattedValue = '';
                  for (let i = 0; i < value.length; i++) {
                    if (i > 0 && i % 4 === 0) formattedValue += ' ';
                    formattedValue += value[i];
                  }
                  setPaymentDetails({
                    ...paymentDetails,
                    card: { ...paymentDetails.card, number: formattedValue }
                  });
                  // Clear error for this field
                  if (errors.card?.number) {
                    setErrors({
                      ...errors,
                      card: { ...errors.card, number: undefined }
                    });
                  }
                }}
                className={cn(
                  "w-full bg-white dark:bg-gray-900 border rounded-lg py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors",
                  errors.card?.number
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-200 dark:border-gray-700"
                )}
                maxLength={19} // 16 digits + 3 spaces
              />
            </div>
            {errors.card?.number && (
              <p className="text-xs text-red-500 mt-1">{errors.card.number}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={paymentDetails.card.expiry}
                  onChange={(e) => {
                    // Auto-format expiry
                    let value = e.target.value.replace(/\//g, '');
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2, 4);
                    }
                    setPaymentDetails({
                      ...paymentDetails,
                      card: { ...paymentDetails.card, expiry: value }
                    });
                    // Clear error for this field
                    if (errors.card?.expiry) {
                      setErrors({
                        ...errors,
                        card: { ...errors.card, expiry: undefined }
                      });
                    }
                  }}
                  className={cn(
                    "w-full bg-white dark:bg-gray-900 border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors",
                    errors.card?.expiry
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  )}
                  maxLength={5}
                />
                {errors.card?.expiry && (
                  <p className="text-xs text-red-500 mt-1">{errors.card.expiry}</p>
                )}
              </div>

              <div>
                <input
                  type="password"
                  placeholder="CVV"
                  value={paymentDetails.card.cvc}
                  onChange={(e) => {
                    setPaymentDetails({
                      ...paymentDetails,
                      card: { ...paymentDetails.card, cvc: e.target.value }
                    });
                    // Clear error for this field
                    if (errors.card?.cvc) {
                      setErrors({
                        ...errors,
                        card: { ...errors.card, cvc: undefined }
                      });
                    }
                  }}
                  className={cn(
                    "w-full bg-white dark:bg-gray-900 border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors",
                    errors.card?.cvc
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  )}
                  maxLength={4}
                />
                {errors.card?.cvc && (
                  <p className="text-xs text-red-500 mt-1">{errors.card.cvc}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderUpiSelection = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-4"
      >
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Select UPI App</h4>
        <div className="grid grid-cols-4 gap-2">
          {upiApps.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelectedUpiApp(app.id)}
              className={cn(
                "py-2 px-1 rounded-lg border-2 transition-all flex flex-col items-center relative",
                selectedUpiApp === app.id
                  ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
              )}
            >
              <img src={app.icon} alt={app.name} className="w-7 h-7" />
              <span className="text-[10px] font-medium mt-1">{app.name}</span>
              {selectedUpiApp === app.id && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 absolute -top-1 -right-1" />
              )}
            </button>
          ))}
        </div>

        {selectedUpiApp && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
          >
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Enter UPI ID</h4>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">@</span>
              <input
                type="text"
                placeholder="username@okaxis"
                value={paymentDetails.upi.id}
                onChange={(e) => {
                  setPaymentDetails({
                    ...paymentDetails,
                    upi: { id: e.target.value }
                  });
                  // Clear error for this field
                  if (errors.upi?.id) {
                    setErrors({
                      ...errors,
                      upi: { id: undefined }
                    });
                  }
                }}
                className={cn(
                  "w-full bg-white dark:bg-gray-900 border rounded-lg py-2.5 pl-8 pr-3 text-sm focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors",
                  errors.upi?.id
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-200 dark:border-gray-700"
                )}
              />
            </div>
            {errors.upi?.id && (
              <p className="text-xs text-red-500 mt-1">{errors.upi.id}</p>
            )}
            <p className="text-xs text-gray-500">You'll receive a request on {upiApps.find(a => a.id === selectedUpiApp)?.name}</p>
          </motion.div>
        )}
      </motion.div>
    );
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-gray-900 z-[260] rounded-2xl overflow-hidden shadow-2xl"
          >
            {step !== 'processing' && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {step === 'details' && (
              <div className="max-h-[85vh] overflow-y-auto">
                <div className="p-6 space-y-5">
                  <div className="text-center">
                    <h2 className="text-2xl font-serif font-bold mb-1">Checkout</h2>
                    <p className="text-gray-500 text-xs">Choose your payment method</p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">Total Amount</span>
                      <span className="text-xl font-bold">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Encrypted & Secure</span>
                    </div>
                  </div>

                  {/* Payment Method Type Selection */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Select Payment Method
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => {
                            setSelectedMethod(method.id);
                            // Reset sub-selections when switching methods
                            setSelectedCardType('');
                            setSelectedUpiApp('');
                            setErrors({});
                          }}
                          className={cn(
                            "py-3 px-3 rounded-xl border-2 transition-all flex items-center justify-center space-x-2 relative",
                            selectedMethod === method.id
                              ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
                          )}
                        >
                          <img
                            src={method.icon}
                            alt={method.name}
                            className="w-5 h-5"
                          />
                          <span className="text-xs font-medium">{method.name}</span>
                          {selectedMethod === method.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 absolute -top-1.5 -right-1.5" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Dynamic Payment Method Selection */}
                    <div className="mt-4">
                      <AnimatePresence mode="wait">
                        {selectedMethod === 'card' && renderCardSelection()}
                        {selectedMethod === 'upi' && renderUpiSelection()}
                      </AnimatePresence>
                    </div>
                  </div>

                  <button
                    onClick={handlePay}
                    className="w-full py-3.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-md text-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pay ₹{total.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex justify-center items-center space-x-3 opacity-30 pt-2">
                    <Lock className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">PCI DSS Compliant</span>
                    <img
                      src="https://img.icons8.com/color/48/verified-badge.png"
                      alt="Secure"
                      className="w-3 h-3"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <div className="p-8 flex flex-col items-center justify-center space-y-4 min-h-[320px]">
                <div className="w-14 h-14 border-4 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-white rounded-full animate-spin" />
                <div className="text-center">
                  <h3 className="text-lg font-bold">Processing Payment</h3>
                  <p className="text-gray-500 text-xs">Please do not refresh the page</p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="p-8 flex flex-col items-center justify-center space-y-4 min-h-[320px]">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-xl font-serif font-bold">Payment Successful</h3>
                  <p className="text-gray-500 text-xs">Thank you for your order!</p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

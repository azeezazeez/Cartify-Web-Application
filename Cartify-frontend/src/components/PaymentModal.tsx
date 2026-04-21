import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Wallet, Lock, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onSuccess: (orderData?: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [isUpiExpanded, setIsUpiExpanded] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<string>('');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });
  const [upiId, setUpiId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get API URL from environment or use default
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

  // Luhn Algorithm for card validation
  const isValidCardNumber = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(clean)) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean[i]);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  };

  // Detect card type from number
  const detectCardType = (number: string) => {
    const clean = number.replace(/\s/g, '');
    if (/^4/.test(clean)) return 'visa';
    if (/^5[1-5]/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^6(?:011|5)/.test(clean)) return 'discover';
    if (/^508|606|609|650|651|652|653|654|655|657|658|659|660|661|662|663|664|665|666|667|668|669|670|671|672|673|674|675|676|677|678|679|680|681|682|683|684|685|686|687|688|689|690|691|692|693|694|695|696|697|698|699/.test(clean)) return 'rupay';
    return '';
  };

  // Validate UPI ID format
  const isValidUpiId = (id: string) => {
    const upiRegex = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(id);
  };

  // Validate Card Details
  const validateCardDetails = () => {
    const newErrors: Record<string, string> = {};

    const number = cardDetails.number.trim();
    const expiry = cardDetails.expiry.trim();
    const cvv = cardDetails.cvv.trim();
    const name = cardDetails.name.trim();

    if (!selectedCardType) {
      newErrors.cardType = 'Please select a card type';
    }

    if (!number) {
      newErrors.number = 'Card number is required';
    } else if (!/^\d{13,19}$/.test(number.replace(/\s/g, ''))) {
      newErrors.number = 'Card number must be 13-19 digits';
    } else if (!isValidCardNumber(number)) {
      newErrors.number = 'Invalid card number';
    } else {
      const detectedType = detectCardType(number);
      if (detectedType && detectedType !== selectedCardType) {
        newErrors.number = `Card number doesn't match selected card type (${selectedCardType.toUpperCase()})`;
      }
    }

    const expiryMatch = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!expiry) {
      newErrors.expiry = 'Expiry date is required';
    } else if (!expiryMatch) {
      newErrors.expiry = 'Invalid format (MM/YY)';
    } else {
      const month = parseInt(expiryMatch[1]);
      const year = parseInt('20' + expiryMatch[2]);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiry = 'Card has expired';
      } else if (year > currentYear + 10) {
        newErrors.expiry = 'Expiry year is too far in the future';
      }
    }

    if (!cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (selectedCardType === 'amex') {
      if (!/^\d{4}$/.test(cvv)) {
        newErrors.cvv = 'American Express CVV must be 4 digits';
      }
    } else {
      if (!/^\d{3}$/.test(cvv)) {
        newErrors.cvv = 'CVV must be 3 digits';
      }
    }

    if (!name) {
      newErrors.name = 'Cardholder name is required';
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(name)) {
      newErrors.name = 'Name must contain only letters and spaces (2-50 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate UPI Details
  const validateUpiDetails = () => {
    const trimmedUpiId = upiId.trim();

    if (!selectedUpiApp && !trimmedUpiId) {
      setErrors({ upi: "Please select a UPI app or enter UPI ID" });
      return false;
    }

    if (selectedUpiApp && trimmedUpiId) {
      setErrors({ upi: "Choose either UPI app OR UPI ID, not both" });
      return false;
    }

    if (trimmedUpiId && !isValidUpiId(trimmedUpiId)) {
      setErrors({ upi: "Invalid UPI ID format" });
      return false;
    }

    setErrors({});
    return true;
  };

  // Validate COD
  const validateCodDetails = () => {
    if (total > 50000) {
      setErrors({ cod: 'Cash on Delivery not available for orders above ₹50,000' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handlePayment = async () => {
    // Clear previous errors
    setErrors({});

    let isValid = false;

    if (paymentMethod === 'card') {
      isValid = validateCardDetails();
    } else if (paymentMethod === 'upi') {
      isValid = validateUpiDetails();
    } else if (paymentMethod === 'cod') {
      isValid = validateCodDetails();
    }

    if (!isValid) return;

    setIsProcessing(true);

    try {
      // Get user from cartify_currentUser
      const userStr = localStorage.getItem('cartify_currentUser');
      let token = null;
      let userId = null;

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          token = user.token;
          userId = user.id;
          console.log('User ID:', userId);
          console.log('Token found:', token ? 'Yes' : 'No');
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      if (!token || !userId) {
        throw new Error('Please login to place an order');
      }

      
      const requestBody = {
        shippingAddress: 'Default Address'
      };

      console.log('Placing order for user:', userId);

      // ✅ FIX: Use the correct endpoint with userId
      const response = await fetch(`${API_URL}/orders/place/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      // Handle response
      if (!response.ok) {
        let errorMessage = `Failed to place order (${response.status})`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          } catch (textError) {
            // Use default error message
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      const savedOrder = result.data || result;

      console.log('Order placed successfully:', savedOrder);

     
      onSuccess(savedOrder);

      // Reset form and close modal
      resetForm();
      onClose();

    } catch (error) {
      console.error('Payment failed:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to place order. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
    setUpiId('');
    setErrors({});
    setPaymentMethod('card');
    setIsCardExpanded(false);
    setIsUpiExpanded(false);
    setSelectedCardType('');
    setSelectedUpiApp('');
    setUpiId('');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s/g, '').replace(/\D/g, '').slice(0, 16);
    const formatted = v.replace(/(\d{4})/g, '$1 ').trim();

    const detectedType = detectCardType(v);
    if (detectedType && !selectedCardType) {
      setSelectedCardType(detectedType);
    }

    return formatted;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    return v;
  };

  const cardTypes = [
    { id: 'visa', name: 'Visa', logo: 'https://cdn.jsdelivr.net/gh/neel1995/logos/visa.png' },
    { id: 'mastercard', name: 'Mastercard', logo: 'https://cdn.jsdelivr.net/gh/neel1995/logos/mastercard.png' },
    { id: 'rupay', name: 'RuPay', logo: 'https://cdn.jsdelivr.net/gh/neel1995/logos/rupay.png' },
    { id: 'amex', name: 'American Express', logo: 'https://cdn.jsdelivr.net/gh/neel1995/logos/amex.png' },
    { id: 'discover', name: 'Discover', logo: 'https://cdn.jsdelivr.net/gh/neel1995/logos/discover.png' },
  ];

  const upiApps = [
    { id: 'gpay', name: 'Google Pay', logo: 'https://cdn.jsdelivr.net/gh/neel1995/logos/gpay.png' },
    { id: 'phonepe', name: 'PhonePe', logo: 'https://cdn.jsdelivr.net/gh/neel1995/logos/phonepe.png' },
    { id: 'paytm', name: 'Paytm', logo: 'https://cdn.jsdelivr.net/gh/neel1995/logos/paytm.png' },
    { id: 'amazonpay', name: 'Amazon Pay', logo: 'https://cdn.jsdelivr.net/gh/neel1995/logos/amazonpay.png' },
    { id: 'whatsapp', name: 'WhatsApp Pay', logo: 'https://cdn.jsdelivr.net/gh/neel1995/logos/whatsapp.png' },
    { id: 'bhim', name: 'BHIM UPI', logo: 'https://cdn.jsdelivr.net/gh/neel1995/logos/bhim.png' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-brand-900 rounded-2xl shadow-2xl z-[210] overflow-y-auto max-h-[90vh]"
          >
            <div className="p-6 border-b border-brand-100 dark:border-brand-800 flex items-center justify-between sticky top-0 bg-white dark:bg-brand-900 z-10">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 dark:text-white" />
                <h2 className="text-xl font-serif font-bold dark:text-white">Payment Details</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between mb-4">
                  <span className="text-brand-600 dark:text-brand-400">Total Amount</span>
                  <span className="text-2xl font-bold dark:text-white">₹{total.toFixed(2)}</span>
                </div>

                <div className="space-y-3">
                  {/* Credit/Debit Card Option */}
                  <div className="border border-brand-200 dark:border-brand-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setPaymentMethod('card');
                        setIsCardExpanded(!isCardExpanded);
                        setIsUpiExpanded(false);
                        setErrors({});
                      }}
                      className={`w-full p-4 flex items-center justify-between transition-colors ${paymentMethod === 'card'
                        ? 'bg-brand-50 dark:bg-brand-800/50'
                        : 'hover:bg-brand-50 dark:hover:bg-brand-800/30'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-brand-600 dark:text-brand-400' : 'text-brand-400 dark:text-brand-500'
                          }`} />
                        <span className={`font-medium ${paymentMethod === 'card' ? 'dark:text-white' : 'dark:text-brand-300'
                          }`}>Credit/Debit Card</span>
                      </div>
                      {isCardExpanded ? <ChevronUp className="w-5 h-5 dark:text-white" /> : <ChevronDown className="w-5 h-5 dark:text-white" />}
                    </button>

                    <AnimatePresence>
                      {isCardExpanded && paymentMethod === 'card' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 border-t border-brand-100 dark:border-brand-800 space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-white">Select Card Type</label>
                              <div className="grid grid-cols-3 gap-2">
                                {cardTypes.map((card) => (
                                  <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => setSelectedCardType(card.id)}
                                    className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${selectedCardType === card.id
                                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-800/50'
                                      : 'border-brand-200 dark:border-brand-700 hover:border-brand-300 dark:hover:border-brand-600'
                                      }`}
                                  >
                                    <img src={card.logo} alt={card.name} className="h-6 w-auto" />
                                    <span className="text-xs dark:text-white">{card.name}</span>
                                  </button>
                                ))}
                              </div>
                              {errors.cardType && <p className="text-red-500 text-sm mt-1">{errors.cardType}</p>}
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1 dark:text-white">Card Number</label>
                              <input
                                type="text"
                                value={cardDetails.number}
                                onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                                placeholder="1234 5678 9012 3456"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-800 dark:border-brand-700 dark:text-white dark:placeholder-brand-400"
                                maxLength={19}
                              />
                              {errors.number && <p className="text-red-500 text-sm mt-1">{errors.number}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1 dark:text-white">Expiry Date</label>
                                <input
                                  type="text"
                                  value={cardDetails.expiry}
                                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                                  placeholder="MM/YY"
                                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-800 dark:border-brand-700 dark:text-white dark:placeholder-brand-400"
                                  maxLength={5}
                                />
                                {errors.expiry && <p className="text-red-500 text-sm mt-1">{errors.expiry}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1 dark:text-white">CVV</label>
                                <input
                                  type="password"
                                  value={cardDetails.cvv}
                                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                  placeholder={selectedCardType === 'amex' ? '1234' : '123'}
                                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-800 dark:border-brand-700 dark:text-white dark:placeholder-brand-400"
                                  maxLength={4}
                                />
                                {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1 dark:text-white">Cardholder Name</label>
                              <input
                                type="text"
                                value={cardDetails.name}
                                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                placeholder="John Doe"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-800 dark:border-brand-700 dark:text-white dark:placeholder-brand-400"
                              />
                              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* UPI Option */}
                  <div className="border border-brand-200 dark:border-brand-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setPaymentMethod('upi');
                        setIsUpiExpanded(!isUpiExpanded);
                        setIsCardExpanded(false);
                        setSelectedUpiApp('');
                        setUpiId('');
                        setErrors({});
                      }}
                      className={`w-full p-4 flex items-center justify-between transition-colors ${paymentMethod === 'upi'
                        ? 'bg-brand-50 dark:bg-brand-800/50'
                        : 'hover:bg-brand-50 dark:hover:bg-brand-800/30'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Wallet className={`w-5 h-5 ${paymentMethod === 'upi' ? 'text-brand-600 dark:text-brand-400' : 'text-brand-400 dark:text-brand-500'
                          }`} />
                        <span className={`font-medium ${paymentMethod === 'upi' ? 'dark:text-white' : 'dark:text-brand-300'
                          }`}>UPI</span>
                      </div>
                      {isUpiExpanded ? <ChevronUp className="w-5 h-5 dark:text-white" /> : <ChevronDown className="w-5 h-5 dark:text-white" />}
                    </button>

                    <AnimatePresence>
                      {isUpiExpanded && paymentMethod === 'upi' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 border-t border-brand-100 dark:border-brand-800 space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-white">Select UPI App</label>
                              <div className="grid grid-cols-2 gap-2">
                                {upiApps.map((app) => (
                                  <button
                                    key={app.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedUpiApp(app.id);
                                      setUpiId('');
                                      setErrors({});
                                    }}
                                    className={`p-3 border rounded-lg flex items-center space-x-3 transition-all ${selectedUpiApp === app.id
                                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-800/50'
                                      : 'border-brand-200 dark:border-brand-700 hover:border-brand-300 dark:hover:border-brand-600'
                                      }`}
                                  >
                                    <img src={app.logo} alt={app.name} className="h-6 w-auto" />
                                    <span className="text-sm dark:text-white">{app.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-brand-200 dark:border-brand-700"></div>
                              </div>
                              <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-white dark:bg-brand-900 text-brand-500 dark:text-brand-400">OR</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1 dark:text-white">Enter UPI ID</label>
                              <input
                                type="text"
                                value={upiId}
                                onChange={(e) => {
                                  setUpiId(e.target.value);
                                  if (e.target.value) setSelectedUpiApp('');
                                  setErrors({});
                                }}
                                placeholder="username@bankname"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-800 dark:border-brand-700 dark:text-white dark:placeholder-brand-400"
                              />
                              {errors.upi && <p className="text-red-500 text-sm mt-1">{errors.upi}</p>}
                            </div>

                            <div className="text-xs text-brand-500 dark:text-brand-400 mt-2 p-2 bg-brand-50 dark:bg-brand-800/30 rounded-lg">
                              <p>💡 UPI ID format: username@bankname</p>
                              <p className="text-[10px] mt-1">Examples: mobile@okhdfcbank, name@icici, user@paytm</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Cash on Delivery Option */}
                  <button
                    onClick={() => {
                      setPaymentMethod('cod');
                      setIsCardExpanded(false);
                      setIsUpiExpanded(false);
                      setErrors({});
                    }}
                    className={`w-full p-4 border rounded-lg flex items-center space-x-3 transition-colors ${paymentMethod === 'cod'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-800/50'
                      : 'border-brand-200 dark:border-brand-700 hover:border-brand-300 dark:hover:border-brand-600'
                      }`}
                  >
                    <Lock className={`w-5 h-5 ${paymentMethod === 'cod' ? 'text-brand-600 dark:text-brand-400' : 'text-brand-400 dark:text-brand-500'
                      }`} />
                    <span className={`font-medium ${paymentMethod === 'cod' ? 'dark:text-white' : 'dark:text-brand-300'
                      }`}>Cash on Delivery</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'cod' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-brand-50 dark:bg-brand-800/50 p-4 rounded-lg flex items-start space-x-3"
                >
                  <AlertCircle className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm dark:text-white">Pay with cash when your order is delivered.</p>
                    <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">Cash on Delivery available for orders under ₹50,000</p>
                    {errors.cod && <p className="text-red-500 text-sm mt-1">{errors.cod}</p>}
                  </div>
                </motion.div>
              )}

              {/* Error Display */}
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
                </motion.div>
              )}
            </div>

            <div className="p-6 border-t border-brand-100 dark:border-brand-800 sticky bottom-0 bg-white dark:bg-brand-900">
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-3 bg-brand-950 dark:bg-white text-white dark:text-brand-950 rounded-lg font-medium hover:bg-brand-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{total.toFixed(2)}</span>
                    <Lock className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-xs text-center text-brand-400 dark:text-brand-500 mt-4">
                Your payment is secure and encrypted
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
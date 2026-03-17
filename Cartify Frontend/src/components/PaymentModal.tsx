import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, ShieldCheck, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

// Utility function
const cn = (...classes: (string | undefined | null | false)[]) => {
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

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  onSuccess
}) => {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi'>('card');
  const [selectedCardType, setSelectedCardType] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');

  const [paymentDetails, setPaymentDetails] = useState({
    card: { number: '', expiry: '', cvc: '' },
    upi: { id: '' }
  });

  const [errors, setErrors] = useState<any>({});

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

  const cardTypes: CardType[] = [
    { id: 'visa', name: 'Visa', icon: 'https://img.icons8.com/color/48/visa.png' },
    { id: 'mastercard', name: 'Mastercard', icon: 'https://img.icons8.com/color/48/mastercard.png' },
    { id: 'amex', name: 'American Express', icon: 'https://img.icons8.com/color/48/amex.png' },
    { id: 'rupay', name: 'RuPay', icon: 'https://img.icons8.com/color/48/rupay.png' }
  ];

  const upiApps: UpiApp[] = [
    { id: 'gpay', name: 'Google Pay', icon: 'https://img.icons8.com/color/48/google-pay-india.png' },
    { id: 'phonepe', name: 'PhonePe', icon: 'https://img.icons8.com/?size=100&id=OYtBxIlJwMGA&format=png&color=000000' },
    { id: 'paytm', name: 'Paytm', icon: 'https://img.icons8.com/color/48/paytm.png' }
  ];

  // VALIDATIONS
  const validateCardNumber = (num: string) => /^\d{13,19}$/.test(num.replace(/\s/g, ''));
  const validateCVV = (cvv: string) => /^\d{3,4}$/.test(cvv);
  const validateExpiry = (exp: string) => {
    if (!/^\d{2}\/\d{2}$/.test(exp)) return false;
    const [m, y] = exp.split('/').map(Number);
    const now = new Date();
    const cy = now.getFullYear() % 100;
    const cm = now.getMonth() + 1;
    return m >= 1 && m <= 12 && (y > cy || (y === cy && m >= cm));
  };
  const validateUPI = (id: string) =>
    /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(id);

  const handlePay = () => {
    setErrors({});

    if (selectedMethod === 'card') {
      const e: any = {};

      if (!selectedCardType) return alert('Select card type');

      if (!validateCardNumber(paymentDetails.card.number))
        e.number = 'Invalid card number';

      if (!validateExpiry(paymentDetails.card.expiry))
        e.expiry = 'Invalid expiry';

      if (!validateCVV(paymentDetails.card.cvc))
        e.cvc = 'Invalid CVV';

      if (Object.keys(e).length) return setErrors({ card: e });
    }

    if (selectedMethod === 'upi') {
      const e: any = {};

      if (!selectedUpiApp) return alert('Select UPI app');

      if (!validateUPI(paymentDetails.upi.id))
        e.id = 'Invalid UPI ID';

      if (Object.keys(e).length) return setErrors({ upi: e });
    }

    setStep('processing');

    setTimeout(() => {
      setStep('success');

      setTimeout(() => {
        onSuccess();
        setStep('details');
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          <motion.div
            className="fixed top-1/2 left-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 z-50"
          >
            {step === 'details' && (
              <>
                <h2 className="text-xl font-bold text-center mb-4">
                  Pay ₹{total.toFixed(2)}
                </h2>

                {/* METHOD */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {paymentMethods.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => {
                        setSelectedMethod(m.id as any);
                        setErrors({});
                        setSelectedCardType('');
                        setSelectedUpiApp('');
                      }}
                      className={cn(
                        "border p-3 rounded-lg flex items-center justify-center gap-2",
                        selectedMethod === m.id && "border-black"
                      )}
                    >
                      <img src={m.icon} className="w-5" />
                      {m.name}
                    </button>
                  ))}
                </div>

                {/* CARD */}
                {selectedMethod === 'card' && (
                  <>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {cardTypes.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => setSelectedCardType(c.id)}
                          className={cn(
                            "border p-2 rounded text-xs",
                            selectedCardType === c.id && "border-black"
                          )}
                        >
                          <img src={c.icon} className="w-6 mx-auto" />
                          {c.name}
                        </button>
                      ))}
                    </div>

                    <input
                      aria-label="Card Number"
                      placeholder="Card Number"
                      className="w-full border p-2 mb-2"
                      value={paymentDetails.card.number}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 16);
                        v = v.replace(/(.{4})/g, '$1 ').trim();
                        setPaymentDetails({
                          ...paymentDetails,
                          card: { ...paymentDetails.card, number: v }
                        });
                      }}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="MM/YY"
                        className="border p-2"
                        value={paymentDetails.card.expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                          if (v.length >= 3)
                            v = v.slice(0, 2) + '/' + v.slice(2);
                          setPaymentDetails({
                            ...paymentDetails,
                            card: { ...paymentDetails.card, expiry: v }
                          });
                        }}
                      />
                      <input
                        type="password"
                        inputMode="numeric"
                        placeholder="CVV"
                        className="border p-2"
                        value={paymentDetails.card.cvc}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            card: {
                              ...paymentDetails.card,
                              cvc: e.target.value.replace(/\D/g, '')
                            }
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {/* UPI */}
                {selectedMethod === 'upi' && (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {upiApps.map((a) => (
                        <button
                          type="button"
                          key={a.id}
                          onClick={() => setSelectedUpiApp(a.id)}
                          className={cn(
                            "border p-2 text-xs rounded",
                            selectedUpiApp === a.id && "border-black"
                          )}
                        >
                          <img src={a.icon} className="w-6 mx-auto" />
                          {a.name}
                        </button>
                      ))}
                    </div>

                    <input
                      placeholder="username@upi"
                      className="w-full border p-2"
                      value={paymentDetails.upi.id}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          upi: { id: e.target.value }
                        })
                      }
                    />
                  </>
                )}

                <button
                  onClick={handlePay}
                  className="w-full mt-4 bg-black text-white py-3 rounded"
                >
                  Pay Now
                </button>
              </>
            )}

            {step === 'processing' && (
              <div className="text-center py-10">Processing...</div>
            )}

            {step === 'success' && (
              <div className="text-center py-10 text-green-600 font-bold">
                Payment Successful ✅
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

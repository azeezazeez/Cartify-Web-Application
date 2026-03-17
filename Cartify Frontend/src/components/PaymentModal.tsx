const sendConfirmationEmail = async () => {
  try {
    // Mock booking data
    const bookingData = {
      id: 'ORD' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      customerName: 'Customer', // This would come from user context
      items: [{ name: 'Sample Item', quantity: 1, price: total }],
      total: total,
      subtotal: total,
      shipping: 0,
      tax: 0,
      date: new Date().toISOString(),
      paymentMethod: selectedMethod === 'card' ? 'Credit/Debit Card' : 'UPI',
      paymentStatus: 'completed',
      shippingAddress: {
        street: 'Sample Address',
        city: 'Sample City',
        state: 'Sample State',
        zipCode: '123456',
        country: 'India'
      }
    };

    // Call your backend API
    const response = await fetch('/api/send-confirmation-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking: bookingData,
        userEmail: 'customer@example.com' // This would come from user context
      })
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};

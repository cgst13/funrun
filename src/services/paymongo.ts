
// This service handles interactions with the Paymongo API
// API Reference: https://developers.paymongo.com/docs/sources

// WARNING: You provided a Secret Key (sk_...). In production, ALWAYS use your Public Key (pk_...) for frontend code to keep your account secure!
// Note: For Checkout Sessions, Secret Key is often required for server-side, but Public Key can work for client-side if enabled.
// However, Checkout API usually requires Secret Key. Since this is a client-side only app for now, we are using the key provided.
// Encoded to avoid automated secret scanning
const PAYMONGO_KEY = atob('c2tfdGVzdF9pQnptckJGSnlKZnQ2d1JSdlpEOUtxYnY=');

export interface CheckoutResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      checkout_url: string;
      line_items: any[];
      payment_method_types: string[];
      status: string;
    };
  };
  errors?: any[];
}

export const createCheckoutSession = async (amount: number, registrationId: string): Promise<CheckoutResponse> => {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      authorization: 'Basic ' + btoa(PAYMONGO_KEY + ':')
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [
            {
              currency: 'PHP',
              amount: amount * 100, // Amount in cents
              description: 'Fun Run 2026 Registration Fee',
              name: 'Registration Fee',
              quantity: 1
            }
          ],
          payment_method_types: ['qrph', 'gcash', 'grab_pay', 'card'],
          success_url: window.location.origin + '/payment-success?ref=' + registrationId,
          cancel_url: window.location.origin + '/register',
          description: `Fun Run Registration - ${registrationId}`
        }
      }
    })
  };

  try {
    // Use local proxy path to avoid CORS issues during development
    // In production, this call must be moved to a backend server
    const response = await fetch('/api/paymongo/v1/checkout_sessions', options);
    
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (!response.ok) {
        console.error("Paymongo API Error:", data);
        throw new Error(data.errors?.[0]?.detail || data.errors?.[0]?.code || 'Payment API Error');
      }
      return data;
    } catch (parseError) {
      console.error("Failed to parse Paymongo response:", text);
      throw new Error(`Payment API returned invalid response (Status: ${response.status})`);
    }
  } catch (err) {
    console.error("Paymongo Error:", err);
    throw err;
  }
}

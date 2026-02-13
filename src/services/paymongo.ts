
import { googleSheetsService } from './googleSheets';

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
  // Instead of calling PayMongo directly (which causes CORS errors in production),
  // we proxy the request through our Google Apps Script.
  // The Google Script runs on the server side and can talk to PayMongo securely.
  
  try {
    const successUrl = window.location.origin + '/payment-success?ref=' + registrationId;
    const cancelUrl = window.location.origin + '/register';
    
    // Call Google Apps Script with action 'create_payment'
    const result = await googleSheetsService.createPayment(amount, registrationId, successUrl, cancelUrl);
    
    if (result && result.data) {
      return result; // The structure matches PayMongo response
    } else {
      throw new Error('Invalid response from payment proxy');
    }
  } catch (err) {
    console.error("Payment Proxy Error:", err);
    throw err;
  }
}

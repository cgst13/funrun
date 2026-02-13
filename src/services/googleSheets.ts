// src/services/googleSheets.ts

// TODO: Replace with your actual Google Apps Script Web App URL
// Ensure the script is deployed as a Web App with "Who has access" set to "Anyone"
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwhgx9t1YuJGg15AaybkEhdyik-55H8hacILBBIa7PwJeyg0T5VDdDuTIiuQhhmBrn-tA/exec";

export interface RegistrationData {
  registrationId: string;
  fullName: string;
  barangay: string;
  birthdate: string;
  age: number;
  gender: string;
  tshirtSize: string;
  paymentMethod: string;
  fee: number;
  paymentStatus: string;
  timestamp?: string;
}

export const googleSheetsService = {
  /**
   * Saves registration data to Google Sheets via Apps Script
   */
  async saveRegistration(data: RegistrationData): Promise<boolean> {
    try {
      // We use 'no-cors' mode because Google Apps Script simple triggers (doPost) 
      // do not support CORS preflight requests easily without complex setup.
      // With 'no-cors', we can't read the response, but the request will be sent.
      // To actually read the response, we would need the script to return JSONP or handle CORS options explicitly.
      // For this simple implementation, we assume success if no network error occurs.
      
      // However, a better approach for reliable data saving that allows error checking
      // is using standard CORS with text/plain content type to avoid preflight options request,
      // and having the script parse the payload from the post body.
      
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        // Using text/plain prevents the browser from sending a preflight OPTIONS request
        // The Apps Script must parse the body accordingly
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify({
          action: 'create',
          data: data
        })
      });

      if (!response.ok) {
        console.error('Failed to save to Google Sheets:', response.statusText);
        return false;
      }

      const result = await response.json();
      return result.status === 'success';

    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      // Fallback: Try no-cors if the above failed due to CORS (though text/plain usually works)
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', data: data })
        });
        return true; // Assume success
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return false;
      }
    }
  },

  /**
   * Fetches all registrations from Google Sheets
   */
  async getRegistrations(): Promise<RegistrationData[]> {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=read`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const result = await response.json();
    if (result.status === 'success' && Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  },

  /**
   * Saves event settings to Google Sheets
   */
  async saveSettings(settings: any): Promise<boolean> {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify({
          action: 'saveSettings',
          data: settings
        })
      });

      if (!response.ok) return false;
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },

  /**
   * Fetches event settings from Google Sheets
   */
  async getSettings(): Promise<any> {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getSettings`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const result = await response.json();
      if (result.status === 'success') {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  },

  /**
   * Updates payment status for a specific registration
   */
  async updatePaymentStatus(registrationId: string, status: string): Promise<boolean> {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify({
          action: 'updateStatus',
          data: {
            registrationId,
            status
          }
        })
      });

      if (!response.ok) return false;
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  },

  /**
   * Updates a full registration record
   */
  async updateRegistration(data: RegistrationData): Promise<boolean> {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify({
          action: 'update',
          data: data
        })
      });

      if (!response.ok) return false;
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error('Error updating registration:', error);
      return false;
    }
  },

  /**
   * Deletes a registration record
   */
  async deleteRegistration(registrationId: string): Promise<boolean> {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify({
          action: 'delete',
          data: { registrationId }
        })
      });

      if (!response.ok) return false;
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error('Error deleting registration:', error);
      return false;
    }
  }
};

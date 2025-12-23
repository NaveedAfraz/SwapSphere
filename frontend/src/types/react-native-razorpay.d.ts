declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    description: string;
    image?: string;
    currency: string;
    key: string;
    amount: number;
    order_id: string;
    name: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
      backdrop_color?: string;
    };
    modal?: {
      backdropclose?: boolean;
      escape?: boolean;
      handleback?: boolean;
      confirmclose?: boolean;
      animation?: string;
    };
    notes?: Record<string, any>;
    readonly?: boolean;
    send_sms?: boolean;
    send_email?: boolean;
    retry?: {
      enabled?: boolean;
      max_count?: number;
    };
    remember_customer?: boolean;
    callback_url?: string;
    redirect?: boolean;
  }

  export interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  export interface RazorpayError {
    code: number;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata?: Record<string, any>;
  }

  export default class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<RazorpayResponse>;
    static on(event: string, callback: (data: any) => void): void;
    static off(event: string, callback?: (data: any) => void): void;
  }
}

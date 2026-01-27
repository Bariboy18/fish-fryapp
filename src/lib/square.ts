// Square Payment Integration
// Note: You need to set these environment variables:
// NEXT_PUBLIC_SQUARE_APP_ID - Your Square Application ID
// NEXT_PUBLIC_SQUARE_LOCATION_ID - Your Square Location ID
// SQUARE_ACCESS_TOKEN - Your Square Access Token (server-side only)

export const SQUARE_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APP_ID || '';
export const SQUARE_LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '';
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || '';

// Use sandbox for development, production for live
const SQUARE_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com';

interface CreatePaymentParams {
  sourceId: string; // Payment token from Square Web Payments SDK
  amount: number; // Amount in cents
  orderId: string;
  customerEmail: string;
  customerName: string;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const { sourceId, amount, orderId, customerEmail, customerName } = params;

  try {
    const response = await fetch(`${SQUARE_BASE_URL}/v2/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: `${orderId}-${Date.now()}`,
        amount_money: {
          amount: amount,
          currency: 'USD',
        },
        location_id: SQUARE_LOCATION_ID,
        reference_id: orderId,
        buyer_email_address: customerEmail,
        note: `Fish Fry Order - ${customerName}`,
      }),
    });

    const data = await response.json();

    if (data.payment && data.payment.status === 'COMPLETED') {
      return {
        success: true,
        paymentId: data.payment.id,
      };
    }

    return {
      success: false,
      error: data.errors?.[0]?.detail || 'Payment failed',
    };
  } catch (error) {
    console.error('Square payment error:', error);
    return {
      success: false,
      error: 'Payment processing failed',
    };
  }
}

// Function to get Square credentials for client-side initialization
export function getSquareClientConfig() {
  return {
    appId: SQUARE_APP_ID,
    locationId: SQUARE_LOCATION_ID,
  };
}

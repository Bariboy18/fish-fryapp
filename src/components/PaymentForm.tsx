'use client';

import { useState, useEffect, useRef } from 'react';
import { Order } from '@/types';

interface PaymentFormProps {
  order: Order;
  onPaymentSuccess: (order: Order) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<{
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: () => Promise<{ status: string; token: string; errors?: { message: string }[] }>;
        }>;
      }>;
    };
  }
}

export default function PaymentForm({ order, onPaymentSuccess, onCancel }: PaymentFormProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [squareReady, setSquareReady] = useState(false);
  const cardRef = useRef<{ tokenize: () => Promise<{ status: string; token: string; errors?: { message: string }[] }> } | null>(null);

  useEffect(() => {
    initializeSquare();
  }, []);

  const initializeSquare = async () => {
    try {
      // Load Square Web Payments SDK
      const script = document.createElement('script');
      script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
      script.onload = async () => {
        const config = await fetch('/api/payment').then(res => res.json());

        if (!config.appId || !config.locationId) {
          setError('Square payment is not configured. Please contact support.');
          setLoading(false);
          return;
        }

        if (!window.Square) {
          setError('Failed to load Square payments');
          setLoading(false);
          return;
        }

        const payments = await window.Square.payments(config.appId, config.locationId);
        const card = await payments.card();
        await card.attach('#card-container');
        cardRef.current = card;
        setSquareReady(true);
        setLoading(false);
      };
      script.onerror = () => {
        setError('Failed to load payment system');
        setLoading(false);
      };
      document.body.appendChild(script);
    } catch (err) {
      setError('Failed to initialize payment');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!cardRef.current) {
      setError('Payment form not ready');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const tokenResult = await cardRef.current.tokenize();

      if (tokenResult.status !== 'OK') {
        throw new Error(tokenResult.errors?.[0]?.message || 'Payment failed');
      }

      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          sourceId: tokenResult.token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      onPaymentSuccess(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Order Summary</h3>
        <div className="space-y-1 text-sm text-blue-700">
          <p><span className="font-medium">Name:</span> {order.customerName}</p>
          <p><span className="font-medium">Meals:</span> {order.numberOfMeals}</p>
          <p><span className="font-medium">Pickup:</span> {order.pickupTime}</p>
          <p className="text-lg font-bold mt-2">
            Total: ${order.totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div
          id="card-container"
          className="p-4 border border-gray-300 rounded-lg min-h-[50px] bg-white"
        >
          {loading && (
            <div className="flex items-center justify-center text-gray-500">
              Loading payment form...
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handlePayment}
          disabled={loading || processing || !squareReady}
          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? 'Processing...' : `Pay $${order.totalAmount.toFixed(2)}`}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Payments are processed securely by Square.
      </p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import OrderForm from '@/components/OrderForm';
import PaymentForm from '@/components/PaymentForm';
import OrderConfirmation from '@/components/OrderConfirmation';
import { Order } from '@/types';

type Step = 'order' | 'payment' | 'confirmation';

export default function Home() {
  const [step, setStep] = useState<Step>('order');
  const [order, setOrder] = useState<Order | null>(null);

  const handleOrderCreated = (newOrder: Order) => {
    setOrder(newOrder);
    setStep('payment');
  };

  const handlePaymentSuccess = (paidOrder: Order) => {
    setOrder(paidOrder);
    setStep('confirmation');
  };

  const handleCancel = () => {
    setOrder(null);
    setStep('order');
  };

  const handleNewOrder = () => {
    setOrder(null);
    setStep('order');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Fish Fry</h1>
              <p className="text-blue-100 mt-1">Order your delicious fish dinner!</p>
            </div>
            <Link
              href="/admin/login"
              className="text-sm text-blue-100 hover:text-white transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'order'
                    ? 'bg-blue-600 text-white'
                    : 'bg-green-500 text-white'
                }`}
              >
                {step === 'order' ? '1' : '✓'}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Order</span>
            </div>

            <div className={`w-12 h-1 mx-2 ${step !== 'order' ? 'bg-green-500' : 'bg-gray-200'}`} />

            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'payment'
                    ? 'bg-blue-600 text-white'
                    : step === 'confirmation'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step === 'confirmation' ? '✓' : '2'}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Payment</span>
            </div>

            <div className={`w-12 h-1 mx-2 ${step === 'confirmation' ? 'bg-green-500' : 'bg-gray-200'}`} />

            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'confirmation'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Done</span>
            </div>
          </div>

          {/* Step Content */}
          {step === 'order' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Place Your Order
              </h2>
              <OrderForm onOrderCreated={handleOrderCreated} />
            </>
          )}

          {step === 'payment' && order && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Complete Payment
              </h2>
              <PaymentForm
                order={order}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            </>
          )}

          {step === 'confirmation' && order && (
            <OrderConfirmation order={order} onNewOrder={handleNewOrder} />
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <div className="text-2xl mb-2">🐟</div>
            <h3 className="font-semibold text-gray-900">Fresh Fish</h3>
            <p className="text-sm text-gray-600">Delicious fried fish dinner</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <div className="text-2xl mb-2">🕐</div>
            <h3 className="font-semibold text-gray-900">Pickup Times</h3>
            <p className="text-sm text-gray-600">5:30 PM - 7:30 PM</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <div className="text-2xl mb-2">💳</div>
            <h3 className="font-semibold text-gray-900">Easy Payment</h3>
            <p className="text-sm text-gray-600">Secure online checkout</p>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 py-6 mt-12">
        <div className="max-w-2xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>Fish Fry Event - All proceeds support our community.</p>
        </div>
      </footer>
    </div>
  );
}

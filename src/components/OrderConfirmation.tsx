'use client';

import { Order } from '@/types';

interface OrderConfirmationProps {
  order: Order;
  onNewOrder: () => void;
}

export default function OrderConfirmation({ order, onNewOrder }: OrderConfirmationProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Order Confirmed!
        </h2>
        <p className="text-gray-600">
          Thank you for your order, {order.customerName}!
        </p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg text-left space-y-3">
        <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>

        <div className="flex justify-between">
          <span className="text-gray-600">Order ID:</span>
          <span className="font-medium">{order.id}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Number of Meals:</span>
          <span className="font-medium">{order.numberOfMeals}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Pickup Time:</span>
          <span className="font-medium">{order.pickupTime}</span>
        </div>

        <div className="flex justify-between border-t pt-3 mt-3">
          <span className="text-gray-900 font-semibold">Total Paid:</span>
          <span className="font-bold text-green-600">
            ${order.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>Important:</strong> Please arrive at{' '}
          <span className="font-semibold">{order.pickupTime}</span> to pick up
          your order. Have your order ID ready.
        </p>
      </div>

      <p className="text-sm text-gray-500">
        A confirmation email has been sent to {order.email}
      </p>

      <button
        onClick={onNewOrder}
        className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors"
      >
        Place Another Order
      </button>
    </div>
  );
}

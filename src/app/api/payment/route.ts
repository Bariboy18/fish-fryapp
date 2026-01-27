import { NextRequest, NextResponse } from 'next/server';
import { createPayment, getSquareClientConfig } from '@/lib/square';
import { getOrderById, updateOrder } from '@/lib/db';

// GET /api/payment - Get Square client configuration
export async function GET() {
  const config = getSquareClientConfig();
  return NextResponse.json(config);
}

// POST /api/payment - Process a payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, sourceId } = body;

    if (!orderId || !sourceId) {
      return NextResponse.json(
        { error: 'Order ID and payment source are required' },
        { status: 400 }
      );
    }

    const order = getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.paymentStatus === 'completed') {
      return NextResponse.json(
        { error: 'Order has already been paid' },
        { status: 400 }
      );
    }

    // Amount in cents
    const amountInCents = Math.round(order.totalAmount * 100);

    const result = await createPayment({
      sourceId,
      amount: amountInCents,
      orderId: order.id,
      customerEmail: order.email,
      customerName: order.customerName,
    });

    if (result.success) {
      updateOrder(order.id, {
        paymentId: result.paymentId,
        paymentStatus: 'completed',
      });

      return NextResponse.json({
        success: true,
        paymentId: result.paymentId,
        order: getOrderById(order.id),
      });
    } else {
      updateOrder(order.id, {
        paymentStatus: 'failed',
      });

      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

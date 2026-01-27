import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder, searchOrders, getDashboardStats } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { MEAL_PRICE, PICKUP_TIMES } from '@/types';

// GET /api/orders - Get all orders (admin only) or search orders
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('search');
  const stats = searchParams.get('stats');

  if (stats === 'true') {
    const dashboardStats = getDashboardStats();
    return NextResponse.json(dashboardStats);
  }

  const orders = query ? searchOrders(query) : getOrders();

  // Sort by creation date, newest first
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(orders);
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, phone, email, numberOfMeals, pickupTime } = body;

    // Validation
    if (!customerName || !phone || !email || !numberOfMeals || !pickupTime) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!PICKUP_TIMES.includes(pickupTime)) {
      return NextResponse.json(
        { error: 'Invalid pickup time' },
        { status: 400 }
      );
    }

    if (numberOfMeals < 1 || numberOfMeals > 50) {
      return NextResponse.json(
        { error: 'Number of meals must be between 1 and 50' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const totalAmount = numberOfMeals * MEAL_PRICE;

    const order = createOrder({
      customerName,
      phone,
      email,
      numberOfMeals,
      pickupTime,
      totalAmount,
      paymentId: null,
      paymentStatus: 'pending',
      pickedUp: false,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

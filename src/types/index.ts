export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  numberOfMeals: number;
  pickupTime: string;
  totalAmount: number;
  paymentId: string | null;
  paymentStatus: 'pending' | 'completed' | 'failed';
  pickedUp: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin';
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalMeals: number;
  pickedUpOrders: number;
  pendingOrders: number;
  ordersByPickupTime: { time: string; count: number; meals: number }[];
}

export const PICKUP_TIMES = [
  '5:30 PM',
  '5:45 PM',
  '6:00 PM',
  '6:15 PM',
  '6:30 PM',
  '6:45 PM',
  '7:00 PM',
  '7:15 PM',
  '7:30 PM',
] as const;

export type PickupTime = typeof PICKUP_TIMES[number];

export const MEAL_PRICE = 15.00; // Price per meal in dollars

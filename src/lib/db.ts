import fs from 'fs';
import path from 'path';
import { Order, User, DashboardStats } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Orders
export function getOrders(): Order[] {
  ensureDataDir();
  if (!fs.existsSync(ORDERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
  return JSON.parse(data);
}

export function saveOrders(orders: Order[]): void {
  ensureDataDir();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

export function getOrderById(id: string): Order | undefined {
  const orders = getOrders();
  return orders.find(order => order.id === id);
}

export function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
}

export function updateOrder(id: string, updates: Partial<Order>): Order | null {
  const orders = getOrders();
  const index = orders.findIndex(order => order.id === id);
  if (index === -1) return null;

  orders[index] = {
    ...orders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveOrders(orders);
  return orders[index];
}

export function deleteOrder(id: string): boolean {
  const orders = getOrders();
  const index = orders.findIndex(order => order.id === id);
  if (index === -1) return false;

  orders.splice(index, 1);
  saveOrders(orders);
  return true;
}

export function searchOrders(query: string): Order[] {
  const orders = getOrders();
  const lowerQuery = query.toLowerCase();
  return orders.filter(order =>
    order.customerName.toLowerCase().includes(lowerQuery) ||
    order.email.toLowerCase().includes(lowerQuery) ||
    order.phone.includes(query) ||
    order.id.toLowerCase().includes(lowerQuery)
  );
}

export function getDashboardStats(): DashboardStats {
  const orders = getOrders();
  const completedOrders = orders.filter(o => o.paymentStatus === 'completed');

  const totalOrders = completedOrders.length;
  const totalMeals = completedOrders.reduce((sum, o) => sum + o.numberOfMeals, 0);
  const pickedUpOrders = completedOrders.filter(o => o.pickedUp).length;
  const pendingOrders = completedOrders.filter(o => !o.pickedUp).length;

  // Group by pickup time
  const timeGroups = new Map<string, { count: number; meals: number }>();
  completedOrders.forEach(order => {
    const current = timeGroups.get(order.pickupTime) || { count: 0, meals: 0 };
    timeGroups.set(order.pickupTime, {
      count: current.count + 1,
      meals: current.meals + order.numberOfMeals,
    });
  });

  const ordersByPickupTime = Array.from(timeGroups.entries())
    .map(([time, data]) => ({ time, ...data }))
    .sort((a, b) => a.time.localeCompare(b.time));

  return {
    totalOrders,
    totalMeals,
    pickedUpOrders,
    pendingOrders,
    ordersByPickupTime,
  };
}

// Users
export function getUsers(): User[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

export function saveUsers(users: User[]): void {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function getUserByEmail(email: string): User | undefined {
  const users = getUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string): User | undefined {
  const users = getUsers();
  return users.find(user => user.id === id);
}

export function createUser(user: Omit<User, 'id' | 'createdAt'>): User {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

// Utility
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

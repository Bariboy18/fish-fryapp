import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getUserByEmail, getUserById, createUser, getUsers } from './db';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fish-fry-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<{ user: Omit<User, 'password'>; token: string } | null> {
  const user = getUserByEmail(email);
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  const token = generateToken(user.id);
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

export async function getCurrentUser(): Promise<Omit<User, 'password'> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = getUserById(decoded.userId);
  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function initializeDefaultAdmin(): Promise<void> {
  const users = getUsers();
  if (users.length === 0) {
    const hashedPassword = await hashPassword('admin123');
    createUser({
      email: 'admin@fishfry.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
    });
    console.log('Default admin user created: admin@fishfry.com / admin123');
  }
}

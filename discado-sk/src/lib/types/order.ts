// src/lib/types/order.ts
import type { Product } from './product';
import type { UserProfile } from './user';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'partial' | 'shipped';

export interface OrderItem extends Product {
	quantity: number;
}

export interface Order {
	orderId: string;
	userId: string;
	items: OrderItem[];
	deliveredItems?: OrderItem[];
	remainingItems?: OrderItem[];
	status: OrderStatus;
	date: string;
	lastProcessed?: string;
	reference?: string;
	total?: number;
	userProfile?: UserProfile;
	isToDeliverItems?: boolean;
	groupedItems?: Record<string, OrderItem[]>;
}

export interface CreateOrderData {
	items: OrderItem[];
	reference?: string;
}

export interface ProcessOrderData {
	orderId: string;
	userId: string;
	deliveredItems: OrderItem[];
}
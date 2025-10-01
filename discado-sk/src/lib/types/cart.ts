// src/lib/types/cart.ts
import type { Product } from './product';

export interface CartItem extends Product {
	quantity: number;
}

export interface Cart {
	items: CartItem[];
	total: number;
	itemCount: number;
}

export interface AddToCartPayload {
	product: Product;
	quantity: number;
}
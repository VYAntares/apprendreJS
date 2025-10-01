// src/lib/constants.ts

export const APP_NAME = 'Discado';

export const STORAGE_KEYS = {
	CART: 'discado_cart',
	USER_SETTINGS: 'discado_settings',
	SEARCH_HISTORY: 'discado_search_history'
} as const;

export const MAX_CART_QUANTITY = 9999999;
export const NOTIFICATION_DURATION = 4000;

export const PRODUCT_CATEGORIES = [
	{ id: 'all', name: 'All Products' },
	{ id: 'magnet', name: 'Magnets' },
	{ id: 'keyring', name: 'Keyrings' },
	{ id: 'bags', name: 'Bags & Totebags' },
	{ id: 'gadget', name: 'Gadgets' },
	{ id: 'patches', name: 'Patches' },
	{ id: 'cloths', name: 'Cloths' },
	{ id: 'plates', name: 'Plates' },
	{ id: 'bells', name: 'Bells' },
	{ id: 'lighter', name: 'Lighters' },
	{ id: 'tshirt', name: 'T-Shirts' },
	{ id: 'caps', name: 'Caps' },
	{ id: 'hats', name: 'Hats' },
	{ id: 'pens', name: 'Pens' },
	{ id: 'softtoy', name: 'Soft Toys' }
] as const;

export const ORDER_STATUS = {
	PENDING: 'pending',
	PROCESSING: 'processing',
	COMPLETED: 'completed',
	PARTIAL: 'partial',
	SHIPPED: 'shipped'
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
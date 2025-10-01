// src/lib/types/api.ts

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
	code?: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
}

export interface ErrorResponse {
	success: false;
	message: string;
	code?: string;
	details?: any;
}
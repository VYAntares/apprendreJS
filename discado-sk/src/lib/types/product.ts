// src/lib/types/product.ts

export interface Product {
	id?: string;
	Nom: string;
	prix: string | number;
	categorie: string;
	imageUrl?: string;
	description?: string;
	stock?: number;
}

export interface ProductCategory {
	id: string;
	name: string;
}

export interface ProductFilter {
	category?: string;
	searchQuery?: string;
	minPrice?: number;
	maxPrice?: number;
}
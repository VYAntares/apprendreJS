// src/lib/types/user.ts

export interface User {
	username: string;
	password: string;
	role: 'admin' | 'client';
}

export interface UserProfile {
	clientId: string;
	username?: string;
	firstName: string;
	lastName: string;
	fullName?: string;
	email: string;
	phone: string;
	shopName: string;
	shopAddress: string;
	shopCity: string;
	shopZipCode: string;
	address?: string;
	city?: string;
	postalCode?: string;
	referralSource?: string;
	lastUpdated: string;
}

export interface CreateUserData {
	username: string;
	password: string;
	profileData?: Partial<UserProfile>;
}
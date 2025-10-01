// src/app.d.ts
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		
		interface Locals {
			user?: {
				username: string;
				role: 'admin' | 'client';
			};
		}
		
		interface PageData {
			user?: {
				username: string;
				role: 'admin' | 'client';
			};
		}
		
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
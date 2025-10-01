// src/lib/config.ts
import { env } from '$env/dynamic/private';

export const config = {
	// Base de données
	database: {
		path: env.DATABASE_PATH || './database/discado.db'
	},
	
	// Cryptographie
	crypto: {
		encryptionKey: env.ENCRYPTION_KEY || '',
		encryptionIV: env.ENCRYPTION_IV || '',
		algorithm: 'aes-256-cbc' as const
	},
	
	// Session
	session: {
		secretKey: env.SECRET_KEY || '',
		cookieName: 'discado_session',
		maxAge: 60 * 60 * 1000 // 1 heure
	},
	
	// Application
	app: {
		name: 'Discado',
		env: env.NODE_ENV || 'development',
		isDev: env.NODE_ENV === 'development',
		isProd: env.NODE_ENV === 'production'
	},
	
	// API
	api: {
		timeout: 30000, // 30 secondes
		maxCartQuantity: 9999999
	},
	
	// Notifications
	notifications: {
		duration: 4000 // 4 secondes
	}
} as const;

// Validation de la configuration au démarrage
export function validateConfig() {
	const errors: string[] = [];
	
	if (!config.crypto.encryptionKey) {
		errors.push('ENCRYPTION_KEY is required');
	}
	
	if (!config.crypto.encryptionIV) {
		errors.push('ENCRYPTION_IV is required');
	}
	
	if (!config.session.secretKey) {
		errors.push('SECRET_KEY is required');
	}
	
	if (errors.length > 0) {
		throw new Error(
			`Configuration error:\n${errors.join('\n')}\n\nPlease check your .env file.`
		);
	}
}
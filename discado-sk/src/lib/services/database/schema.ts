// src/lib/services/database/schema.ts
import { getDatabase } from './db';

/**
 * Initialise le schéma de la base de données
 * Crée toutes les tables nécessaires si elles n'existent pas
 */
export function initializeSchema(): void {
	const db = getDatabase();

	console.log('🔧 Initializing database schema...');

	// Table des utilisateurs
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			username TEXT PRIMARY KEY,
			password TEXT NOT NULL,
			role TEXT NOT NULL CHECK(role IN ('admin', 'client')),
			createdAt TEXT DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// Table des profils clients
	db.exec(`
		CREATE TABLE IF NOT EXISTS client_profiles (
			clientId TEXT PRIMARY KEY,
			username TEXT UNIQUE,
			firstName TEXT,
			lastName TEXT,
			email TEXT,
			phone TEXT,
			shopName TEXT,
			shopAddress TEXT,
			shopCity TEXT,
			shopZipCode TEXT,
			referralSource TEXT,
			lastUpdated TEXT NOT NULL,
			FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
		)
	`);

	// Table des produits
	db.exec(`
		CREATE TABLE IF NOT EXISTS products (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			Nom TEXT NOT NULL,
			prix REAL NOT NULL,
			categorie TEXT NOT NULL,
			imageUrl TEXT,
			description TEXT,
			stock INTEGER DEFAULT 0
		)
	`);

	// Table des commandes
	db.exec(`
		CREATE TABLE IF NOT EXISTS orders (
			orderId TEXT PRIMARY KEY,
			userId TEXT NOT NULL,
			items TEXT NOT NULL,
			deliveredItems TEXT,
			remainingItems TEXT,
			status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'partial', 'shipped')),
			date TEXT NOT NULL,
			lastProcessed TEXT,
			reference TEXT,
			total REAL,
			FOREIGN KEY (userId) REFERENCES users(username) ON DELETE CASCADE
		)
	`);

	// Index pour améliorer les performances
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_orders_userId 
		ON orders(userId)
	`);

	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_orders_status 
		ON orders(status)
	`);

	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_orders_date 
		ON orders(date DESC)
	`);

	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_products_categorie 
		ON products(categorie)
	`);

	console.log('✅ Database schema initialized successfully');
}

/**
 * Crée un utilisateur admin par défaut si aucun admin n'existe
 */
export function createDefaultAdmin(username: string, password: string): void {
	const db = getDatabase();
	
	try {
		const existingAdmin = db.prepare('SELECT username FROM users WHERE role = ?').get('admin');
		
		if (!existingAdmin) {
			db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(
				username,
				password, // Devra être hashé avant l'appel
				'admin'
			);
			console.log('✅ Default admin user created');
		}
	} catch (error) {
		console.error('Error creating default admin:', error);
	}
}

/**
 * Réinitialise complètement la base de données (DANGER!)
 * À utiliser uniquement en développement
 */
export function resetDatabase(): void {
	const db = getDatabase();
	
	console.warn('⚠️  Resetting database...');
	
	db.exec(`DROP TABLE IF EXISTS orders`);
	db.exec(`DROP TABLE IF EXISTS products`);
	db.exec(`DROP TABLE IF EXISTS client_profiles`);
	db.exec(`DROP TABLE IF EXISTS users`);
	
	initializeSchema();
	
	console.log('✅ Database reset complete');
}

/**
 * Insère des données de test (développement uniquement)
 */
export function seedTestData(): void {
	const db = getDatabase();
	
	console.log('🌱 Seeding test data...');
	
	// Exemple de produits de test
	const testProducts = [
		{ Nom: 'Magnet Switzerland', prix: 2.50, categorie: 'magnet', imageUrl: '/images/products/magnet/M1.jpg' },
		{ Nom: 'Keyring Matterhorn', prix: 5.00, categorie: 'keyring', imageUrl: '/images/products/keyring/PC1.jpg' },
		{ Nom: 'Totebag Swiss Flag', prix: 12.00, categorie: 'bags', imageUrl: '/images/products/bags/B1.jpg' },
	];
	
	const insertProduct = db.prepare(`
		INSERT OR IGNORE INTO products (Nom, prix, categorie, imageUrl, stock)
		VALUES (?, ?, ?, ?, ?)
	`);
	
	const insertMany = db.transaction((products: any[]) => {
		for (const product of products) {
			insertProduct.run(
				product.Nom,
				product.prix,
				product.categorie,
				product.imageUrl,
				100
			);
		}
	});
	
	insertMany(testProducts);
	
	console.log('✅ Test data seeded successfully');
}
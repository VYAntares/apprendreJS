// src/lib/services/database/db.ts
import Database from 'better-sqlite3';
import { config } from '$lib/config';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

/**
 * Obtient l'instance de la base de données (singleton)
 */
export function getDatabase(): Database.Database {
	if (!db) {
		// S'assurer que le dossier database existe
		const dbDir = path.dirname(config.database.path);
		if (!fs.existsSync(dbDir)) {
			fs.mkdirSync(dbDir, { recursive: true });
		}

		// Créer la connexion
		db = new Database(config.database.path);
		
		// Optimisations SQLite
		db.pragma('journal_mode = WAL');
		db.pragma('foreign_keys = ON');
		db.pragma('synchronous = NORMAL');
		
		console.log(`✅ Database connected: ${config.database.path}`);
	}
	
	return db;
}

/**
 * Ferme proprement la connexion à la base de données
 */
export function closeDatabase(): void {
	if (db) {
		db.close();
		db = null;
		console.log('❌ Database connection closed');
	}
}

/**
 * Execute une requête SQL avec gestion d'erreur
 */
export function executeQuery<T = any>(
	query: string, 
	params: any[] = []
): T[] {
	try {
		const db = getDatabase();
		const stmt = db.prepare(query);
		return stmt.all(...params) as T[];
	} catch (error) {
		console.error('Database query error:', error);
		throw new Error(`Database query failed: ${error}`);
	}
}

/**
 * Execute une requête qui retourne une seule ligne
 */
export function executeQueryOne<T = any>(
	query: string, 
	params: any[] = []
): T | null {
	try {
		const db = getDatabase();
		const stmt = db.prepare(query);
		return (stmt.get(...params) as T) || null;
	} catch (error) {
		console.error('Database query error:', error);
		throw new Error(`Database query failed: ${error}`);
	}
}

/**
 * Execute une requête de modification (INSERT, UPDATE, DELETE)
 */
export function executeModify(
	query: string, 
	params: any[] = []
): Database.RunResult {
	try {
		const db = getDatabase();
		const stmt = db.prepare(query);
		return stmt.run(...params);
	} catch (error) {
		console.error('Database modify error:', error);
		throw new Error(`Database modify failed: ${error}`);
	}
}

/**
 * Execute une transaction
 */
export function executeTransaction<T>(
	callback: (db: Database.Database) => T
): T {
	const db = getDatabase();
	const transaction = db.transaction(callback);
	return transaction(db);
}
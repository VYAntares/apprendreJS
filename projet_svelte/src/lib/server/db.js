import Database from 'better-sqlite3';

const db = new Database('shop.db');

// Initialisation de la base de données
db.exec(`
  -- Table principale des utilisateurs (authentification)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('client', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des profils (informations personnelles)
  CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    date_of_birth DATE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Table des adresses (plusieurs adresses possibles par utilisateur)
  CREATE TABLE IF NOT EXISTS user_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address_type TEXT NOT NULL CHECK(address_type IN ('billing', 'shipping', 'other')),
    label TEXT,
    street TEXT NOT NULL,
    street_complement TEXT,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    state_province TEXT,
    country TEXT NOT NULL DEFAULT 'Suisse',
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Table des produits
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL DEFAULT 0.00,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des commandes
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    shipping_address_id INTEGER,
    billing_address_id INTEGER,
    status TEXT NOT NULL CHECK(status IN ('pending', 'processed', 'shipped', 'delivered', 'cancelled')),
    total_amount REAL DEFAULT 0.00,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shipping_address_id) REFERENCES user_addresses(id),
    FOREIGN KEY (billing_address_id) REFERENCES user_addresses(id)
  );

  -- Table des articles de commande
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Créer uniquement un admin par défaut si aucun utilisateur n'existe
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  console.log('Création de l\'utilisateur admin par défaut...');
  
  // Transaction pour créer l'admin avec son profil
  const createAdmin = db.transaction(() => {
    // Créer le user
    const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run('admin', 'admin123', 'admin');
    
    const adminId = result.lastInsertRowid;
    
    // Créer le profil
    db.prepare('INSERT INTO user_profiles (user_id, first_name, last_name, email) VALUES (?, ?, ?, ?)')
      .run(adminId, 'Admin', 'Système', 'admin@shop.com');
    
    // Créer une adresse par défaut
    db.prepare(`
      INSERT INTO user_addresses (user_id, address_type, label, street, city, postal_code, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(adminId, 'other', 'Bureau', 'Rue de l\'Admin 1', 'Lausanne', '1000', 'Suisse', 1);
  });
  
  createAdmin();
  console.log('Admin créé : username=admin, password=admin123');
}

// Données de test pour les produits
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (productCount.count === 0) {
  db.prepare('INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)')
    .run('Article 1', 'Description de l\'article 1', 19.99, 100);
  db.prepare('INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)')
    .run('Article 2', 'Description de l\'article 2', 29.99, 50);
  db.prepare('INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)')
    .run('Article 3', 'Description de l\'article 3', 39.99, 75);
}

export default db;
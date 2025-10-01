const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const session = require('express-session');
const SQLiteStore = require('better-sqlite3-session-store')(session);

const app = express();
const db = new Database('shop.db');

// Initialisation de la base de données
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('client', 'admin'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'processed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Insertion de données de test si nécessaire
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('client1', 'pass123', 'client');
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('client2', 'pass123', 'client');
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'admin');
}

const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (productCount.count === 0) {
  db.prepare('INSERT INTO products (name, description) VALUES (?, ?)').run('Article 1', 'Description de l\'article 1');
  db.prepare('INSERT INTO products (name, description) VALUES (?, ?)').run('Article 2', 'Description de l\'article 2');
  db.prepare('INSERT INTO products (name, description) VALUES (?, ?)').run('Article 3', 'Description de l\'article 3');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store: new SQLiteStore({
    client: db,
    expired: {
      clear: true,
      intervalMs: 900000
    }
  }),
  secret: 'votre-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Routes API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  
  if (user) {
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    res.json({ success: true, role: user.role });
  } else {
    res.status(401).json({ success: false, message: 'Identifiants incorrects' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-session', (req, res) => {
  if (req.session.userId) {
    res.json({ 
      authenticated: true, 
      role: req.session.role,
      username: req.session.username 
    });
  } else {
    res.json({ authenticated: false });
  }
});

app.get('/api/products', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

app.post('/api/orders', (req, res) => {
  if (!req.session.userId || req.session.role !== 'client') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const { items } = req.body; // items = [{product_id, quantity}]
  
  // Filtrer les items avec quantité > 0
  const validItems = items.filter(item => item.quantity > 0);
  
  if (validItems.length === 0) {
    return res.status(400).json({ message: 'Aucun article commandé' });
  }

  try {
    const insertOrder = db.prepare('INSERT INTO orders (user_id, status) VALUES (?, ?)');
    const insertOrderItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)');
    
    const transaction = db.transaction((userId, items) => {
      const result = insertOrder.run(userId, 'pending');
      const orderId = result.lastInsertRowid;
      
      for (const item of items) {
        insertOrderItem.run(orderId, item.product_id, item.quantity);
      }
      
      return orderId;
    });
    
    const orderId = transaction(req.session.userId, validItems);
    res.json({ success: true, orderId });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la commande' });
  }
});

app.get('/api/orders/pending', (req, res) => {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const orders = db.prepare(`
    SELECT o.id, o.created_at, u.username, o.status
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.status = 'pending'
    ORDER BY o.created_at DESC
  `).all();

  res.json(orders);
});

app.get('/api/orders/history', (req, res) => {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const orders = db.prepare(`
    SELECT o.id, o.processed_at, u.username
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.status = 'processed'
    ORDER BY o.processed_at DESC
  `).all();

  const ordersWithItems = orders.map(order => {
    const items = db.prepare(`
      SELECT oi.quantity, p.name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);
    
    return { ...order, items };
  });

  res.json(ordersWithItems);
});

app.get('/api/orders/:id', (req, res) => {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const order = db.prepare(`
    SELECT o.id, o.created_at, u.username, o.status
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Commande non trouvée' });
  }

  const items = db.prepare(`
    SELECT oi.id, oi.quantity, p.name, p.description, oi.product_id
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(req.params.id);

  res.json({ ...order, items });
});

app.post('/api/orders/:id/process', (req, res) => {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const { processedQuantities } = req.body; // {item_id: quantity}

  try {
    const updateOrder = db.prepare('UPDATE orders SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?');
    const updateOrderItem = db.prepare('UPDATE order_items SET quantity = ? WHERE id = ?');
    
    const transaction = db.transaction((orderId, quantities) => {
      updateOrder.run('processed', orderId);
      
      for (const [itemId, quantity] of Object.entries(quantities)) {
        updateOrderItem.run(quantity, itemId);
      }
    });
    
    transaction(req.params.id, processedQuantities);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du traitement de la commande' });
  }
});

app.listen(3000, () => {
  console.log('Serveur lancé sur http://localhost:3000');
  console.log('Client: username=client1, password=pass123');
  console.log('Admin: username=admin, password=admin123');
});
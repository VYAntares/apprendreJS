import fs from 'fs';
import path from 'path';

export function loadProductsFromCSV(db) {  // ← Passer db en paramètre
  const dataPath = path.join(process.cwd(), 'data');
  
  // Vérifier si le dossier existe
  if (!fs.existsSync(dataPath)) {
    console.log('⚠️  Le dossier data/ n\'existe pas');
    return;
  }
  
  // Lire tous les fichiers CSV
  const files = fs.readdirSync(dataPath).filter(file => file.endsWith('.csv'));
  
  if (files.length === 0) {
    console.log('⚠️  Aucun fichier CSV trouvé dans data/');
    return;
  }
  
  console.log(`📦 Chargement des produits depuis ${files.length} fichiers CSV...`);
  
  // Vider la table products avant de recharger
  db.prepare('DELETE FROM products').run();
  console.log('🗑️  Table products vidée');
  
  let totalProducts = 0;
  
  const stmt = db.prepare(`
    INSERT INTO products (name, description, price, stock, category, image_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  for (const file of files) {
    const filePath = path.join(dataPath, file);
    const csvContent = fs.readFileSync(filePath, 'utf8');
    
    // Parser le CSV manuellement (simple)
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) continue;
    
    console.log(`📂 Fichier: ${file}`);
    
    let count = 0;
    
    // Sauter la ligne d'en-tête (index 0)
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      
      if (values.length < 7) continue; // Ligne invalide
      
      const product = {
        id: values[0].trim(),
        name: values[1].trim(),
        description: values[2].trim(),
        price: parseFloat(values[3].trim()),
        stock: parseInt(values[4].trim()),
        category: values[5].trim(),
        image_path: values[6].trim()
      };
      
      try {
        stmt.run(
          product.name,
          product.description,
          product.price,
          product.stock,
          product.category,
          product.image_path
        );
        count++;
        totalProducts++;
      } catch (error) {
        console.error(`  ❌ Erreur ligne ${i + 1}:`, error.message);
      }
    }
    
    console.log(`  ✓ ${count} produits chargés`);
  }
  
  console.log(`✅ Total: ${totalProducts} produits chargés avec succès!\n`);
}
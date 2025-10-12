import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class InvoiceService {
  static async generateInvoicePDF(doc, orderItems, pendingItems, userProfile, orderDate, orderId) {
    if (doc.page.content && doc.page.content.length > 0) {
      doc = new PDFDocument({ autoFirstPage: true });
    }
    
    // Séparer les articles livrés et non livrés
    const deliveredItems = orderItems.filter(item => item.quantity > 0);
    
    // PAGE 1: Bon de livraison (quantités sans prix)
    await this.generateDeliveryNotePage(doc, deliveredItems, userProfile, orderDate, orderId);
    
    // PAGE 2+: Facture détaillée (avec prix)
    doc.addPage();
    const { totals } = await this.generateItemsPage(doc, deliveredItems, userProfile, orderDate, orderId);
    
    // PAGE FINALE: Articles en attente + Bulletin de versement
    doc.addPage();
    await this.generateTotalPage(doc, {
      ...totals,
      orderDate,
      orderId,
      userProfile,
      pendingItems
    });
    
    return totals;
  }

  static formatOrderId(orderId, orderDate) {
    const orderDateObj = new Date(orderDate);
    const year = orderDateObj.getFullYear().toString().slice(-2);
    const month = (orderDateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = orderDateObj.getDate().toString().padStart(2, '0');
    const hour = orderDateObj.getHours().toString().padStart(2, '0');
    
    return `${year}${month}-${day}${hour}`;
  }

  // PAGE 1: BON DE LIVRAISON (sans prix)
  static async generateDeliveryNotePage(doc, deliveredItems, userProfile, orderDate, orderId) {
    const addHeaderElement = (text, x, y, options = {}) => {
      doc.font('Helvetica').fontSize(9).text(text, x, y, options);
    };

    const addHeader = () => {
      const rootDir = path.resolve(process.cwd());
      const logoPath = path.join(rootDir, 'static', 'images', 'logo_discado_noir.png');
      
      try {
        doc.image(logoPath, 50, 35, { width: 90 });
      } catch (e) {
        console.warn('Logo non trouvé:', logoPath);
      }

      const senderY = 50;
      const lineSpacing = 12;
      
      addHeaderElement('Discado Sàrl', 50, senderY + lineSpacing * 1);
      addHeaderElement('Sevelin 4A', 50, senderY + lineSpacing * 2);
      addHeaderElement('1007 Lausanne', 50, senderY + lineSpacing * 3);
      addHeaderElement('+41 79 457 33 85', 50, senderY + lineSpacing * 4);
      addHeaderElement('+41 78 343 36 31', 50, senderY + lineSpacing * 5);
      addHeaderElement('catalog.discado@gmail.com', 50, senderY + lineSpacing * 6);
      addHeaderElement('TVA CHE-114.139.308', 50, senderY + lineSpacing * 8);

      const clientStartY = senderY + lineSpacing * 7;
      
      addHeaderElement(`${userProfile.first_name || ''} ${userProfile.last_name || ''}`, 350, clientStartY);
      addHeaderElement(userProfile.email || '', 350, clientStartY + lineSpacing * 1);
      addHeaderElement(userProfile.street || '', 350, clientStartY + lineSpacing * 2);
      addHeaderElement(
        `${userProfile.postal_code || ''} ${userProfile.city || ''}`,
        350,
        clientStartY + lineSpacing * 3
      );

      const formattedOrderId = this.formatOrderId(orderId, orderDate);
      const titleY = senderY + lineSpacing * 11;
      
      doc.font('Helvetica-Bold').fontSize(14).text(`Bon de livraison ${formattedOrderId}`, 50, titleY + 5);
      addHeaderElement(`Date: ${orderDate.toLocaleDateString('fr-FR')}`, 50, titleY + 40);

      return titleY + 60;
    };

    const createTableHeader = (startY) => {
      const columns = [
        { title: 'Description', width: 400, align: 'left' },
        { title: 'Quantité', width: 100, align: 'center' }
      ];
      
      const tableX = 50;
      const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
      
      doc.rect(tableX, startY, tableWidth, 25).stroke();
      
      let currentX = tableX;
      doc.font('Helvetica-Bold').fontSize(10);
      
      columns.forEach((col, index) => {
        if (index > 0) {
          doc.moveTo(currentX, startY).lineTo(currentX, startY + 25).stroke();
        }
        
        doc.text(col.title, currentX + 5, startY + 8, {
          width: col.width - 10,
          align: col.align
        });
        
        currentX += col.width;
      });
      
      return { yPosition: startY + 25, columns, tableX, tableWidth };
    };

    const addTableRow = (item, category, rowY, isCategory, tableConfig) => {
      const { tableX, columns, tableWidth } = tableConfig;
      const rowHeight = 20;
      
      doc.rect(tableX, rowY, tableWidth, rowHeight).stroke();
      
      let currentX = tableX;
      
      if (isCategory) {
        doc.font('Helvetica-Bold').fontSize(9);
        doc.fillColor('#f0f0f0');
        doc.rect(tableX, rowY, tableWidth, rowHeight).fill();
        doc.fillColor('black');
        doc.text(category.charAt(0).toUpperCase() + category.slice(1), currentX + 5, rowY + 6, {
          width: tableWidth - 10
        });
      } else {
        doc.font('Helvetica').fontSize(9);
        
        doc.text(item.name, currentX + 5, rowY + 6, {
          width: columns[0].width - 10,
          align: columns[0].align
        });
        currentX += columns[0].width;
        
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        doc.text(String(item.quantity), currentX + 5, rowY + 6, {
          width: columns[1].width - 10,
          align: columns[1].align
        });
      }
      
      return rowY + rowHeight;
    };

    let yPos = addHeader();
    const tableConfig = createTableHeader(yPos);
    yPos = tableConfig.yPosition;
    
    // Grouper par catégorie
    const groupedItems = {};
    deliveredItems.forEach(item => {
      const category = item.name.split(' ')[0] || 'autres';
      if (!groupedItems[category]) {
        groupedItems[category] = [];
      }
      groupedItems[category].push(item);
    });
    
    const sortedCategories = Object.keys(groupedItems).sort();
    
    for (const category of sortedCategories) {
      yPos = addTableRow(null, category, yPos, true, tableConfig);
      
      for (const item of groupedItems[category]) {
        yPos = addTableRow(item, category, yPos, false, tableConfig);
      }
    }
  }

  // PAGE 2+: FACTURE DÉTAILLÉE (avec prix)
  static async generateItemsPage(doc, orderItems, userProfile, orderDate, orderId) {
    const addHeaderElement = (text, x, y, options = {}) => {
      doc.font('Helvetica').fontSize(9).text(text, x, y, options);
    };

    const addInvoiceHeader = () => {
      const rootDir = path.resolve(process.cwd());
      const logoPath = path.join(rootDir, 'static', 'images', 'logo_discado_noir.png');
      
      try {
        doc.image(logoPath, 50, 35, { width: 90 });
      } catch (e) {
        console.warn('Logo non trouvé:', logoPath);
      }

      const senderY = 50;
      const lineSpacing = 12;
      
      addHeaderElement('Discado Sàrl', 50, senderY + lineSpacing * 1);
      addHeaderElement('Sevelin 4A', 50, senderY + lineSpacing * 2);
      addHeaderElement('1007 Lausanne', 50, senderY + lineSpacing * 3);
      addHeaderElement('+41 79 457 33 85', 50, senderY + lineSpacing * 4);
      addHeaderElement('+41 78 343 36 31', 50, senderY + lineSpacing * 5);
      addHeaderElement('catalog.discado@gmail.com', 50, senderY + lineSpacing * 6);
      addHeaderElement('TVA CHE-114.139.308', 50, senderY + lineSpacing * 8);

      const clientStartY = senderY + lineSpacing * 7;
      
      addHeaderElement(`${userProfile.first_name || ''} ${userProfile.last_name || ''}`, 350, clientStartY);
      addHeaderElement(userProfile.email || '', 350, clientStartY + lineSpacing * 1);
      addHeaderElement(userProfile.street || '', 350, clientStartY + lineSpacing * 2);
      addHeaderElement(
        `${userProfile.postal_code || ''} ${userProfile.city || ''}`,
        350,
        clientStartY + lineSpacing * 3
      );

      const formattedOrderId = this.formatOrderId(orderId, orderDate);
      const titleY = senderY + lineSpacing * 11;
      
      doc.font('Helvetica-Bold').fontSize(14).text(`Facture ${formattedOrderId}`, 50, titleY + 5);
      addHeaderElement(`Date de facture: ${orderDate.toLocaleDateString('fr-FR')}`, 50, titleY + 40);

      return titleY + 60;
    };

    const createTableHeader = (startY) => {
      const columns = [
        { title: 'Description', width: 230, align: 'left' },
        { title: 'Quantité', width: 70, align: 'center' },
        { title: 'Prix unitaire', width: 100, align: 'right' },
        { title: 'Total', width: 100, align: 'right' }
      ];
      
      const tableX = 50;
      const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
      
      doc.rect(tableX, startY, tableWidth, 25).stroke();
      
      let currentX = tableX;
      doc.font('Helvetica-Bold').fontSize(10);
      
      columns.forEach((col, index) => {
        if (index > 0) {
          doc.moveTo(currentX, startY).lineTo(currentX, startY + 25).stroke();
        }
        
        doc.text(col.title, currentX + 5, startY + 8, {
          width: col.width - 10,
          align: col.align
        });
        
        currentX += col.width;
      });
      
      return { yPosition: startY + 25, columns, tableX, tableWidth };
    };

    const addTableRow = (item, category, rowY, isCategory = false, tableConfig) => {
      const { tableX, columns, tableWidth } = tableConfig;
      const rowHeight = 20;
      
      doc.rect(tableX, rowY, tableWidth, rowHeight).stroke();
      
      let currentX = tableX;
      
      if (isCategory) {
        doc.font('Helvetica-Bold').fontSize(9);
        doc.fillColor('#f0f0f0');
        doc.rect(tableX, rowY, tableWidth, rowHeight).fill();
        doc.fillColor('black');
        doc.text(category.charAt(0).toUpperCase() + category.slice(1), currentX + 5, rowY + 6, {
          width: tableWidth - 10
        });
      } else {
        doc.font('Helvetica').fontSize(9);
        
        doc.text(item.name, currentX + 5, rowY + 6, {
          width: columns[0].width - 10,
          align: columns[0].align
        });
        currentX += columns[0].width;
        
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        doc.text(String(item.quantity), currentX + 5, rowY + 6, {
          width: columns[1].width - 10,
          align: columns[1].align
        });
        currentX += columns[1].width;
        
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        doc.text(`${parseFloat(item.unit_price).toFixed(2)} CHF`, currentX + 5, rowY + 6, {
          width: columns[2].width - 10,
          align: columns[2].align
        });
        currentX += columns[2].width;
        
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        const itemTotal = parseFloat(item.unit_price) * item.quantity;
        doc.text(`${itemTotal.toFixed(2)} CHF`, currentX + 5, rowY + 6, {
          width: columns[3].width - 10,
          align: columns[3].align
        });
      }
      
      return rowY + rowHeight;
    };

    const addNewPage = () => {
      doc.addPage();
      return createTableHeader(40).yPosition;
    };

    const needsNewPage = (currentY, requiredHeight = 30) => {
      return currentY + requiredHeight > doc.page.height - 120;
    };

    let yPos = addInvoiceHeader();
    const tableConfig = createTableHeader(yPos);
    yPos = tableConfig.yPosition;
    
    const groupedItems = {};
    orderItems.forEach(item => {
      const category = item.name.split(' ')[0] || 'autres';
      if (!groupedItems[category]) {
        groupedItems[category] = [];
      }
      groupedItems[category].push(item);
    });
    
    let totalHT = 0;
    const sortedCategories = Object.keys(groupedItems).sort();
    
    for (const category of sortedCategories) {
      if (needsNewPage(yPos)) {
        yPos = addNewPage();
      }
      
      yPos = addTableRow(null, category, yPos, true, tableConfig);
      
      for (const item of groupedItems[category]) {
        if (needsNewPage(yPos)) {
          yPos = addNewPage();
        }
        
        yPos = addTableRow(item, category, yPos, false, tableConfig);
        totalHT += parseFloat(item.unit_price) * item.quantity;
      }
    }
    
    const TVA = 0.081;
    const montantTVA = totalHT * TVA;
    const totalTTC = totalHT + montantTVA;
    
    if (needsNewPage(yPos, 80)) {
      doc.addPage();
      yPos = 40;
    }
    
    const { tableX, tableWidth, columns } = tableConfig;
    const col1Width = columns[0].width;
    const col2Width = columns[1].width;
    const col3Width = columns[2].width;
    const col4Width = columns[3].width;
    
    const col1X = tableX;
    const col2X = col1X + col1Width;
    const col3X = col2X + col2Width;
    const col4X = col3X + col3Width;
    
    const totalRowHeight = 20;
    
    // SOUS-TOTAL HT
    doc.rect(col1X, yPos, col1Width + col2Width, totalRowHeight).stroke();
    doc.rect(col3X, yPos, col3Width, totalRowHeight).stroke();
    doc.rect(col4X, yPos, col4Width, totalRowHeight).stroke();
    
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text("SOUS-TOTAL HT", col3X + 5, yPos + 6, {
      width: col3Width - 10,
      align: 'left'
    });
    
    doc.text(`${totalHT.toFixed(2)} CHF`, col4X + 5, yPos + 6, {
      width: col4Width - 10,
      align: 'right'
    });
    
    yPos += totalRowHeight;
    
    // TVA
    doc.rect(col1X, yPos, col1Width + col2Width, totalRowHeight).stroke();
    doc.rect(col3X, yPos, col3Width, totalRowHeight).stroke();
    doc.rect(col4X, yPos, col4Width, totalRowHeight).stroke();
    
    doc.text("TVA 8.1%", col3X + 5, yPos + 6, {
      width: col3Width - 10,
      align: 'left'
    });
    
    doc.text(`${montantTVA.toFixed(2)} CHF`, col4X + 5, yPos + 6, {
      width: col4Width - 10,
      align: 'right'
    });
    
    yPos += totalRowHeight;
    
    // TOTAL TTC
    doc.rect(col1X, yPos, col1Width + col2Width, totalRowHeight).stroke();
    doc.rect(col3X, yPos, col3Width, totalRowHeight).stroke();
    doc.rect(col4X, yPos, col4Width, totalRowHeight).stroke();
    
    doc.text("TOTAL TTC", col3X + 5, yPos + 6, {
      width: col3Width - 10,
      align: 'left'
    });
    
    doc.text(`${totalTTC.toFixed(2)} CHF`, col4X + 5, yPos + 6, {
      width: col4Width - 10,
      align: 'right'
    });
    
    yPos += totalRowHeight;
    
    yPos += 20;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Voir page suivante pour les articles en attente et le bulletin de versement.', 50, yPos);
    
    return {
      totals: {
        totalHT,
        montantTVA,
        totalTTC
      },
      finalYPosition: yPos + 20
    };
  }

  // PAGE FINALE: ARTICLES EN ATTENTE + BULLETIN
  static async generateTotalPage(doc, invoiceData) {
    const { totalHT, montantTVA, totalTTC, orderDate, orderId, userProfile, pendingItems } = invoiceData;
    
    const formattedOrderId = this.formatOrderId(orderId, orderDate);
    
    const addHeaderElement = (text, x, y, options = {}) => {
      doc.font('Helvetica').fontSize(9).text(text, x, y, options);
    };

    const addInvoiceHeader = () => {
      const rootDir = path.resolve(process.cwd());
      const logoPath = path.join(rootDir, 'static', 'images', 'logo_discado_noir.png');
      
      try {
        doc.image(logoPath, 50, 35, { width: 90 });
      } catch (e) {
        console.warn('Logo non trouvé:', logoPath);
      }

      const senderY = 50;
      const lineSpacing = 12;
      
      addHeaderElement('Discado Sàrl', 50, senderY + lineSpacing * 1);
      addHeaderElement('Sevelin 4A', 50, senderY + lineSpacing * 2);
      addHeaderElement('1007 Lausanne', 50, senderY + lineSpacing * 3);
      addHeaderElement('+41 79 457 33 85', 50, senderY + lineSpacing * 4);
      addHeaderElement('+41 78 343 36 31', 50, senderY + lineSpacing * 5);
      addHeaderElement('catalog.discado@gmail.com', 50, senderY + lineSpacing * 6);
      addHeaderElement('TVA CHE-114.139.308', 50, senderY + lineSpacing * 8);

      const clientStartY = senderY + lineSpacing * 7;
      
      addHeaderElement(`${userProfile.first_name || ''} ${userProfile.last_name || ''}`, 350, clientStartY);
      addHeaderElement(userProfile.email || '', 350, clientStartY + lineSpacing * 1);
      addHeaderElement(userProfile.street || '', 350, clientStartY + lineSpacing * 2);
      addHeaderElement(
        `${userProfile.postal_code || ''} ${userProfile.city || ''}`,
        350,
        clientStartY + lineSpacing * 3
      );

      const titleY = senderY + lineSpacing * 12;
      
      doc.font('Helvetica-Bold').fontSize(14).text(`Facture ${formattedOrderId}`, 50, titleY + 5);
      doc.font('Helvetica').fontSize(10).text(`Date: ${orderDate.toLocaleDateString('fr-FR')}`, 50, titleY + 25);

      return titleY + 60;
    };

    const addPendingItemsSection = (yPosition) => {
      if (!pendingItems || pendingItems.length === 0) {
        return yPosition;
      }

      let yPos = yPosition;

      // Titre
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#FF6B00');
      doc.text('ARTICLES EN ATTENTE DE LIVRAISON', 50, yPos);
      yPos += 20;

      // Grouper par catégorie
      const groupedPending = {};
      pendingItems.forEach(item => {
        const category = item.name.split(' ')[0] || 'autres';
        if (!groupedPending[category]) {
          groupedPending[category] = [];
        }
        groupedPending[category].push(item);
      });

      const sortedCategories = Object.keys(groupedPending).sort();

      doc.font('Helvetica').fontSize(9).fillColor('black');

      for (const category of sortedCategories) {
        // Nom de catégorie
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text(`${category.charAt(0).toUpperCase() + category.slice(1)}:`, 50, yPos);
        yPos += 15;

        // Articles
        doc.font('Helvetica').fontSize(9);
        for (const item of groupedPending[category]) {
          doc.text(`• ${item.name} - Quantité: ${item.quantity}`, 70, yPos);
          yPos += 12;
        }
        yPos += 5;
      }

      yPos += 10;
      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#666666');
      doc.text('Ces articles seront livrés ultérieurement.', 50, yPos);
      yPos += 30;

      doc.fillColor('black');
      return yPos;
    };

    const addSimpleTotalLine = (yPosition) => {
      const pageHeight = doc.page.height;
      const pageWidth = doc.page.width;
      const receiptHeight = pageHeight / 2.8;
      const availableHeight = pageHeight - receiptHeight - yPosition;
      const centerY = yPosition + (availableHeight / 2) - 70;
      
      const horizontalCenter = Math.floor(pageWidth / 2);
      
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`TOTAL TTC: ${totalTTC.toFixed(2)} CHF`, horizontalCenter - 90, centerY);
      
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('DÉLAI DE PAIEMENT: net 30 jours', horizontalCenter - 105, centerY + 50);
      
      return centerY + 50;
    };

    const addPaymentSlip = () => {
      const rootDir = path.resolve(process.cwd());
      const receiptImagePath = path.join(rootDir, 'static', 'images', 'recepisse.png');
      
      const pageWidth = doc.page.width;
      const receiptImageWidth = pageWidth;
      
      const receiptAspectRatio = 1.8;
      const receiptImageHeight = receiptImageWidth / receiptAspectRatio;
      
      const receiptYPosition = doc.page.height - receiptImageHeight - 10;
      
      doc.lineWidth(0.5);
      doc.moveTo(0, receiptYPosition - 10).lineTo(pageWidth, receiptYPosition - 10).stroke();
      
      try {
        doc.image(receiptImagePath, 0, receiptYPosition, { 
          width: receiptImageWidth,
          align: 'center'
        });
      } catch (e) {
        console.warn('Image recepisse non trouvée:', receiptImagePath);
      }
    };

    let yPos = addInvoiceHeader();
    
    // Ajouter la section des articles en attente
    yPos = addPendingItemsSection(yPos);
    
    // Ajouter le total
    const totalLineEndY = addSimpleTotalLine(yPos);
    
    // Ajouter le bulletin de versement
    addPaymentSlip();
  }
}

export default InvoiceService;
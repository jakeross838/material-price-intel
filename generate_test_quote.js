const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50 });
const stream = fs.createWriteStream('test_quote.pdf');
doc.pipe(stream);

function fmtMoney(n) {
  return '$' + n.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Header
doc.fontSize(20).font('Helvetica-Bold').text('Gulf Coast Building Supply', { align: 'center' });
doc.fontSize(10).font('Helvetica').text('4521 Cortez Road W, Bradenton, FL 34210', { align: 'center' });
doc.text('Phone: (941) 555-0142 | Fax: (941) 555-0143', { align: 'center' });
doc.text('sales@gulfcoastbuildingsupply.com', { align: 'center' });
doc.moveDown(1.5);

// Quote info
doc.fontSize(16).font('Helvetica-Bold').text('MATERIAL QUOTE');
doc.moveDown(0.5);
doc.fontSize(10).font('Helvetica');
doc.text('Quote #: GCB-2026-0847');
doc.text('Date: February 10, 2026');
doc.text('Valid Until: March 12, 2026');
doc.text('Project: 1847 Bayshore Dr Custom Home');
doc.text('Attention: Greg Ross, Ross Built Custom Homes');
doc.text('Sales Rep: Mike Thompson | mike@gcbs.com | (941) 555-0144');
doc.moveDown(1);

// Table header
doc.font('Helvetica-Bold');
const startX = 50;
const colWidths = [30, 200, 50, 40, 70, 70];
const headers = ['#', 'Description', 'Qty', 'Unit', 'Unit Price', 'Total'];
let y = doc.y;
headers.forEach((h, i) => {
  let x = startX;
  for (let j = 0; j < i; j++) x += colWidths[j];
  doc.text(h, x, y, { width: colWidths[i], align: i >= 4 ? 'right' : 'left' });
});
doc.moveDown(0.5);
y = doc.y;
doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b), y).stroke();
doc.moveDown(0.3);

// Line items
doc.font('Helvetica');
const items = [
  { num: 1, desc: '2x4x8 SPF #2 KD', qty: 240, unit: 'ea', price: 4.87, total: 1168.80 },
  { num: 2, desc: '2x6x16 SPF #2 KD', qty: 180, unit: 'ea', price: 9.24, total: 1663.20 },
  { num: 3, desc: '2x10x16 PT .40 CCA #2', qty: 96, unit: 'ea', price: 22.15, total: 2126.40 },
  { num: 4, desc: '2x12x20 SYP #1 KD', qty: 48, unit: 'ea', price: 38.50, total: 1848.00 },
  { num: 5, desc: '4x4x10 PT .60 CCA', qty: 32, unit: 'ea', price: 18.75, total: 600.00 },
  { num: 6, desc: '3/4 CDX Plywood 4x8', qty: 120, unit: 'sht', price: 42.50, total: 5100.00 },
  { num: 7, desc: '7/16 OSB Sheathing 4x8', qty: 85, unit: 'sht', price: 18.90, total: 1606.50 },
  { num: 8, desc: 'Ipe Decking 5/4x6x16 S4S', qty: 60, unit: 'pc', price: 158.00, total: 9480.00 },
  { num: 9, desc: 'Trex Transcend 1x6x20 Spiced Rum', qty: 40, unit: 'pc', price: 78.50, total: 3140.00 },
  { num: 10, desc: 'Simpson Strong-Tie H2.5A Hurricane Clip', qty: 200, unit: 'ea', price: 1.85, total: 370.00 },
];

items.forEach(item => {
  y = doc.y;
  doc.text(String(item.num), startX, y, { width: colWidths[0] });
  doc.text(item.desc, startX + colWidths[0], y, { width: colWidths[1] });
  doc.text(String(item.qty), startX + colWidths[0] + colWidths[1], y, { width: colWidths[2] });
  doc.text(item.unit, startX + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3] });
  doc.text(fmtMoney(item.price), startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, { width: colWidths[4], align: 'right' });
  doc.text(fmtMoney(item.total), startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y, { width: colWidths[5], align: 'right' });
  doc.moveDown(0.7);
});

// Totals
doc.moveDown(0.5);
y = doc.y;
doc.moveTo(startX + 300, y).lineTo(startX + colWidths.reduce((a, b) => a + b), y).stroke();
doc.moveDown(0.5);

const subtotal = 27102.90;
const delivery = 850.00;
const tax = subtotal * 0.07;  // $1897.20
const total = subtotal + delivery + tax;  // $29850.10

const rightCol = startX + 300;
doc.font('Helvetica');
doc.text('Subtotal:', rightCol, doc.y, { width: 100 });
doc.text(fmtMoney(subtotal), rightCol + 100, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' });
doc.moveDown(0.5);
doc.text('Delivery (Bradenton):', rightCol, doc.y, { width: 100 });
doc.text(fmtMoney(delivery), rightCol + 100, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' });
doc.moveDown(0.5);
doc.text('FL Sales Tax (7%):', rightCol, doc.y, { width: 100 });
doc.text(fmtMoney(tax), rightCol + 100, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' });
doc.moveDown(0.5);
doc.font('Helvetica-Bold');
doc.text('TOTAL:', rightCol, doc.y, { width: 100 });
doc.text(fmtMoney(total), rightCol + 100, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' });

// Footer
doc.moveDown(2);
doc.font('Helvetica').fontSize(9);
doc.text('Payment Terms: Net 30 from delivery date', startX);
doc.text('Prices subject to change. Material availability not guaranteed beyond quote validity date.');
doc.text('FOB: Gulf Coast Building Supply warehouse. Delivery quoted for Bradenton/Sarasota area.');

doc.end();
stream.on('finish', () => {
  const size = fs.statSync('test_quote.pdf').size;
  console.log('PDF created: test_quote.pdf (' + size + ' bytes)');
});

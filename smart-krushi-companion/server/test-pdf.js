const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, './utils/fonts/NotoSerifDevanagari-Regular.ttf');
console.log('Font path:', fontPath, 'Exists:', fs.existsSync(fontPath));

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test.pdf'));

doc.registerFont('marathi', fontPath);
doc.font('marathi').fontSize(16).text('नमस्कार, ही चाचणी आहे.', { align: 'center' });

doc.end(); 
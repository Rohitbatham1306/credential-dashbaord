const { createObjectCsvWriter } = require('csv-writer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function exportCsv(filePath, records) {
  const headers = Object.keys(records[0] || {}).map(k => ({ id: k, title: k }));
  const writer = createObjectCsvWriter({ path: filePath, header: headers });
  await writer.writeRecords(records);
  return filePath;
}

async function exportPdf(filePath, title, records) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    
    doc.pipe(stream);
    
    // Title
    doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown();
    
    // Summary
    const total = records.length;
    const confirmed = records.filter(r => r.confirmed).length;
    const problematic = records.filter(r => r.problematic).length;
    const inactive = records.filter(r => r.inactive).length;
    
    doc.fontSize(12).font('Helvetica').text(`Total Assignments: ${total}`, { align: 'left' });
    doc.fontSize(12).text(`Confirmed: ${confirmed}`, { align: 'left' });
    doc.fontSize(12).text(`Problematic: ${problematic}`, { align: 'left' });
    doc.fontSize(12).text(`Inactive: ${inactive}`, { align: 'left' });
    doc.moveDown(2);
    
    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('User', 50, doc.y);
    doc.text('Credential', 200, doc.y);
    doc.text('Status', 350, doc.y);
    doc.moveDown();
    
    // Table content
    doc.fontSize(9).font('Helvetica');
    records.forEach((record, index) => {
      if (doc.y > 700) { // New page if near bottom
        doc.addPage();
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('User', 50, doc.y);
        doc.text('Credential', 200, doc.y);
        doc.text('Status', 350, doc.y);
        doc.moveDown();
        doc.fontSize(9).font('Helvetica');
      }
      
      const status = record.inactive ? 'Inactive' : record.confirmed ? 'Confirmed' : record.problematic ? 'Problematic' : 'Pending';
      const statusColor = record.inactive ? '#dc2626' : record.confirmed ? '#059669' : record.problematic ? '#dc2626' : '#d97706';
      
      doc.fillColor(statusColor);
      doc.text(record.user || 'N/A', 50, doc.y);
      doc.text(record.credential || 'N/A', 200, doc.y);
      doc.text(status, 350, doc.y);
      doc.fillColor('#000000');
      doc.moveDown();
    });
    
    doc.end();
    
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { exportCsv, exportPdf };


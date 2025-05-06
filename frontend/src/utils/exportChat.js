import { jsPDF } from 'jspdf';

export const exportChatAsPDF = (messages, title = 'Chat History') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 20, 20);
  
  // Add date
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 30);
  
  let yPos = 40;
  
  // Add messages
  doc.setFontSize(10);
  messages.forEach(msg => {
    const sender = msg.isUser ? 'You' : 'Medical Assistant';
    const text = `${sender}: ${msg.text}`;
    
    // Split long messages into multiple lines
    const splitText = doc.splitTextToSize(text, 170);
    
    // Check if we need a new page
    if (yPos + splitText.length * 7 > 280) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(splitText, 20, yPos);
    yPos += splitText.length * 7 + 5;
  });
  
  // Save the PDF
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};
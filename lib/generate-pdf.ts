import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { InvoiceFormValues } from '@/app/invoice-schema';

export const generatePDF = async (previewRef: HTMLDivElement) => {
  // Save original class
  const originalClass = previewRef.className;
  // Force light mode
  previewRef.classList.add('light');
  previewRef.classList.remove('dark');
  try {
    const canvas = await html2canvas(previewRef, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable CORS for images
      logging: false,
      backgroundColor: '#ffffff'
    });
    // Restore original class
    previewRef.className = originalClass;

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let firstPage = true;

    while (heightLeft >= 0) {
      if (!firstPage) {
        pdf.addPage();
      }
      
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight,
        '',
        'FAST'
      );
      
      heightLeft -= pageHeight;
      position -= pageHeight;
      firstPage = false;
    }

    return pdf;
  } catch (error) {
    // Restore original class on error
    previewRef.className = originalClass;
    console.error('Error generating PDF:', error);
    throw error;
  }
}; 

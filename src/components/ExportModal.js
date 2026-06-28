import { html, useState } from '../html.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function ExportModal({ isOpen, onClose, reportCardRef, dateStr }) {
  const [status, setStatus] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async (format) => {
    const el = reportCardRef.current;
    if (!el) {
      setStatus('Error: Report card element not found.');
      return;
    }

    setIsExporting(true);
    setStatus('Rendering report card...');
    
    try {
      // Create high-resolution screenshot of the offscreen #reportCard element
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FBF6EC'
      });

      const filename = `sadhana-report-${dateStr}`;

      if (format === 'png' || format === 'jpg') {
        setStatus('Generating image file...');
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const imgData = canvas.toDataURL(mimeType, 0.95);
        
        const link = document.createElement('a');
        link.download = `${filename}.${format}`;
        link.href = imgData;
        link.click();
        
        setStatus('Success! Download started.');
      } else if (format === 'pdf') {
        setStatus('Generating PDF document...');
        
        const imgWidth = 480;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const pdfWidth = imgWidth * 0.75;
        const pdfHeight = imgHeight * 0.75;
        
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: [pdfWidth, pdfHeight]
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        doc.save(`${filename}.pdf`);
        
        setStatus('Success! PDF download started.');
      }
      
      setTimeout(() => {
        setIsExporting(false);
        setStatus('');
        onClose();
      }, 1200);

    } catch (error) {
      console.error('Export failed:', error);
      setStatus(`Export failed: ${error.message}`);
      setIsExporting(false);
    }
  };

  return html`
    <div class="modal-overlay open" onClick=${onClose}>
      <div class="modal-card" onClick=${(e) => e.stopPropagation()}>
        <div class="modal-title">Choose a format</div>
        <div class="modal-sub">Your report will be saved and downloaded</div>
        
        <div class="format-options" id="formatOptions" style=${{ display: status ? 'none' : 'flex' }}>
          <button class="format-btn" onClick=${() => handleExport('jpg')} type="button" disabled=${isExporting}>
            <span class="format-icon">🖼️</span>
            <span class="format-text">
              <strong>JPG image</strong>
              <span>Smaller file, great for sharing</span>
            </span>
          </button>
          <button class="format-btn" onClick=${() => handleExport('png')} type="button" disabled=${isExporting}>
            <span class="format-icon">🎨</span>
            <span class="format-text">
              <strong>PNG image</strong>
              <span>Crisp, lossless quality</span>
            </span>
          </button>
          <button class="format-btn" onClick=${() => handleExport('pdf')} type="button" disabled=${isExporting}>
            <span class="format-icon">📄</span>
            <span class="format-text">
              <strong>PDF document</strong>
              <span>Best for printing or archiving</span>
            </span>
          </button>
        </div>

        ${status && html`
          <div class="modal-status" id="modalStatus">${status}</div>
        `}

        <button class="modal-cancel" onClick=${onClose} type="button" disabled=${isExporting}>Cancel</button>
      </div>
    </div>
  `;
}

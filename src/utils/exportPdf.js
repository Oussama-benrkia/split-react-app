import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportPdf(filename = 'facture.pdf') {
  const pageEls = Array.from(document.querySelectorAll('.a4-page'))
  if (!pageEls.length) return

  // Hide elements marked data-print-hide (toolbar, page-number overlays).
  // Use display:none so fixed-position elements don't bleed into the canvas.
  const hidden = Array.from(document.querySelectorAll('[data-print-hide]'))
  hidden.forEach(el => { el.style.setProperty('display', 'none', 'important') })

  try {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    for (let i = 0; i < pageEls.length; i++) {
      const canvas = await html2canvas(pageEls[i], {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Capture only the page element itself, not the viewport.
        windowWidth: pageEls[i].scrollWidth,
        windowHeight: pageEls[i].scrollHeight,
      })

      if (i > 0) pdf.addPage()
      // Stretch canvas to exact A4 dimensions (210×297 mm).
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297)
    }

    pdf.save(filename)
  } finally {
    hidden.forEach(el => el.style.removeProperty('display'))
  }
}

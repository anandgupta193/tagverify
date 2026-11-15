import { jsPDF } from 'jspdf'
import { qrPng } from '@/lib/qr'

export interface StickerItem {
  qrId: string
  companyName: string
  productType?: string
}

/**
 * A4 sheet of QR stickers, 4 x 6 per page (24 per page), each with the QR,
 * its ID and the company name underneath. Downloads straight away.
 */
export async function downloadStickerSheet(items: StickerItem[], fileName: string) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const cols = 4
  const rows = 6
  const pageW = 210
  const pageH = 297
  const margin = 10
  const cellW = (pageW - margin * 2) / cols
  const cellH = (pageH - margin * 2) / rows
  const qrSize = Math.min(cellW, cellH) - 14

  for (let i = 0; i < items.length; i++) {
    const slot = i % (cols * rows)
    if (i > 0 && slot === 0) pdf.addPage()
    const col = slot % cols
    const row = Math.floor(slot / cols)
    const x = margin + col * cellW
    const y = margin + row * cellH
    const item = items[i]

    // light cut guide
    pdf.setDrawColor(210)
    pdf.rect(x + 1, y + 1, cellW - 2, cellH - 2)

    const png = await qrPng(item.qrId, 300)
    pdf.addImage(png, 'PNG', x + (cellW - qrSize) / 2, y + 3, qrSize, qrSize)

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text(item.qrId, x + cellW / 2, y + qrSize + 7, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    const sub = item.productType ? `${item.companyName} · ${item.productType}` : item.companyName
    pdf.text(sub.slice(0, 40), x + cellW / 2, y + qrSize + 11, { align: 'center' })
  }
  pdf.save(fileName)
}

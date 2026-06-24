import jsPDF from 'jspdf'

export async function downloadQuotationPdf(quotationId: string) {
  const res = await fetch(`/api/generate-quotation-pdf?id=${quotationId}`)
  const q = await res.json()

  const doc = new jsPDF()
  const gold = [184, 134, 11] as const
  const dark = [28, 23, 18] as const
  const grey = [154, 143, 130] as const

  // Header background
  doc.setFillColor(28, 23, 18)
  doc.rect(0, 0, 210, 40, 'F')

  // Company name
  doc.setTextColor(184, 134, 11)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('GK · CRM', 14, 18)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Interior Design', 14, 26)

  // Quotation title on right
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('QUOTATION', 196, 18, { align: 'right' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`No: ${q.quotation_no ?? '—'}`, 196, 26, { align: 'right' })
  doc.text(`Date: ${new Date(q.created_at).toLocaleDateString('en-IN')}`, 196, 32, { align: 'right' })

  // Status badge
  const statusColors: Record<string, number[]> = {
    approved: [16, 185, 129],
    pending:  [245, 158, 11],
    sent:     [59, 130, 246],
    rejected: [239, 68, 68],
    draft:    [154, 143, 130],
  }
  const sColor = statusColors[q.status] ?? statusColors.draft
  doc.setFillColor(sColor[0], sColor[1], sColor[2])
  doc.roundedRect(14, 48, 30, 8, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text((q.status ?? 'draft').toUpperCase(), 29, 53.5, { align: 'center' })

  // Divider
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.5)
  doc.line(14, 62, 196, 62)

  // Bill To
  doc.setTextColor(...gold)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO', 14, 72)

  doc.setTextColor(...dark)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(q.client?.name ?? '—', 14, 80)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grey)
  let y = 87
  if (q.client?.address) { doc.text(q.client.address, 14, y); y += 6 }
  if (q.client?.city)    { doc.text(q.client.city, 14, y); y += 6 }
  if (q.client?.phone)   { doc.text(`Ph: ${q.client.phone}`, 14, y); y += 6 }
  if (q.client?.email)   { doc.text(q.client.email, 14, y); y += 6 }

  // Amount box
  doc.setFillColor(255, 251, 239)
  doc.roundedRect(130, 68, 66, 30, 3, 3, 'F')
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.3)
  doc.roundedRect(130, 68, 66, 30, 3, 3, 'S')

  doc.setTextColor(...gold)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL AMOUNT', 163, 76, { align: 'center' })

  doc.setTextColor(...dark)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`₹${Number(q.amount).toLocaleString('en-IN')}`, 163, 88, { align: 'center' })

  // Table header
  const tableY = Math.max(y + 10, 110)
  doc.setFillColor(28, 23, 18)
  doc.rect(14, tableY, 182, 10, 'F')
  doc.setTextColor(184, 134, 11)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIPTION', 20, tableY + 6.5)
  doc.text('AMOUNT', 190, tableY + 6.5, { align: 'right' })

  // Table row
  doc.setFillColor(253, 250, 248)
  doc.rect(14, tableY + 10, 182, 12, 'F')
  doc.setTextColor(...dark)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Quotation ${q.quotation_no ?? ''}`, 20, tableY + 18)
  doc.setFont('helvetica', 'bold')
  doc.text(`₹${Number(q.amount).toLocaleString('en-IN')}`, 190, tableY + 18, { align: 'right' })

  // Total row
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.3)
  doc.line(14, tableY + 22, 196, tableY + 22)

  doc.setFillColor(28, 23, 18)
  doc.rect(130, tableY + 22, 66, 12, 'F')
  doc.setTextColor(184, 134, 11)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', 140, tableY + 30)
  doc.setTextColor(255, 255, 255)
  doc.text(`₹${Number(q.amount).toLocaleString('en-IN')}`, 190, tableY + 30, { align: 'right' })

  // Footer
  doc.setFillColor(245, 240, 232)
  doc.rect(0, 272, 210, 25, 'F')
  doc.setTextColor(...grey)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Thank you for your business!', 105, 281, { align: 'center' })
  doc.text('GK · CRM — Interior Design Management', 105, 288, { align: 'center' })

  doc.save(`Quotation-${q.quotation_no ?? q.id}.pdf`)
}
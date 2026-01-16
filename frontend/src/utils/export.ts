import { SecurityEvent } from '../types'

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Determine columns
  const cols = columns || Object.keys(data[0]).map((key) => ({
    key: key as keyof T,
    label: key.toString().replace(/_/g, ' ').toUpperCase(),
  }))

  // Create CSV header
  const header = cols.map((col) => `"${col.label}"`).join(',')

  // Create CSV rows
  const rows = data.map((item) =>
    cols
      .map((col) => {
        const value = item[col.key]
        if (value === null || value === undefined) return '""'
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        return `"${String(value).replace(/"/g, '""')}"`
      })
      .join(',')
  )

  // Combine header and rows
  const csv = [header, ...rows].join('\n')

  // Download
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Export events to CSV with proper formatting
 */
export function exportEventsToCSV(events: SecurityEvent[], filename = 'security-events'): void {
  const columns: { key: keyof SecurityEvent; label: string }[] = [
    { key: 'id', label: 'Event ID' },
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'severity', label: 'Severity' },
    { key: 'source', label: 'Source' },
    { key: 'event_type', label: 'Event Type' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'assigned_to', label: 'Assigned To' },
    { key: 'site_id', label: 'Site ID' },
  ]

  exportToCSV(events as unknown as Record<string, unknown>[], filename, columns as { key: string; label: string }[])
}

/**
 * Generate PDF report using browser print
 */
export function exportToPDF(title: string, content: HTMLElement | string): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to generate PDF')
    return
  }

  const htmlContent = typeof content === 'string' ? content : content.innerHTML

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', -apple-system, sans-serif;
          padding: 40px;
          color: #1e293b;
        }
        .report-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
        }
        .report-header h1 { font-size: 24px; color: #0f172a; margin-bottom: 5px; }
        .report-header p { color: #64748b; font-size: 14px; }
        .report-section { margin-bottom: 30px; }
        .report-section h2 { font-size: 18px; color: #334155; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; color: #475569; }
        tr:hover { background: #f8fafc; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        .badge-critical { background: #fef2f2; color: #dc2626; }
        .badge-high { background: #fff7ed; color: #ea580c; }
        .badge-medium { background: #fefce8; color: #ca8a04; }
        .badge-low { background: #eff6ff; color: #2563eb; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-card .value { font-size: 28px; font-weight: 700; color: #0f172a; }
        .stat-card .label { font-size: 12px; color: #64748b; margin-top: 5px; }
        .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px; }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>AudioSOC Security Report</h1>
        <p>${title} - Generated on ${new Date().toLocaleString('fr-FR')}</p>
      </div>
      ${htmlContent}
      <div class="footer">
        <p>AudioSOC - Security Operations Center for AudioPro Network</p>
        <p>Confidential - Internal Use Only</p>
      </div>
    </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()

  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print()
  }, 500)
}

/**
 * Generate events report as PDF
 */
export function exportEventsReport(
  events: SecurityEvent[],
  stats?: { total: number; critical: number; high: number; medium: number; low: number }
): void {
  const statsHtml = stats
    ? `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${stats.total}</div>
        <div class="label">Total Events</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #dc2626">${stats.critical}</div>
        <div class="label">Critical</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #ea580c">${stats.high}</div>
        <div class="label">High</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #ca8a04">${stats.medium}</div>
        <div class="label">Medium</div>
      </div>
    </div>
  `
    : ''

  const tableHtml = `
    <div class="report-section">
      <h2>Security Events</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Severity</th>
            <th>Source</th>
            <th>Description</th>
            <th>Status</th>
            <th>Site</th>
          </tr>
        </thead>
        <tbody>
          ${events
            .map(
              (e) => `
            <tr>
              <td>${new Date(e.timestamp).toLocaleString('fr-FR')}</td>
              <td><span class="badge badge-${e.severity}">${e.severity.toUpperCase()}</span></td>
              <td>${e.source}</td>
              <td>${e.description}</td>
              <td>${e.status}</td>
              <td>${e.site_id || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `

  exportToPDF('Security Events Report', statsHtml + tableHtml)
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export JSON data
 */
export function exportToJSON<T>(data: T, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, `${filename}.json`, 'application/json')
}

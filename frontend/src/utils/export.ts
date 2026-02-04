import { SecurityEvent } from '../types'
import html2pdf from 'html2pdf.js'

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
 * PDF report styles - improved for better readability
 */
const pdfStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 0;
    color: #1e293b;
    background: #ffffff;
    font-size: 11px;
    line-height: 1.5;
  }

  .report-container {
    padding: 32px;
  }

  /* Header Section */
  .report-header {
    background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
    color: white;
    padding: 28px 32px;
    margin: -32px -32px 28px -32px;
    border-radius: 0;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .logo-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }

  .header-title {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .header-subtitle {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 400;
  }

  .header-meta {
    text-align: right;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.8);
  }

  .header-meta-item {
    margin-bottom: 4px;
  }

  .header-meta-label {
    color: rgba(255, 255, 255, 0.5);
    margin-right: 6px;
  }

  /* Statistics Section */
  .stats-section {
    margin-bottom: 28px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
  }

  .stat-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    height: 90px;
    position: relative;
  }

  .stat-card-inner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
  }

  .stat-card-content {
    text-align: center;
  }

  .stat-card.total {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-color: #7dd3fc;
  }

  .stat-card.critical {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-color: #fca5a5;
  }

  .stat-card.high {
    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
    border-color: #fdba74;
  }

  .stat-card.medium {
    background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
    border-color: #fde047;
  }

  .stat-card.low {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border-color: #86efac;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 4px;
  }

  .stat-card.total .stat-value { color: #0284c7; }
  .stat-card.critical .stat-value { color: #dc2626; }
  .stat-card.high .stat-value { color: #ea580c; }
  .stat-card.medium .stat-value { color: #ca8a04; }
  .stat-card.low .stat-value { color: #16a34a; }

  .stat-label {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Events Table Section */
  .events-section {
    margin-bottom: 24px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e2e8f0;
  }

  .section-icon {
    width: 28px;
    height: 28px;
    background: #1e3a5f;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
  }

  .event-count {
    margin-left: auto;
    font-size: 11px;
    color: #64748b;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 12px;
  }

  /* Table Styling */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }

  thead {
    background: #1e3a5f;
  }

  th {
    padding: 12px 10px;
    text-align: left;
    font-weight: 600;
    color: white;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  th:first-child {
    padding-left: 14px;
  }

  td {
    padding: 12px 10px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
    color: #334155;
    height: 48px;
  }

  .cell-center {
    display: table;
    width: 100%;
    height: 100%;
  }

  .cell-center-inner {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
  }

  td:first-child {
    padding-left: 14px;
  }

  tbody tr:nth-child(even) {
    background: #f8fafc;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  /* Severity Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }

  .badge-critical {
    background: #dc2626;
    color: white;
    box-shadow: 0 1px 2px rgba(220, 38, 38, 0.3);
  }

  .badge-high {
    background: #ea580c;
    color: white;
    box-shadow: 0 1px 2px rgba(234, 88, 12, 0.3);
  }

  .badge-medium {
    background: #ca8a04;
    color: white;
    box-shadow: 0 1px 2px rgba(202, 138, 4, 0.3);
  }

  .badge-low {
    background: #16a34a;
    color: white;
    box-shadow: 0 1px 2px rgba(22, 163, 74, 0.3);
  }

  /* Status Badges */
  .status {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 500;
    text-transform: capitalize;
  }

  .status-new {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .status-investigating {
    background: #fef3c7;
    color: #b45309;
  }

  .status-resolved {
    background: #dcfce7;
    color: #15803d;
  }

  .status-false_positive {
    background: #f1f5f9;
    color: #64748b;
  }

  /* Source Tags */
  .source-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: #f1f5f9;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 500;
    color: #475569;
    text-transform: lowercase;
  }

  /* Site Column */
  .site-id {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 9px;
    color: #64748b;
    background: #f8fafc;
    padding: 2px 6px;
    border-radius: 3px;
  }

  /* Description Column */
  .description {
    max-width: 280px;
    line-height: 1.4;
    color: #334155;
  }

  /* Time Column */
  .timestamp {
    white-space: nowrap;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 9px;
    color: #64748b;
  }

  /* Footer */
  .report-footer {
    margin-top: 32px;
    padding-top: 20px;
    border-top: 2px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .footer-logo {
    font-weight: 700;
    font-size: 14px;
    color: #1e3a5f;
  }

  .footer-tagline {
    font-size: 10px;
    color: #64748b;
  }

  .footer-right {
    text-align: right;
  }

  .confidential {
    font-size: 10px;
    color: #dc2626;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .generated-info {
    font-size: 9px;
    color: #94a3b8;
  }

  /* Page break handling */
  @media print {
    .report-container {
      padding: 20px;
    }

    table {
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    thead {
      display: table-header-group;
    }
  }
`

/**
 * Generate PDF using html2pdf.js for direct download
 */
export async function exportToPDF(title: string, content: HTMLElement | string): Promise<void> {
  const htmlContent = typeof content === 'string' ? content : content.innerHTML

  // Create a temporary container
  const container = document.createElement('div')
  container.innerHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${pdfStyles}</style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <div class="header-content">
            <div class="header-left">
              <div class="logo-icon">🛡️</div>
              <div>
                <div class="header-title">AudioSOC Security Report</div>
                <div class="header-subtitle">Security Operations Center - AudioPro Network</div>
              </div>
            </div>
            <div class="header-meta">
              <div class="header-meta-item">
                <span class="header-meta-label">Report:</span>${title}
              </div>
              <div class="header-meta-item">
                <span class="header-meta-label">Generated:</span>${new Date().toLocaleString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
        ${htmlContent}
        <div class="report-footer">
          <div class="footer-left">
            <div class="footer-logo">🔒 AudioSOC</div>
            <div class="footer-tagline">Protecting AudioPro Network Centers</div>
          </div>
          <div class="footer-right">
            <div class="confidential">Confidential</div>
            <div class="generated-info">Internal Use Only • ${new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  // Append temporarily to DOM for rendering
  document.body.appendChild(container)

  // Configure html2pdf options
  const options = {
    margin: 0,
    filename: `audiosoc-report-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'landscape' as const
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const }
  }

  try {
    await html2pdf().set(options).from(container).save()
  } catch (error) {
    console.error('PDF generation failed:', error)
    alert('Failed to generate PDF. Please try again.')
  } finally {
    // Clean up
    document.body.removeChild(container)
  }
}

/**
 * Generate events report as PDF with improved styling
 */
export function exportEventsReport(
  events: SecurityEvent[],
  stats?: { total: number; critical: number; high: number; medium: number; low: number }
): void {
  const statsHtml = stats
    ? `
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-card-inner">
            <div class="stat-card-content">
              <div class="stat-value">${stats.total}</div>
              <div class="stat-label">Total Events</div>
            </div>
          </div>
        </div>
        <div class="stat-card critical">
          <div class="stat-card-inner">
            <div class="stat-card-content">
              <div class="stat-value">${stats.critical}</div>
              <div class="stat-label">Critical</div>
            </div>
          </div>
        </div>
        <div class="stat-card high">
          <div class="stat-card-inner">
            <div class="stat-card-content">
              <div class="stat-value">${stats.high}</div>
              <div class="stat-label">High</div>
            </div>
          </div>
        </div>
        <div class="stat-card medium">
          <div class="stat-card-inner">
            <div class="stat-card-content">
              <div class="stat-value">${stats.medium}</div>
              <div class="stat-label">Medium</div>
            </div>
          </div>
        </div>
        <div class="stat-card low">
          <div class="stat-card-inner">
            <div class="stat-card-content">
              <div class="stat-value">${stats.low}</div>
              <div class="stat-label">Low</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
    : ''

  const tableHtml = `
    <div class="events-section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <div class="section-title">Security Events</div>
        <div class="event-count">${events.length} events</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 130px;">Time</th>
            <th style="width: 80px; text-align: center;">Severity</th>
            <th style="width: 100px; text-align: center;">Source</th>
            <th>Description</th>
            <th style="width: 90px; text-align: center;">Status</th>
            <th style="width: 90px; text-align: center;">Site</th>
          </tr>
        </thead>
        <tbody>
          ${events
            .map(
              (e) => `
            <tr>
              <td><div class="cell-center"><div class="cell-center-inner" style="text-align: left;"><span class="timestamp">${new Date(e.timestamp).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}</span></div></div></td>
              <td><div class="cell-center"><div class="cell-center-inner"><span class="badge badge-${e.severity}">${e.severity}</span></div></div></td>
              <td><div class="cell-center"><div class="cell-center-inner"><span class="source-tag">${e.source}</span></div></div></td>
              <td><div class="cell-center"><div class="cell-center-inner" style="text-align: left;"><span class="description">${e.description}</span></div></div></td>
              <td><div class="cell-center"><div class="cell-center-inner"><span class="status status-${e.status}">${e.status.replace('_', ' ')}</span></div></div></td>
              <td><div class="cell-center"><div class="cell-center-inner"><span class="site-id">${e.site_id || '—'}</span></div></div></td>
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

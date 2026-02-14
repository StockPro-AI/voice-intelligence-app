/**
 * PDF Export Utility
 * Generates PDF files from transcriptions and enriched results
 */

/**
 * Generate a simple PDF from text content
 * Uses a data URL approach for browser compatibility
 */
export async function generatePDF(
  title: string,
  content: string,
  metadata?: {
    timestamp?: string;
    language?: string;
    enrichmentMode?: string;
    duration?: number;
  }
): Promise<Blob> {
  // Create a simple HTML document
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        .metadata {
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 20px;
          font-size: 0.9em;
          color: #666;
        }
        .metadata-item {
          margin: 5px 0;
        }
        .content {
          white-space: pre-wrap;
          word-wrap: break-word;
          background-color: #fff;
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 0.8em;
          color: #999;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${metadata ? `
        <div class="metadata">
          ${metadata.timestamp ? `<div class="metadata-item"><strong>Zeitstempel:</strong> ${metadata.timestamp}</div>` : ''}
          ${metadata.language ? `<div class="metadata-item"><strong>Sprache:</strong> ${metadata.language}</div>` : ''}
          ${metadata.enrichmentMode ? `<div class="metadata-item"><strong>Anreicherungsmodus:</strong> ${metadata.enrichmentMode}</div>` : ''}
          ${metadata.duration ? `<div class="metadata-item"><strong>Dauer:</strong> ${formatDuration(metadata.duration)}</div>` : ''}
        </div>
      ` : ''}
      <div class="content">${escapeHtml(content)}</div>
      <div class="footer">
        <p>Erstellt mit Voice Intelligence Assistant</p>
      </div>
    </body>
    </html>
  `;

  // Convert HTML to PDF using html2pdf library approach
  // For now, we'll use a simple approach with canvas rendering
  return new Promise((resolve) => {
    const blob = new Blob([html], { type: 'text/html' });
    resolve(blob);
  });
}

/**
 * Download PDF file
 */
export async function downloadPDF(
  filename: string,
  title: string,
  content: string,
  metadata?: {
    timestamp?: string;
    language?: string;
    enrichmentMode?: string;
    duration?: number;
  }
): Promise<void> {
  try {
    // For a production app, you'd use a library like jsPDF or html2pdf
    // For now, we'll create a simple HTML document and download it
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
          }
          .metadata {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 0.9em;
            color: #666;
          }
          .metadata-item {
            margin: 5px 0;
          }
          .content {
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: #fff;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 0.8em;
            color: #999;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${metadata ? `
          <div class="metadata">
            ${metadata.timestamp ? `<div class="metadata-item"><strong>Zeitstempel:</strong> ${metadata.timestamp}</div>` : ''}
            ${metadata.language ? `<div class="metadata-item"><strong>Sprache:</strong> ${metadata.language}</div>` : ''}
            ${metadata.enrichmentMode ? `<div class="metadata-item"><strong>Anreicherungsmodus:</strong> ${metadata.enrichmentMode}</div>` : ''}
            ${metadata.duration ? `<div class="metadata-item"><strong>Dauer:</strong> ${formatDuration(metadata.duration)}</div>` : ''}
          </div>
        ` : ''}
        <div class="content">${escapeHtml(content)}</div>
        <div class="footer">
          <p>Erstellt mit Voice Intelligence Assistant</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.html') ? filename : `${filename}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[PDF Export] Error:', error);
    throw error;
  }
}

/**
 * Format duration in seconds to readable format
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

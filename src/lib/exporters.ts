/**
 * Dependency-free export helpers. Everything runs in the browser — no backend.
 *  · csv    → real .csv
 *  · excel  → HTML table saved as .xls (Excel/Sheets open it natively)
 *  · word   → HTML saved as .doc
 *  · json   → raw data
 *  · pdf    → hands the rendered table to the browser's print dialog
 */

export type ExportFormat = 'csv' | 'excel' | 'word' | 'json' | 'pdf';

type Row = Record<string, string | number | boolean | null | undefined>;

function download(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function toTable(rows: Row[]): string {
  if (!rows.length) return '<table></table>';
  const cols = Object.keys(rows[0]);
  const head = cols.map((c) => `<th>${c}</th>`).join('');
  const body = rows
    .map((r) => `<tr>${cols.map((c) => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`)
    .join('');
  return `<table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function exportRows(name: string, rows: Row[], format: ExportFormat) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);

  switch (format) {
    case 'csv': {
      const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
      return download(`${name}.csv`, 'text/csv;charset=utf-8', csv);
    }
    case 'excel':
      return download(
        `${name}.xls`,
        'application/vnd.ms-excel',
        `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${toTable(rows)}</body></html>`
      );
    case 'word':
      return download(
        `${name}.doc`,
        'application/msword',
        `<html><head><meta charset="utf-8"></head><body><h2>${name}</h2>${toTable(rows)}</body></html>`
      );
    case 'json':
      return download(`${name}.json`, 'application/json', JSON.stringify(rows, null, 2));
    case 'pdf': {
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(
        `<html><head><title>${name}</title><style>
          body{font-family:system-ui,sans-serif;padding:24px;color:#111}
          h2{font-family:Georgia,serif}
          table{border-collapse:collapse;width:100%;font-size:12px}
          th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
          th{background:#f2f2f2;text-transform:uppercase;font-size:10px;letter-spacing:.05em}
        </style></head><body><h2>${name}</h2>${toTable(rows)}</body></html>`
      );
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 250);
      return;
    }
  }
}

/** Parse a pasted/uploaded CSV back into rows (import). */
export function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const cols = split(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = split(l);
    return cols.reduce((acc, c, i) => ({ ...acc, [c]: cells[i] ?? '' }), {} as Row);
  });
}

/**
 * Snapshot a DOM node to a PNG using SVG <foreignObject>. Inlines the computed
 * styles so the capture matches what's on screen.
 */
export async function snapshotToPng(node: HTMLElement, filename: string) {
  const rect = node.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);

  const clone = node.cloneNode(true) as HTMLElement;
  inlineStyles(node, clone);

  const bg = getComputedStyle(document.body).backgroundColor || '#ffffff';
  const html = new XMLSerializer().serializeToString(clone);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<rect width="100%" height="100%" fill="${bg}"/>` +
    `<foreignObject width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml">${html}</div>` +
    `</foreignObject></svg>`;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('snapshot failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });

  const scale = Math.min(2, window.devicePixelRatio || 1);
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas context');
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);

  const a = document.createElement('a');
  a.download = `${filename}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

/** Copy computed styles from the live tree onto the clone (foreignObject needs them inline). */
function inlineStyles(src: Element, dest: Element) {
  const cs = getComputedStyle(src);
  const keep = [
    'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'line-height',
    'letter-spacing', 'text-align', 'padding', 'margin', 'border', 'border-radius',
    'display', 'flex-direction', 'justify-content', 'align-items', 'gap', 'width', 'height',
    'grid-template-columns', 'box-sizing', 'text-transform', 'opacity',
  ];
  const style = keep.map((k) => `${k}:${cs.getPropertyValue(k)}`).join(';');
  (dest as HTMLElement).setAttribute('style', style);
  const s = Array.from(src.children);
  const d = Array.from(dest.children);
  s.forEach((child, i) => d[i] && inlineStyles(child, d[i]));
}

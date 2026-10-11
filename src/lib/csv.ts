/**
 * Rows of a CSV (RFC 4180: comma separator, quoted fields, `""` for a quote), keyed by the
 * header names. An empty body yields no rows.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const [header = [], ...lines] = rowsOf(text)
  return lines.map((fields) => Object.fromEntries(header.map((name, i) => [name, fields[i] ?? ''])))
}

function rowsOf(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c !== '"') field += c
      else if (text[i + 1] === '"') field += text[++i]
      else inQuotes = false
    } else if (c === '"') inQuotes = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  // Last line without a trailing newline.
  if (field !== '' || row.length > 0) rows.push([...row, field])
  return rows
}

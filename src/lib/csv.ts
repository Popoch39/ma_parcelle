/**
 * Lignes d'un CSV (RFC 4180 : séparateur virgule, champs entre guillemets, `""` pour un
 * guillemet), indexées par les noms de l'en-tête. Un corps vide ne donne aucune ligne.
 */
export function parseCsv(texte: string): Record<string, string>[] {
  const [entete = [], ...lignes] = rowsOf(texte)
  return lignes.map((champs) => Object.fromEntries(entete.map((nom, i) => [nom, champs[i] ?? ''])))
}

function rowsOf(texte: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let champ = ''
  let entreGuillemets = false
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i]
    if (entreGuillemets) {
      if (c !== '"') champ += c
      else if (texte[i + 1] === '"') champ += texte[++i]
      else entreGuillemets = false
    } else if (c === '"') entreGuillemets = true
    else if (c === ',') {
      row.push(champ)
      champ = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texte[i + 1] === '\n') i++
      row.push(champ)
      rows.push(row)
      row = []
      champ = ''
    } else champ += c
  }
  // Dernière ligne sans saut de ligne final.
  if (champ !== '' || row.length > 0) rows.push([...row, champ])
  return rows
}

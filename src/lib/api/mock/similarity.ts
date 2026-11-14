/** Trigram similarity, the same idea as PostgreSQL's pg_trgm `similarity()`: 0 = nothing shared, 1 = identical. */
function trigrams(text: string): Set<string> {
  const padded = `  ${text.toLowerCase().replace(/\s+/g, ' ').trim()} `
  const grams = new Set<string>()
  for (let i = 0; i < padded.length - 2; i++) grams.add(padded.slice(i, i + 3))
  return grams
}

export function similarity(a: string, b: string): number {
  const ga = trigrams(a)
  const gb = trigrams(b)
  let shared = 0
  for (const gram of ga) if (gb.has(gram)) shared++
  const union = ga.size + gb.size - shared
  return union === 0 ? 0 : shared / union
}

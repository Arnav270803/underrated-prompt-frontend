/**
 * A tiny syntax highlighter for sample-output code previews (TS/JS, Python, SQL).
 * Good enough for short snippets; not a full parser.
 */
export type TokenKind = 'kw' | 'fn' | 'type' | 'str' | 'num' | 'com' | 'plain'
export interface Token {
  kind: TokenKind
  text: string
}

type Family = 'ts' | 'py' | 'sql' | 'plain'

const KEYWORDS: Record<Exclude<Family, 'plain'>, Set<string>> = {
  ts: new Set(
    'export async function const let var await return if else for while import from new try catch throw type interface class extends implements default of in as typeof null undefined true false'.split(
      ' ',
    ),
  ),
  py: new Set(
    'def return if else elif for while import from as with try except raise class in not and or is None True False lambda yield pass continue break'.split(
      ' ',
    ),
  ),
  sql: new Set(
    'SELECT FROM WHERE ORDER BY LIMIT CREATE INDEX CONCURRENTLY ON DESC ASC JOIN LEFT INNER GROUP HAVING AND OR NOT NULL INSERT INTO VALUES UPDATE SET DELETE AS WITH EXPLAIN ANALYZE IN IS UNIQUE TABLE'.split(
      ' ',
    ),
  ),
}

const TYPES = new Set(
  'string number boolean void any unknown never Promise Record Array str int float bool dict list Path'.split(' '),
)

const COMMENT: Record<Family, string | null> = { ts: '//', py: '#', sql: '--', plain: null }

export function languageFamily(lang: string | null): Family {
  const l = (lang ?? '').toLowerCase()
  if (['ts', 'tsx', 'js', 'jsx', 'typescript', 'javascript', 'mjs'].includes(l)) return 'ts'
  if (['py', 'python'].includes(l)) return 'py'
  if (['sql', 'postgres', 'postgresql', 'psql'].includes(l)) return 'sql'
  return 'plain'
}

const TOKEN = /("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`(?:[^`\\]|\\.)*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([\s\S])/g

export function highlightLine(line: string, family: Family): Token[] {
  if (family === 'plain') return [{ kind: 'plain', text: line }]
  const tokens: Token[] = []
  const comment = COMMENT[family]
  TOKEN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TOKEN.exec(line))) {
    const start = match.index
    if (comment && line.startsWith(comment, start)) {
      tokens.push({ kind: 'com', text: line.slice(start) })
      break
    }
    const [text, str, num, word] = match
    if (str) tokens.push({ kind: 'str', text })
    else if (num) tokens.push({ kind: 'num', text })
    else if (word) {
      const isKeyword = family === 'sql' ? KEYWORDS.sql.has(word.toUpperCase()) : KEYWORDS[family].has(word)
      if (isKeyword) tokens.push({ kind: 'kw', text })
      else if (TYPES.has(word)) tokens.push({ kind: 'type', text })
      else if (/^\s*\(/.test(line.slice(TOKEN.lastIndex))) tokens.push({ kind: 'fn', text })
      else tokens.push({ kind: 'plain', text })
    } else tokens.push({ kind: 'plain', text })
  }
  return tokens
}

export const TOKEN_CLASS: Record<TokenKind, string> = {
  kw: 'text-[#e27ad7]',
  fn: 'text-[#e9c47e]',
  type: 'text-[#6cb6f5]',
  str: 'text-[#f0a35e]',
  num: 'text-[#f0a35e]',
  com: 'text-[#6b7079] italic',
  plain: 'text-[#e8e8e8]',
}

export const LANG_BADGE: Record<string, { label: string; className: string }> = {
  ts: { label: 'TS', className: 'bg-[#3178c6] text-white' },
  tsx: { label: 'TS', className: 'bg-[#3178c6] text-white' },
  js: { label: 'JS', className: 'bg-[#f7df1e] text-black' },
  jsx: { label: 'JS', className: 'bg-[#f7df1e] text-black' },
  py: { label: 'PY', className: 'bg-[#3572a5] text-[#ffd54a]' },
  python: { label: 'PY', className: 'bg-[#3572a5] text-[#ffd54a]' },
  sql: { label: 'SQL', className: 'bg-[#e38c00] text-black' },
}

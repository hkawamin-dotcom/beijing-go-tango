// data-src/hsk1.txt から src/data/hsk1.json を作る。
// ・手書きのピンイン（軽声・儿化を含む正しい読み）を pinyin-pro の独自辞書に登録し、
//   その辞書で例文のピンインと単語の数字ピンイン（ni3 hao3、軽声は 0）を生成する
// ・手書きと pinyin-pro 標準の読みが違う語は一覧を出す（人の目で確認するため）
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pinyin, customPinyin } from 'pinyin-pro'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'data-src/hsk1.txt')
const out = resolve(root, 'src/data/hsk1.json')

const compact = (s) => s.normalize('NFC').toLowerCase().replace(/[\s']/g, '')

/**
 * 手書きのピンイン（例 "duìbuqǐ"）を音節ごとに分ける（"duì bu qǐ"）。
 * pinyin-pro の音節の長さを目安に切り分け、儿化（nǎr）は前の音節にくっつける。
 */
function splitSyllables(hanzi, manual) {
  const auto = pinyin(hanzi, { type: 'array', toneType: 'symbol' })
  const chars = [...hanzi]
  const text = compact(manual)
  if (chars.length === 1) return text
  const result = []
  let pos = 0
  auto.forEach((syl, i) => {
    const rest = text.slice(pos)
    if (chars[i] === '儿' && rest.startsWith('r') && result.length) {
      result[result.length - 1] += 'r'
      pos += 1
      return
    }
    result.push(text.slice(pos, pos + syl.length))
    pos += syl.length
  })
  if (pos !== text.length) throw new Error(`「${hanzi}」のピンイン「${manual}」を音節に分けられません`)
  return result.join(' ')
}

/** 例文のピンインを読みやすく整える：句読点を半角に、空白を整理、文頭を大文字に */
function tidy(s) {
  const t = s
    .replace(/\s*，\s*/g, ', ')
    .replace(/\s*。\s*/g, '. ')
    .replace(/\s*？\s*/g, '? ')
    .replace(/\s*！\s*/g, '! ')
    .replace(/\s*、\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// 1. 原本を読む
const rows = []
const seen = new Set()
readFileSync(src, 'utf8')
  .split(/\r?\n/)
  .forEach((line, i) => {
    if (!line.trim() || line.startsWith('#')) return
    const cols = line.split('|').map((c) => c.trim())
    if (cols.length !== 8) throw new Error(`${i + 1}行目：列の数が8ではありません（${cols.length}列）→ ${line}`)
    const [hanzi, py, pos, ja, jaForm, caution, exZh, exJa] = cols
    if (!hanzi || !py || !ja || !exZh || !exJa) throw new Error(`${i + 1}行目：必須の列が空です → ${line}`)
    if (seen.has(hanzi)) throw new Error(`${i + 1}行目：「${hanzi}」が重複しています`)
    seen.add(hanzi)
    rows.push({ hanzi, py, pos, ja, jaForm, caution, exZh, exJa })
  })

// 2. 手書きの読みと標準の読みを比べ、独自辞書を作る
const dict = {}
const diffs = []
for (const r of rows) {
  const standard = pinyin(r.hanzi, { toneType: 'symbol' })
  const syllables = splitSyllables(r.hanzi, r.py)
  if (compact(standard) !== compact(r.py)) diffs.push(`  ${r.hanzi}：手書き「${r.py}」／標準「${standard}」`)
  // 1文字語は例文中の別の読み（例：了 liǎo）を壊さないよう、標準と違う場合だけ登録する
  if ([...r.hanzi].length > 1 || compact(standard) !== compact(r.py)) dict[r.hanzi] = syllables
}
customPinyin(dict)

// 3. 書き出す
const words = rows.map((r) => ({
  id: r.hanzi,
  hanzi: r.hanzi,
  pinyin: r.py,
  pinyinNum: pinyin(r.hanzi, { toneType: 'num' }).replace(/\s+/g, ' ').trim(),
  pos: r.pos,
  ja: r.ja,
  ...(r.jaForm && { jaForm: r.jaForm }),
  ...(r.caution && { caution: r.caution }),
  hsk: 1,
  example: {
    zh: r.exZh,
    pinyin: tidy(pinyin(r.exZh, { toneType: 'symbol', nonZh: 'consecutive' })),
    ja: r.exJa,
  },
}))

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(words, null, 2) + '\n')
console.log(`${words.length}語を書き出しました → src/data/hsk1.json`)
if (diffs.length) {
  console.log(`\n標準の読みと違う語（${diffs.length}件）：手書きを採用しました。軽声・儿化以外の違いがないか確認してください`)
  console.log(diffs.join('\n'))
}

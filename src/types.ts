export interface Word {
  id: string
  hanzi: string
  /** 声調記号つき（手書きの正しい読み） */
  pinyin: string
  /** 数字表記（軽声は 0）。声調練習などで使う */
  pinyinNum: string
  pos: string
  ja: string
  /** 日本の漢字の字形（簡体字と違う場合だけ） */
  jaForm?: string
  /** 日本語と意味がズレる語などの注意 */
  caution?: string
  hsk: number
  example: { zh: string; pinyin: string; ja: string }
}

/** 1単語ぶんの学習記録 */
export interface Progress {
  id: string
  /** 箱の番号。0＝覚えていない、数字が大きいほど復習の間隔が長い */
  box: number
  /** 次に出題する日時（ミリ秒） */
  due: number
  reviews: number
  lapses: number
  firstSeen: number
  lastReviewed: number
}

export type Answer = 'again' | 'know'

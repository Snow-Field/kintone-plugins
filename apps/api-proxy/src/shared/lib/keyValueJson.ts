/**
 * ヘッダーと本文の値（行の一覧）と、JSON の文字列の変換。kintone に依存しない
 * 設定画面では、どちらも JSON でまとめて入力する。保存の形は行の一覧のまま
 */
import type { DataItem, Header } from '@/shared/config/staticSchema';

export type ParseResult<T> = { ok: true; items: T[] } | { ok: false; message: string };

/** JSON.parse の reviver が受け取る、値の元の文字（対応していない環境では無い） */
type ReviverContext = { source?: string };

const EMPTY_JSON = '{\n  \n}';

/**
 * JSON の文字列を、キーと値の組の一覧にする（オブジェクトであることと、キーの形を確かめる）
 * 数値は、書いた文字を一緒に返す（読んだ時点で値が変わったかを確かめるため）
 */
const parseObject = (
  text: string
):
  | { ok: true; entries: [string, unknown][]; sources: Map<string, string> }
  | { ok: false; message: string } => {
  const sources = new Map<string, string>();
  let parsed: unknown;
  try {
    // 入れ子のオブジェクトはあとで拒否するので、キーだけで記録すれば足りる
    parsed = JSON.parse(text, (key, value, context?: ReviverContext) => {
      if (typeof value === 'number' && context?.source !== undefined)
        sources.set(key, context.source);
      return value;
    });
  } catch {
    return { ok: false, message: 'JSON として読めません。カンマや引用符を確かめてください' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, message: '{ "キー": 値 } の形（オブジェクト）で書いてください' };
  }
  const entries = Object.entries(parsed);
  for (const [key] of entries) {
    if (key.trim() === '') return { ok: false, message: '空のキーは使えません' };
    if (key !== key.trim()) return { ok: false, message: `「${key}」のキーの前後に空白があります` };
  }
  return { ok: true, entries, sources };
};

/** 同じキーの行の id を引き継ぐ（フォームの行を作り直さないため） */
const idFor = (current: { id: string; key: string }[], key: string, createId: () => string) =>
  current.find((item) => item.key === key)?.id ?? createId();

// -----------------------------------------------------------------------------
// ヘッダー
// -----------------------------------------------------------------------------

/** ヘッダーを JSON の文字列にする（ダイアログに出す） */
export const headersToJson = (headers: Header[]): string =>
  headers.length === 0
    ? EMPTY_JSON
    : JSON.stringify(Object.fromEntries(headers.map((h) => [h.key, h.value])), null, 2);

/** JSON の文字列をヘッダーにする。値は文字だけ */
export const jsonToHeaders = (
  text: string,
  current: Header[],
  createId: () => string
): ParseResult<Header> => {
  if (text.trim() === '') return { ok: true, items: [] };
  const parsed = parseObject(text);
  if (!parsed.ok) return parsed;

  const items: Header[] = [];
  for (const [key, value] of parsed.entries) {
    if (typeof value !== 'string') {
      return { ok: false, message: `「${key}」の値は "…" で囲んだ文字で書いてください` };
    }
    items.push({ id: idFor(current, key, createId), key, value });
  }
  return { ok: true, items };
};

/** ヘッダーの JSON に、キーを空の値で足す（すでにあれば何もしない）。JSON として読めなければ null */
export const addHeaderKey = (
  text: string,
  key: string
): { ok: true; text: string } | { ok: false; message: string } => {
  const parsed = text.trim() === '' ? { ok: true as const, entries: [] } : parseObject(text);
  if (!parsed.ok) return { ok: false, message: `追加できません: ${parsed.message}` };
  if (parsed.entries.some(([k]) => k.toLowerCase() === key.toLowerCase())) {
    return { ok: false, message: `${key} はすでにあります` };
  }
  return {
    ok: true,
    text: JSON.stringify(Object.fromEntries([...parsed.entries, [key, '']]), null, 2),
  };
};

/**
 * 同じキーが2つ以上ある行のキー（インポートした設定などで起こりうる）
 * JSON にすると最後の値だけが残るので、ダイアログを開くときに知らせる
 */
export const duplicatedKeys = (items: { key: string }[]): string[] => [
  ...new Set(items.map((i) => i.key).filter((key, i, all) => all.indexOf(key) !== i)),
];

// -----------------------------------------------------------------------------
// 本文の値
// -----------------------------------------------------------------------------

/**
 * 本文の値を JSON の文字列にする（ダイアログに出す）
 * 値が空の数値・真偽の行（インポートした直後や、保存済みの値を読めなかったとき）は null にする。
 * 0 や false に見せると、そのまま保存されてしまうため（null は反映するときに理由を示して拒否する）
 */
export const dataToJson = (items: DataItem[]): string => {
  if (items.length === 0) return EMPTY_JSON;
  const object = Object.fromEntries(
    items.map(({ key, value, type }) => {
      if (type !== 'string' && value === '') return [key, null];
      if (type === 'number') return [key, Number(value)];
      if (type === 'boolean') return [key, value === 'true'];
      return [key, value];
    })
  );
  return JSON.stringify(object, null, 2);
};

/** JSON の文字列を本文の値にする。種類（文字・数値・真偽）は JSON の値から決める */
export const jsonToData = (
  text: string,
  current: DataItem[],
  createId: () => string
): ParseResult<DataItem> => {
  if (text.trim() === '') return { ok: true, items: [] };
  const parsed = parseObject(text);
  if (!parsed.ok) return parsed;

  const items: DataItem[] = [];
  for (const [key, value] of parsed.entries) {
    const id = idFor(current, key, createId);
    if (typeof value === 'string') {
      items.push({ id, key, value, type: 'string' });
    } else if (typeof value === 'number') {
      const source = parsed.sources.get(key);
      const changed =
        !Number.isFinite(value) ||
        (Number.isInteger(value) && !Number.isSafeInteger(value)) ||
        (source !== undefined && source !== String(value));
      if (changed) {
        return {
          ok: false,
          message: `「${key}」の数値は、そのままでは保存できません（大きすぎる・細かすぎる・1e3 のような書き方など）。"…" で囲んで文字として書くか、${String(value)} のように書いてください`,
        };
      }
      items.push({ id, key, value: String(value), type: 'number' });
    } else if (typeof value === 'boolean') {
      items.push({ id, key, value: String(value), type: 'boolean' });
    } else if (value === null) {
      return { ok: false, message: `「${key}」の値を入れてください（null は使えません）` };
    } else {
      return {
        ok: false,
        message: `「${key}」の値は、文字・数値・true / false のどれかにしてください（オブジェクトと配列は使えません）`,
      };
    }
  }
  return { ok: true, items };
};

/**
 * 本文の値（DataItem[]）と JSON の文字列の変換。kintone に依存しない
 * 設定画面では、本文の値を JSON でまとめて入力する。保存の形は DataItem[] のまま
 */
import type { DataItem } from '@/shared/config/staticSchema';

/**
 * 本文の値を JSON の文字列にする（ダイアログに出す）
 * 値が空の行（インポートした直後や、保存済みの値を読めなかったとき）は null にする。
 * 数値の 0 や false に見せると、そのまま保存されてしまうため（null は反映するときに理由を示して拒否する）
 */
export const dataToJson = (items: DataItem[]): string => {
  if (items.length === 0) return '{\n  \n}';
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

export type ParseDataResult = { ok: true; items: DataItem[] } | { ok: false; message: string };

/** JSON.parse の reviver が受け取る、値の元の文字（対応していない環境では無い） */
type ReviverContext = { source?: string };

/**
 * JSON の文字列を本文の値にする。種類は JSON の値から決める
 * 同じキーの行の id は引き継ぐ（フォームの行を作り直さないため）
 */
export const jsonToData = (
  text: string,
  current: DataItem[],
  createId: () => string
): ParseDataResult => {
  if (text.trim() === '') return { ok: true, items: [] };

  // 書いた数値の文字と、読んだ値を比べるため、元の文字を取っておく（大きな整数や細かすぎる小数は値が変わる）
  const numberSources = new Map<string, string>();
  let parsed: unknown;
  try {
    // 入れ子のオブジェクトはあとで拒否するので、キーだけで記録すれば足りる
    parsed = JSON.parse(text, (key, value, context?: ReviverContext) => {
      if (typeof value === 'number' && context?.source !== undefined) {
        numberSources.set(key, context.source);
      }
      return value;
    });
  } catch {
    return { ok: false, message: 'JSON として読めません。カンマや引用符を確かめてください' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, message: '{ "キー": 値 } の形（オブジェクト）で書いてください' };
  }

  const items: DataItem[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (key.trim() === '') return { ok: false, message: '空のキーは使えません' };
    if (key !== key.trim()) {
      return { ok: false, message: `「${key}」のキーの前後に空白があります` };
    }
    const id = current.find((item) => item.key === key)?.id ?? createId();
    if (typeof value === 'string') {
      items.push({ id, key, value, type: 'string' });
    } else if (typeof value === 'number') {
      const source = numberSources.get(key);
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

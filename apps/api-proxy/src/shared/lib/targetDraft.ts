/**
 * 接続先の編集ダイアログの入力（下書き）と、接続先の変換。kintone に依存しない
 * ダイアログでは、ヘッダーとデータを JSON の文字で編集し、「保存」で接続先に戻す
 */
import type { ProxyMethod, Target } from '@/shared/config/staticSchema';
import {
  dataToJson,
  duplicatedKeys,
  headersToJson,
  jsonToData,
  jsonToHeaders,
} from './keyValueJson';
import { validateTargets } from './targets';

export type TargetDraft = {
  url: string;
  methods: ProxyMethod[];
  headersText: string;
  dataText: string;
  memo: string;
};

export type DraftField = keyof TargetDraft;

/** 接続先を下書きにする。ヘッダーとデータが無ければ、JSON の欄は空にする（見本を出すため） */
export const toDraft = (target: Target): TargetDraft => ({
  url: target.url,
  methods: target.methods,
  headersText: target.headers.length === 0 ? '' : headersToJson(target.headers),
  dataText: target.data.length === 0 ? '' : dataToJson(target.data),
  memo: target.memo,
});

/**
 * 下書きを開くときの注意。同じキーの行が複数あると、JSON では最後の値だけが残る
 * （インポートした設定などで起こりうる）
 */
export const draftWarning = (target: Target): string | undefined => {
  const keys = [...duplicatedKeys(target.headers), ...duplicatedKeys(target.data)];
  return keys.length === 0
    ? undefined
    : `同じキー（${keys.join(', ')}）が複数ありました。最後の値だけを出しています。保存すると、ほかの値は消えます。`;
};

export type FromDraftResult =
  | { ok: true; target: Target }
  | { ok: false; errors: Partial<Record<DraftField, string>> };

/** 検証の項目（targets.N.〇〇）を、ダイアログの欄に割り当てる */
const fieldOf = (segment: string | number | undefined): DraftField => {
  if (segment === 'methods') return 'methods';
  if (segment === 'headers') return 'headersText';
  if (segment === 'data') return 'dataText';
  if (segment === 'memo') return 'memo';
  return 'url';
};

/**
 * 下書きを接続先に戻し、ほかの接続先と合わせて検証する
 * @param base 編集前の接続先（id と、行の id の引き継ぎに使う）
 * @param others 編集中の接続先を除いた一覧
 * @param index 編集中の接続先の位置（others のこの位置に入る）
 */
export const fromDraft = (
  draft: TargetDraft,
  base: Target,
  others: Target[],
  index: number,
  createId: () => string
): FromDraftResult => {
  const errors: Partial<Record<DraftField, string>> = {};
  const headers = jsonToHeaders(draft.headersText, base.headers, createId);
  if (!headers.ok) errors.headersText = headers.message;
  const data = jsonToData(draft.dataText, base.data, createId);
  if (!data.ok) errors.dataText = data.message;
  if (!headers.ok || !data.ok) return { ok: false, errors };

  const target: Target = {
    ...base,
    url: draft.url,
    methods: draft.methods,
    headers: headers.items,
    data: data.items,
    memo: draft.memo,
  };
  const all = [...others.slice(0, index), target, ...others.slice(index)];

  for (const { path, message } of validateTargets(all)) {
    if (path[1] !== index) continue;
    const field = fieldOf(path[2]);
    // ヘッダーとデータは JSON の欄が1つなので、どのキーの誤りかを添える
    const row = typeof path[3] === 'number' ? path[3] : undefined;
    const items = field === 'headersText' ? target.headers : target.data;
    const detail =
      row !== undefined && (field === 'headersText' || field === 'dataText')
        ? `${items[row]?.key || `${row + 1}番目`}: ${message}`
        : message;
    errors[field] ??= detail;
  }

  // validateTargets は重なった組の「後の行」だけに誤りを付けるので、編集中の行が上にあると見落とす。
  // 編集中の行とほかの行を、上下どちらの向きでも比べる
  const url = target.url.trim();
  all.forEach((other, j) => {
    if (j === index || errors.methods || !target.enabled || !other.enabled) return;
    if (other.url.trim() !== url) return;
    const method = target.methods.find((m) => other.methods.includes(m));
    if (method) errors.methods = `${j + 1}番目の接続先と、URL と ${method} の組が重なっています`;
  });
  return Object.keys(errors).length === 0 ? { ok: true, target } : { ok: false, errors };
};

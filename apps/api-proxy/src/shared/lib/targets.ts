/**
 * 接続先（Target）とプロキシ設定の変換・検証。kintone に依存しない
 */
import type { ProxyEntry, ProxySettingsReader } from '@kintone-plugin/kintone-utils';
import type { DataItem, Target } from '@/shared/config/staticSchema';

/** kintone の API トークンのヘッダー名 */
export const API_TOKEN_HEADER = 'X-Cybozu-API-Token';

/** 1回のリクエストで指定できる API トークンの数（kintone の仕様） */
export const MAX_API_TOKENS = 9;

/** kintone REST API の URL（ゲストスペースなら /k/guest/{ID}/v1/） */
export const kintoneApiBaseUrl = (origin: string, guestSpaceId?: string): string =>
  guestSpaceId ? `${origin}/k/guest/${guestSpaceId}/v1/` : `${origin}/k/v1/`;

/** ヘッダーのキーが API トークンか（HTTP のヘッダー名は大文字小文字を区別しない） */
export const isApiTokenHeader = (key: string): boolean =>
  key.trim().toLowerCase() === API_TOKEN_HEADER.toLowerCase();

/** HTTP のヘッダー名に使える文字（RFC 9110 の token） */
const HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

/** ヘッダーの値に使えない文字（改行などの制御文字）。混ざると、保存か呼び出しが失敗する */
// biome-ignore lint/suspicious/noControlCharactersInRegex: 制御文字を見つけるための正規表現
const HEADER_VALUE_FORBIDDEN = /[\u0000-\u0008\u000a-\u001f\u007f]/;

/**
 * 入力どおりの数値として保存できるか。数値に変えて文字に戻したときに同じになるものだけを受け付ける
 * （大きな整数・0x10・1e3・1.50 などは、保存すると別の表記や値になるため）
 */
const isPlainNumber = (value: string): boolean => {
  const trimmed = value.trim();
  // 'Infinity' も文字に戻すと同じになるので、有限かどうかも見る
  return trimmed !== '' && Number.isFinite(Number(trimmed)) && String(Number(trimmed)) === trimmed;
};

/** 大文字小文字を区別せずにキーで探す（HTTP のヘッダー名は区別しないため） */
const findHeader = (headers: Record<string, string>, key: string): string | undefined => {
  const exact = headers[key];
  if (exact !== undefined) return exact;
  const lower = key.toLowerCase();
  const found = Object.keys(headers).find((k) => k.toLowerCase() === lower);
  return found === undefined ? undefined : headers[found];
};

/** カンマ区切りのトークンの数（空の要素は数えない） */
export const countApiTokens = (value: string): number =>
  value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean).length;

/** 本文の値を種類に合わせて変換する（setProxyConfig の data の値にオブジェクトは使えない） */
const toDataValue = ({ type, value }: DataItem): string | number | boolean => {
  if (type === 'number') return Number(value);
  if (type === 'boolean') return value === 'true';
  return value;
};

/**
 * 接続先からプロキシ設定の組を作る。選んだメソッドごとに1件
 * ヘッダーの値は前後の空白を除く（貼り付けたときに空白や改行が混ざりやすいため）
 */
export const toProxyEntries = (targets: Target[]): ProxyEntry[] =>
  targets.flatMap((target) => {
    const url = target.url.trim();
    const headers = Object.fromEntries(target.headers.map((h) => [h.key.trim(), h.value.trim()]));
    const data = Object.fromEntries(target.data.map((d) => [d.key.trim(), toDataValue(d)]));
    return target.methods.map((method) => ({ url, method, headers, data }));
  });

/** 秘密（ヘッダーと本文の値）を空にした形（setConfig とエクスポートに入れる） */
export const stripTargets = (targets: Target[]): Target[] =>
  targets.map((target) => ({
    ...target,
    headers: target.headers.map((h) => ({ ...h, value: '' })),
    data: target.data.map((d) => ({ ...d, value: '' })),
  }));

/**
 * 保存済みのプロキシ設定から、ヘッダーと本文の値を戻す
 * どのメソッドにも同じ値を保存するので、最初のメソッドの組を読む。キーが見つからない値はそのまま残す
 */
export const fillTargets = (targets: Target[], read: ProxySettingsReader): Target[] =>
  targets.map((target) => {
    const [method] = target.methods;
    if (!method) return target;
    const saved = read({ url: target.url.trim(), method });
    if (!saved) return target;
    return {
      ...target,
      headers: target.headers.map((h) => {
        // getProxyConfig がヘッダー名の大文字小文字を保つかは確かめていないので、区別せずに探す
        const value = findHeader(saved.headers, h.key.trim());
        return value === undefined ? h : { ...h, value: String(value) };
      }),
      data: target.data.map((d) => {
        const value = saved.data[d.key.trim()];
        return value === undefined ? d : { ...d, value: String(value) };
      }),
    };
  });

/** 検証の結果。path はフォームの項目（例: ['targets', 0, 'url']） */
export type TargetIssue = { path: (string | number)[]; message: string };

const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * キーの検証（空と、1つの行の中での重複）
 * ヘッダー名は大文字小文字を区別しないので、ヘッダーは区別せずに重複を見る
 */
const keyIssues = (
  items: { key: string }[],
  basePath: (string | number)[],
  label: string,
  { caseInsensitive = false } = {}
): TargetIssue[] => {
  const normalize = (key: string) => (caseInsensitive ? key.trim().toLowerCase() : key.trim());
  return items.flatMap(({ key }, i) => {
    const normalized = normalize(key);
    if (!normalized)
      return [{ path: [...basePath, i, 'key'], message: `${label}のキーを入力してください` }];
    const first = items.findIndex((other) => normalize(other.key) === normalized);
    return first !== i
      ? [{ path: [...basePath, i, 'key'], message: `${label}のキーが重複しています` }]
      : [];
  });
};

/** 入力の検証。保存する前（フォーム）に行う */
export const validateTargets = (targets: Target[]): TargetIssue[] => {
  const issues: TargetIssue[] = [];
  /** 「URL メソッド」→ 最初に使った行の番号 */
  const seen = new Map<string, number>();

  targets.forEach((target, t) => {
    const base = ['targets', t];
    const url = target.url.trim();
    if (!url) issues.push({ path: [...base, 'url'], message: 'URL を入力してください' });
    else if (!isHttpUrl(url)) {
      issues.push({
        path: [...base, 'url'],
        message: 'URL は http:// か https:// で始めてください',
      });
    }

    if (target.methods.length === 0) {
      issues.push({ path: [...base, 'methods'], message: 'メソッドを1つ以上選んでください' });
    }
    // URL が空か不正なときは、重なりを見ない（「URL を入力してください」と重なって紛らわしいため）
    for (const method of isHttpUrl(url) ? target.methods : []) {
      const key = `${url} ${method}`;
      const first = seen.get(key);
      if (first === undefined) seen.set(key, t);
      else {
        issues.push({
          path: [...base, 'methods'],
          message: `${first + 1}番目の接続先と、URL と ${method} の組が重なっています`,
        });
      }
    }

    issues.push(
      ...keyIssues(target.headers, [...base, 'headers'], 'ヘッダー', { caseInsensitive: true })
    );
    target.headers.forEach((h, i) => {
      const key = h.key.trim();
      if (key && !HEADER_NAME_PATTERN.test(key)) {
        issues.push({
          path: [...base, 'headers', i, 'key'],
          message: 'ヘッダーのキーに使えない文字（空白など）が含まれています',
        });
      }
      const path = [...base, 'headers', i, 'value'];
      const value = h.value.trim();
      if (!value) issues.push({ path, message: 'ヘッダーの値を入力してください' });
      else if (HEADER_VALUE_FORBIDDEN.test(value)) {
        issues.push({ path, message: 'ヘッダーの値に改行などの制御文字は使えません' });
      } else if (isApiTokenHeader(h.key) && countApiTokens(h.value) > MAX_API_TOKENS) {
        issues.push({ path, message: `API トークンは${MAX_API_TOKENS}個までです` });
      }
    });

    issues.push(...keyIssues(target.data, [...base, 'data'], '本文'));
    target.data.forEach((d, i) => {
      const path = [...base, 'data', i, 'value'];
      if (d.type === 'number' && !isPlainNumber(d.value)) {
        issues.push({
          path,
          message: '10進数の数値を入力してください（大きすぎる整数は、文字として保存してください）',
        });
      }
      if (d.type === 'boolean' && d.value !== 'true' && d.value !== 'false') {
        issues.push({ path, message: 'true か false を選んでください' });
      }
    });
  });

  return issues;
};

/**
 * 前方一致が重なる接続先（同じメソッドで、一方の URL がもう一方の URL で始まる）
 * kintone は長く一致した設定の値を優先する。エラーにはせず、画面で知らせる
 */
export const overlappingTargets = (targets: Target[]): [number, number][] => {
  const pairs: [number, number][] = [];
  targets.forEach((a, i) => {
    targets.forEach((b, j) => {
      if (i >= j) return;
      const ua = a.url.trim();
      const ub = b.url.trim();
      if (!ua || !ub || ua === ub) return;
      if (!(ua.startsWith(ub) || ub.startsWith(ua))) return;
      if (a.methods.some((m) => b.methods.includes(m))) pairs.push([i, j]);
    });
  });
  return pairs;
};

/** 呼び出しの例（使い方タブに出す）。文字列は JSON.stringify で作る（URL に ' などが入っても正しい JS にするため） */
export const callExample = (pluginId: string, target: Target): string => {
  const method = target.methods[0] ?? 'GET';
  const body = method === 'GET' || method === 'DELETE' ? '{}' : '{ /* 本文 */ }';
  return [
    `const [body, status] = await kintone.plugin.app.proxy(`,
    `  ${JSON.stringify(pluginId)},`,
    `  ${JSON.stringify(target.url.trim())} /* + 続きのパスやクエリ */,`,
    `  ${JSON.stringify(method)},`,
    `  {},`,
    `  ${body}`,
    `);`,
    `// proxy は 4xx・5xx でも失敗にならないので、ステータスを確かめる`,
    `if (status < 200 || status >= 300) throw new Error(body);`,
  ].join('\n');
};

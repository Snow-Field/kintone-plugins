/**
 * kintone REST API の呼び出しに使う、kintone に依存しない処理
 */

/** GET の値。配列は `fields[0]=a&fields[1]=b` の形にする（kintone REST API の書き方） */
export type QueryParams = Record<string, string | number | readonly string[] | undefined>;

/** GET のパラメーターをクエリ文字列にする（先頭の ? は付けない） */
export const toQueryString = (params: QueryParams): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        search.append(`${key}[${i}]`, v);
      });
    } else {
      search.append(key, String(value));
    }
  }
  return search.toString();
};

/** kintone REST API の失敗を表す */
export class KintoneApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string
  ) {
    super(message);
    this.name = 'KintoneApiError';
  }
}

/**
 * proxy の応答を読む。200 以外は、kintone のエラーの本文（code・message）を使って失敗にする
 */
export const parseProxyResponse = <T>(status: number, body: string): T => {
  if (status === 200) {
    try {
      return JSON.parse(body) as T;
    } catch {
      throw new KintoneApiError(
        status,
        undefined,
        `kintone REST API の応答を JSON として読めませんでした: ${body.slice(0, 200)}`
      );
    }
  }

  let code: string | undefined;
  let detail = body.slice(0, 200);
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === 'object' && parsed !== null) {
      const { code: c, message: m } = parsed as { code?: unknown; message?: unknown };
      if (typeof c === 'string') code = c;
      if (typeof m === 'string') detail = m;
    }
  } catch {
    // JSON でない本文は、先頭だけをそのまま出す
  }
  throw new KintoneApiError(
    status,
    code,
    `kintone REST API の呼び出しに失敗しました（${status}${code ? ` ${code}` : ''}）: ${detail}`
  );
};

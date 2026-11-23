import { describe, expect, it } from 'vitest';
import { KintoneApiError, parseProxyResponse, toQueryString } from './request';

describe('toQueryString', () => {
  it('配列は添字を付けて並べ、値はエンコードする', () => {
    expect(toQueryString({ app: 1, query: 'a = "x" limit 1', fields: ['番号', 'b'] })).toBe(
      `app=1&query=${new URLSearchParams({ q: 'a = "x" limit 1' }).toString().slice(2)}` +
        `&${encodeURIComponent('fields[0]')}=${encodeURIComponent('番号')}&${encodeURIComponent('fields[1]')}=b`
    );
  });

  it('undefined の値は含めない', () => {
    expect(toQueryString({ app: 1, id: undefined })).toBe('app=1');
  });
});

describe('parseProxyResponse', () => {
  it('200 なら本文を JSON として返す', () => {
    expect(parseProxyResponse(200, '{"revision":"15"}')).toEqual({ revision: '15' });
  });

  it('200 でも本文が JSON でなければ、本文の先頭を添えて失敗にする', () => {
    expect(() => parseProxyResponse(200, '<html>ログイン</html>')).toThrow(
      'JSON として読めませんでした: <html>ログイン</html>'
    );
  });

  it('200 以外は、kintone のエラーのコードとメッセージで失敗にする', () => {
    const run = () =>
      parseProxyResponse(400, '{"code":"GAIA_IA02","id":"x","message":"トークンが違います"}');
    expect(run).toThrow(KintoneApiError);
    expect(run).toThrow('（400 GAIA_IA02）: トークンが違います');
  });

  it('本文が JSON でなくても、ステータスと本文の先頭で失敗にする', () => {
    expect(() => parseProxyResponse(503, 'DNS Cache Missing')).toThrow(
      '（503）: DNS Cache Missing'
    );
  });
});

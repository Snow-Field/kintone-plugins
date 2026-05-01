/**
 * 採番エンジン（コアロジック）
 */

import type { KintoneAPI, KintoneEvent } from '../types/kintone';
import type { NumberingSettings } from '../types/numbering';
import { fetchRecordWithRevision, updateRecord, checkDuplicate } from '../services/recordService';
import {
  resolveFormatParts,
  buildFormatString,
  buildNumberingValue,
} from '../services/formatService';
import { resolveNextSerial } from '../services/serialService';
import { createApiHeader } from '../utils/kintoneProxy';
import { padZero } from '../utils/string';

/**
 * 採番処理のメインロジック
 */
export async function executeNumbering(
  event: KintoneEvent,
  settings: NumberingSettings,
  api: KintoneAPI = kintone as unknown as KintoneAPI
): Promise<void> {
  const { appId, recordId, record } = event;
  const { resultFieldCode, apiToken, formatParts, connector, serialConfig, maxRetryCount } =
    settings;
  const { digit, position } = serialConfig;

  try {
    // 採番済みチェック
    if (record[resultFieldCode]?.value) return;

    // リビジョン取得（競合制御のため）
    const { revision } = await fetchRecordWithRevision(appId, recordId, apiToken, api);

    // 各パーツの値を解決
    const resolvedParts = resolveFormatParts(formatParts, record);

    // 連番を除いた文字列を構築
    const formatString = buildFormatString(resolvedParts, connector);

    // 次の連番を取得（既存値のキャッシュも取得）
    const { nextSerial, existingValues } = await resolveNextSerial(
      {
        appId,
        apiToken,
        resultFieldCode,
        serialConfig,
        formatString,
        connector,
      },
      api
    );

    // ヘッダー作成
    const header = createApiHeader(apiToken);

    // 重複回避ループ
    let retryCount = 0;
    let currentSerial = nextSerial;

    while (retryCount < maxRetryCount) {
      // 連番をゼロパディング
      const serialString = padZero(currentSerial, digit);

      // 最終文字列を組み立て
      const numberingValue = buildNumberingValue(formatString, serialString, position, connector);

      // 重複チェック（キャッシュ対応）
      const isDuplicate = await checkDuplicate(
        appId,
        resultFieldCode,
        numberingValue,
        existingValues,
        apiToken,
        api
      );

      if (isDuplicate) {
        currentSerial++;
        retryCount++;
        continue;
      }

      // レコードを更新（リビジョンチェック付き）
      await updateRecord({
        appId,
        recordId,
        resultFieldCode,
        numberingValue,
        serialConfig,
        currentSerial,
        header,
        revision,
        api,
      });

      return; // 成功
    }

    // 最大リトライ回数に達した
    throw new Error(`最大リトライ回数（${maxRetryCount}）に達しました`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    console.error('採番処理に失敗しました:', error);
    alert(`採番処理に失敗しました: ${errorMessage}`);
    throw error;
  }
}

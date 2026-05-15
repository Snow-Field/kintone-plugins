import { type NumberingSetting } from '@/shared/config';
import type { KintoneEvent } from '@/shared/types/kintone';
import { DEFAULT_RETRY_COUNT } from '@/shared/constant/numbering';
import { fetchRecordWithRevision, updateRecord, checkDuplicate } from '../services/recordService';
import {
  resolveFormatParts,
  buildFormatString,
  buildNumberingValue,
} from '../services/formatService';
import { resolveNextSerial } from '../services/serialService';
import { padZero } from '../utils/string';

/**
 * 採番処理のメインロジック
 */
export async function executeNumbering(
  event: KintoneEvent,
  numberingSetting: NumberingSetting,
  apiToken?: string
): Promise<void> {
  const { appId, recordId, record } = event;
  const { resultFieldCode, formatParts, connector, serialConfig } = numberingSetting;
  const { digit, position } = serialConfig;

  try {
    // 採番済みチェック
    if (record[resultFieldCode]?.value) return;

    // リビジョン取得
    const { revision } = await fetchRecordWithRevision(appId, recordId, apiToken);

    // 各パーツの値を解決
    const resolvedParts = resolveFormatParts(formatParts, record);

    // 連番を除いた文字列を構築
    const formatString = buildFormatString(resolvedParts, connector);

    // 次の連番を取得（既存値のキャッシュも取得）
    const { nextSerial, existingValues } = await resolveNextSerial({
      appId,
      apiToken,
      resultFieldCode,
      serialConfig,
      formatString,
      connector,
    });

    // 重複回避ループ
    let retryCount = 0;
    let currentSerial = nextSerial;

    while (retryCount < DEFAULT_RETRY_COUNT) {
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
        apiToken
      );

      if (isDuplicate) {
        currentSerial++;
        retryCount++;
        continue;
      }

      // レコードを更新
      await updateRecord({
        appId,
        recordId,
        resultFieldCode,
        numberingValue,
        serialConfig,
        currentSerial,
        revision,
        apiToken,
      });

      return;
    }

    // 最大リトライ回数に達した
    throw new Error(`最大リトライ回数（${DEFAULT_RETRY_COUNT}）に達しました`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    console.error('採番処理に失敗しました:', error);
    alert(`採番処理に失敗しました: ${errorMessage}`);
    throw error;
  }
}

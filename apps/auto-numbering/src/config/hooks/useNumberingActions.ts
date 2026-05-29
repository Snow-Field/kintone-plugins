import { nanoid } from 'nanoid';
import { type NumberingSetting } from '@/shared/config';
import { RESET_TIMING, CONNECTORS } from '@/shared/constant/numbering';

/** 新しい採番設定のデフォルト値を生成 */
export function createDefaultNumberingSetting(): NumberingSetting {
  return {
    id: nanoid(),
    label: '',
    enabled: true,
    resultFieldCode: '',
    formatParts: [
      {
        type: 'text',
        value: '',
      },
    ],
    connector: CONNECTORS.HYPHEN,
    serialConfig: {
      initialValue: 1,
      digit: 5,
      position: 'suffix',
      resetTiming: RESET_TIMING.NONE,
      serialFieldCode: '',
    },
  };
}

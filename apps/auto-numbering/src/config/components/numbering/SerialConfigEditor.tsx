import { type FC, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Box, FormHelperText } from '@mui/material';
import { FieldSelect } from '@kintone-plugin/plugin-shell';
import { FormNumberField, FormSelect } from '@kintone-plugin/ui';
import type { PluginConfig } from '@/shared/config';
import { DATE_FORMATS, RESET_TIMING } from '@/shared/config/constants';

/** 連番を保存できるフィールドの種類 */
const SERIAL_FIELD_TYPES = ['NUMBER'] as const;

/** リセットのタイミングの選択肢 */
const RESET_TIMING_OPTIONS = [
  { value: RESET_TIMING.NONE, label: 'なし（全期間で連番）' },
  { value: RESET_TIMING.YEARLY, label: '年次リセット' },
  { value: RESET_TIMING.MONTHLY, label: '月次リセット' },
  { value: RESET_TIMING.DAILY, label: '日次リセット' },
] as const;

/** 連番の位置の選択肢 */
const POSITION_OPTIONS = [
  { value: 'prefix', label: '先頭' },
  { value: 'suffix', label: '末尾' },
] as const;

const DAILY_FORMATS = new Set<string>([DATE_FORMATS.YYYYMMDD, DATE_FORMATS.YYMMDD]);
const MONTHLY_FORMATS = new Set<string>([DATE_FORMATS.YYYYMM, DATE_FORMATS.YYMM]);
const YEARLY_FORMATS = new Set<string>([DATE_FORMATS.YYYY, DATE_FORMATS.YY]);

type Props = {
  settingIndex: number;
};

/**
 * 連番設定を編集するコンポーネント
 */
export const SerialConfigEditor: FC<Props> = ({ settingIndex }) => {
  const { control, setValue } = useFormContext<PluginConfig>();
  const settingPath = `numberingSettings.${settingIndex}` as const;
  const serialPath = `${settingPath}.serialConfig` as const;

  const resetTiming = useWatch({ control, name: `${serialPath}.resetTiming` });
  // 設定の削除やインポートの直後に、一瞬 undefined になることがある
  const formatParts = useWatch({ control, name: `${settingPath}.formatParts` }) ?? [];
  const hasFormatParts = formatParts.length > 0;

  // 書式のパーツに含まれる日付の細かさで、選べるリセットのタイミングを決める
  const availableResetTimings = useMemo(() => {
    const dateFormats = formatParts.flatMap((part) =>
      part.type === 'date' && part.format ? [part.format] : []
    );
    const hasDaily = dateFormats.some((f) => DAILY_FORMATS.has(f));
    const hasMonthly = hasDaily || dateFormats.some((f) => MONTHLY_FORMATS.has(f));
    const hasYearly = hasMonthly || dateFormats.some((f) => YEARLY_FORMATS.has(f));

    return RESET_TIMING_OPTIONS.filter((option) => {
      if (option.value === RESET_TIMING.YEARLY) return hasYearly;
      if (option.value === RESET_TIMING.MONTHLY) return hasMonthly;
      if (option.value === RESET_TIMING.DAILY) return hasDaily;
      return true;
    });
  }, [formatParts]);

  const isResetTimingAvailable = availableResetTimings.some((o) => o.value === resetTiming);

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* 連番の位置（書式のパーツがあるときだけ） */}
      {hasFormatParts && (
        <FormSelect<PluginConfig>
          name={`${serialPath}.position`}
          label='位置'
          options={POSITION_OPTIONS}
          size='small'
          sx={{ minWidth: 120, maxWidth: 150 }}
        />
      )}

      <FormNumberField<PluginConfig>
        name={`${serialPath}.initialValue`}
        label='初期値'
        size='small'
        slotProps={{ htmlInput: { min: 1 } }}
        sx={{ width: 100 }}
      />

      <FormNumberField<PluginConfig>
        name={`${serialPath}.digit`}
        label='桁数'
        size='small'
        slotProps={{ htmlInput: { min: 1, max: 10 } }}
        sx={{ width: 100 }}
      />

      <Box sx={{ minWidth: 200, maxWidth: 250 }}>
        <FormSelect<PluginConfig>
          name={`${serialPath}.resetTiming`}
          label='連番リセットタイミング'
          // 選べるのは、書式のパーツの日付に合うものだけ（保存済みの値が合わないときは未選択に見える）
          options={availableResetTimings}
          // リセットするときは連番のフィールドを使わないので、選んでいたら外す
          onValueChange={(value) => {
            if (value !== RESET_TIMING.NONE) {
              setValue(`${serialPath}.serialFieldCode`, '', { shouldDirty: true });
            }
          }}
          size='small'
          fullWidth
        />
        <FormHelperText error={!isResetTimingAvailable}>
          {isResetTimingAvailable
            ? '指定した期間ごとに連番をリセットします。'
            : '現在の設定は無効です。適切な日付フォーマットを追加してください。'}
        </FormHelperText>
      </Box>

      {/* 連番のフィールド（リセットしないときだけ） */}
      {resetTiming === RESET_TIMING.NONE && (
        <Box sx={{ minWidth: 200, maxWidth: 250 }}>
          <FieldSelect<PluginConfig>
            name={`${serialPath}.serialFieldCode`}
            label='連番管理フィールド'
            placeholder='連番を保存するフィールドを選択'
            fieldTypes={SERIAL_FIELD_TYPES}
            size='small'
          />
          <FormHelperText>
            数値フィールドのみ選択可能です。このフィールドに最新の連番が保存されます。
          </FormHelperText>
        </Box>
      )}
    </Box>
  );
};

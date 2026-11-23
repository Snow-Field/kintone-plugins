import type { ZodType } from 'zod';
import { validateTargets } from '@/shared/lib/targets';
import { type PluginConfig, PluginConfigSchema } from '@/shared/config/staticSchema';

/**
 * 入力の検証を含むスキーマを作る（設定画面のフォームで使う）
 * アプリのフィールドには依存しないので、引数は使わない
 */
export const createConfigSchema = (): ZodType<PluginConfig, PluginConfig> =>
  PluginConfigSchema.superRefine((config, ctx) => {
    for (const { path, message } of validateTargets(config.targets)) {
      ctx.addIssue({ code: 'custom', path, message });
    }
  });

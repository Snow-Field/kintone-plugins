import { useAtomValue } from 'jotai';
import { usePluginForm as useGenericPluginForm } from '@kintone-plugin/kintone-utils';
import { pluginConfigAtom } from '@/config/states/plugin';
import { type PluginConfig, createConfigSchema } from '@/shared/config';

/** プラグイン設定フォームの管理を行うフック */
export const usePluginForm = () => {
  const config = useAtomValue(pluginConfigAtom);

  const methods = useGenericPluginForm<PluginConfig>({
    defaultValues: config,
    createSchema: createConfigSchema,
  });

  return { methods };
};

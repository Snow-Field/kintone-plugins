import { Suspense, useEffect, useState } from 'react';
import { atom, createStore, Provider as JotaiProvider } from 'jotai';
import { SnackbarProvider } from 'notistack';
import type { FieldValues } from 'react-hook-form';
import { logger, type DefinedPluginConfig } from '@kintone-plugin/kintone-utils';
import { GeometryLoader, PluginThemeProvider, type TabItem } from '@kintone-plugin/ui';
import { PluginErrorBoundary } from './PluginErrorBoundary';
import { PluginContent } from './PluginContent';

export type PluginConfigAppProps<T extends FieldValues> = {
  definition: DefinedPluginConfig<T>;
  tabs: TabItem[];
};

/**
 * プラグイン設定画面のルート
 * 保存済みの設定を読み込み、各 Provider・エラー境界・読み込み待ちを組み立てる
 */
export const PluginConfigApp = <T extends FieldValues>({
  definition,
  tabs,
}: PluginConfigAppProps<T>) => {
  // 画面ごとに1回だけ作る
  const [store] = useState(() => createStore());
  const [{ configAtom, loadError }] = useState(() => {
    const { config, error } = definition.load();
    return { configAtom: atom<T>(config), loadError: error };
  });

  useEffect(() => {
    if (loadError !== null) {
      logger.error(
        '保存済みのプラグイン設定を読み込めませんでした。既定値を表示しています。',
        loadError
      );
    }
  }, [loadError]);

  return (
    <JotaiProvider store={store}>
      <PluginThemeProvider>
        {/* エラー画面からも通知を使えるように、エラー境界より外側に置く */}
        <SnackbarProvider maxSnack={1}>
          <PluginErrorBoundary>
            <Suspense fallback={<GeometryLoader label='設定情報を取得しています...' />}>
              <PluginContent<T>
                definition={definition}
                configAtom={configAtom}
                tabs={tabs}
                hasLoadError={loadError !== null}
              />
            </Suspense>
          </PluginErrorBoundary>
        </SnackbarProvider>
      </PluginThemeProvider>
    </JotaiProvider>
  );
};

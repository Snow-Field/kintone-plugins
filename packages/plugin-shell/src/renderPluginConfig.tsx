import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { FieldValues } from 'react-hook-form';
import { PluginConfigApp, type PluginConfigAppProps } from './components/PluginConfigApp';

export type RenderPluginConfigOptions<T extends FieldValues> = PluginConfigAppProps<T> & {
  /** 描画先の要素の id（public/html/config.html と合わせる） */
  rootId?: string;
};

/**
 * プラグイン設定画面を描画する
 * 各プラグインの src/config/index.tsx から、設定の定義とタブを渡して呼ぶ
 */
export const renderPluginConfig = <T extends FieldValues>({
  rootId = 'settings',
  ...props
}: RenderPluginConfigOptions<T>): void => {
  const rootElement = document.getElementById(rootId);
  if (!rootElement) {
    throw new Error(
      `プラグインのHTMLに、ルート要素が存在しません。プラグイン設定をレンダリングするためには、id="${rootId}"の要素が必要です。`
    );
  }

  createRoot(rootElement).render(
    <StrictMode>
      <PluginConfigApp<T> {...props} />
    </StrictMode>
  );
};

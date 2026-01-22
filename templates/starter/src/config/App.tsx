import { type FC, Suspense } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { SnackbarProvider } from 'notistack';
import { GeometryLoader, PluginThemeProvider } from '@kintone-plugin/ui';
import { store } from '@/config/states/store';
import { PluginErrorBoundary } from './components/PluginErrorBoundary';
import { PluginContent } from './components/PluginContent';

const App: FC = () => {
  return (
    <JotaiProvider store={store}>
      <PluginThemeProvider>
        {/* 1. 通知機能を有効化（エラー画面からも通知を使えるように外側に配置） */}
        <SnackbarProvider maxSnack={1}>
          {/* 2. 全体のエラーをキャッチ */}
          <PluginErrorBoundary>
            {/* 3. コンポーネントやデータの読み込み待機 */}
            <Suspense fallback={<GeometryLoader label='設定情報を取得しています...' />}>
              {/* 4. メインコンテンツ */}
              <PluginContent />
            </Suspense>
          </PluginErrorBoundary>
        </SnackbarProvider>
      </PluginThemeProvider>
    </JotaiProvider>
  );
};

export default App;

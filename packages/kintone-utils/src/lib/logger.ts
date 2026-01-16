import { isDev } from './environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * kintoneプラグイン用のロギングクラス
 */
class PluginLogger {
  private readonly prefix: string;

  /**
   * @param prefix ログの接頭辞（例: 'Desktop', 'Config'）
   */
  constructor(prefix: string = 'Plugin') {
    this.prefix = `[${prefix}]`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (level === 'error') return true;
    return isDev;
  }

  /**
   * 通常のログ出力
   */
  log(...args: unknown[]) {
    if (this.shouldLog('debug')) {
      console.log(this.prefix, ...args);
    }
  }

  /**
   * 情報を強調して出力
   */
  info(...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.info(this.prefix, ...args);
    }
  }

  /**
   * 警告を出力
   */
  warn(...args: unknown[]) {
    if (this.shouldLog('warn')) {
      console.warn(this.prefix, ...args);
    }
  }

  /**
   * エラーを出力（常に表示）
   */
  error(...args: unknown[]) {
    console.error(this.prefix, ...args);
  }

  /**
   * グループ化開始
   */
  group(label: string) {
    if (isDev) {
      console.group(`${this.prefix} ${label}`);
    }
  }

  /**
   * グループ化終了
   */
  groupEnd() {
    if (isDev) {
      console.groupEnd();
    }
  }

  /**
   * テーブル形式で出力
   */
  table(data: unknown) {
    if (isDev) {
      console.table(data);
    }
  }
}

/**
 * デフォルトのロガーインスタンス
 */
export const logger = new PluginLogger();

/**
 * 独自のロガーを作成するためのクラス
 */
export { PluginLogger };

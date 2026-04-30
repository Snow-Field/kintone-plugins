import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PLUGIN_PATH = path.join(ROOT_DIR, 'artifacts', 'plugin.zip');
const ARTIFACTS_DIR = path.join(ROOT_DIR, 'artifacts');

/**
 * 外部コマンドを実行する Promise ラッパー
 */
const runCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { shell: true, stdio: 'inherit' });
    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} が終了コード ${code} で失敗しました。`));
      } else {
        resolve();
      }
    });
    process.on('error', reject);
  });
};

const main = async () => {
  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch');

  const requiredEnvVars = ['KINTONE_BASE_URL', 'KINTONE_USERNAME', 'KINTONE_PASSWORD'];

  try {
    // 環境変数の検証
    const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
    if (missingEnvVars.length > 0) {
      throw new Error(`環境変数が不足しています: ${missingEnvVars.join(', ')}`);
    }

    if (isWatch) {
      console.log('👀 ファイルの変更を監視して自動アップロードを開始します...');
      await runCommand('kintone-plugin-uploader', ['--watch', ARTIFACTS_DIR]);
      return;
    }

    // プラグインファイルの存在確認
    try {
      await fs.access(PLUGIN_PATH);
    } catch {
      throw new Error(
        `プラグインファイルが見つかりません: ${PLUGIN_PATH}\n先に 'pnpm run build' を実行してください。`
      );
    }

    console.log('🚀 プラグインをアップロード中...');
    await runCommand('kintone-plugin-uploader', [PLUGIN_PATH]);
    console.log('✨ アップロードが完了しました!');
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
};

main();

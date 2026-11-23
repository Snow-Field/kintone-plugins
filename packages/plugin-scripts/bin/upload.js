#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { runCliKintone } from '../lib/cli-kintone.js';

// プラグインのフォルダ（pnpm は各プラグインの package.json のある場所で実行する）
const ROOT_DIR = process.cwd();
const PLUGIN_PATH = path.join(ROOT_DIR, 'artifacts', 'plugin.zip');
const ENV_PATH = path.join(ROOT_DIR, '.env');

/** cli-kintone が読む接続情報（.env に書く） */
const REQUIRED_ENV_VARS = ['KINTONE_BASE_URL', 'KINTONE_USERNAME', 'KINTONE_PASSWORD'];

const main = async () => {
  const isWatch = process.argv.slice(2).includes('--watch');

  try {
    // .env を読み込む（Node の組み込みの機能）
    try {
      process.loadEnvFile(ENV_PATH);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      throw new Error(
        `.env が見つかりません: ${ENV_PATH}\n先に 'pnpm run init' を実行してください。`
      );
    }

    const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
    if (missingEnvVars.length > 0) {
      throw new Error(`環境変数が不足しています: ${missingEnvVars.join(', ')}`);
    }

    try {
      await fs.access(PLUGIN_PATH);
    } catch {
      throw new Error(
        `プラグインファイルが見つかりません: ${PLUGIN_PATH}\n先に 'pnpm run build' を実行してください。`
      );
    }

    // cli-kintone は REST API でアップロードする。確認の問い合わせは --yes で省く
    const args = ['plugin', 'upload', '--input', PLUGIN_PATH, '--yes'];
    if (isWatch) {
      console.log('👀 ファイルの変更を監視して自動アップロードを開始します...');
      args.push('--watch');
    } else {
      console.log('🚀 プラグインをアップロード中...');
    }
    await runCliKintone(args);
    if (!isWatch) console.log('✨ アップロードが完了しました!');
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
};

main();

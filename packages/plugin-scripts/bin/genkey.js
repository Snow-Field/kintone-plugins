#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

// プラグインのフォルダ（pnpm は各プラグインの package.json のある場所で実行する）
const ROOT_DIR = process.cwd();
const PRIVATE_KEY_PATH = path.join(ROOT_DIR, 'private.ppk');

/**
 * 外部コマンドを実行する Promise ラッパー
 */
const runCommand = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT_DIR, stdio: 'inherit' });
    child.on('close', (code, signal) => {
      // Ctrl+C などで止めた場合（監視モードの終了など）は、失敗として扱わない
      if (code === 0 || signal === 'SIGINT' || signal === 'SIGTERM') resolve();
      else reject(new Error(`${command} が終了コード ${code} で失敗しました。`));
    });
    child.on('error', reject);
  });

/**
 * 秘密鍵の初期化処理
 * 秘密鍵はプラグイン ID の元になるため、既にある場合は作り直さない
 */
const main = async () => {
  try {
    try {
      const key = await fs.readFile(PRIVATE_KEY_PATH, 'utf8');
      // 作成の途中で止まった空のファイルなどを、正しい鍵として扱わない
      if (!key.trimStart().startsWith('-----BEGIN')) {
        throw new Error(
          `private.ppk が秘密鍵の形式ではありません: ${PRIVATE_KEY_PATH}\n作り直す場合は、削除してから実行してください（プラグイン ID が変わります）。`
        );
      }
      console.log(
        '🔑 private.ppk は既に存在します。作り直す場合は、削除してから実行してください。'
      );
      return;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    console.log('🔐 新しい秘密鍵を生成中...');
    await runCommand('cli-kintone', ['plugin', 'keygen', '--output', PRIVATE_KEY_PATH]);
    console.log('✨ private.ppk が生成されました!');
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
};

main();

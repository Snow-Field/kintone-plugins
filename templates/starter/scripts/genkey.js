import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import NodeRSA from 'node-rsa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRIVATE_KEY_PATH = path.resolve(__dirname, '../private.ppk');

/**
 * 秘密鍵の初期化処理
 */
const initializePrivateKey = async () => {
  try {
    // 既存の鍵を確認
    await fs.access(PRIVATE_KEY_PATH);
    const privateKey = await fs.readFile(PRIVATE_KEY_PATH, 'utf8');
    new NodeRSA(privateKey);
    console.log('🔑 private.ppk は既に存在します。');
  } catch (error) {
    // ファイルが存在しない場合のみ生成を続行
    if (error.code !== 'ENOENT') {
      throw error;
    }

    console.log('🔐 新しい秘密鍵を生成中...');
    const key = new NodeRSA({ b: 1024 });
    const privateKey = key.exportKey('pkcs1-private');

    // ディレクトリの存在を確認して保存
    await fs.mkdir(path.dirname(PRIVATE_KEY_PATH), { recursive: true });
    await fs.writeFile(PRIVATE_KEY_PATH, privateKey, 'utf8');
    console.log('✨ private.ppk が生成されました!');
  }
};

const main = async () => {
  try {
    await initializePrivateKey();
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
};

main();

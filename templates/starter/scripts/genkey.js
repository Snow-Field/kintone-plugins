import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import RSA from 'node-rsa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRIVATE_KEY_PATH = path.join(__dirname, '../private.ppk');
const PRIVATE_KEY_DIR = path.dirname(PRIVATE_KEY_PATH);

async function ensureDirectoryExists(dir) {
  try {
    await fs.promises.access(dir);
  } catch {
    // ディレクトリが存在しない場合は作成する（再帰的に作成）
    await fs.promises.mkdir(dir, { recursive: true });
  }
}

async function initializePrivateKey() {
  try {
    const privateKey = await fs.promises.readFile(PRIVATE_KEY_PATH, 'utf8');
    new RSA(privateKey);
    console.log('🔑 private.ppk already exists and is valid. Abort.');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    // ファイルが存在しない場合、新しい鍵を生成して保存する
    const key = new RSA({ b: 1024 });
    const privateKey = key.exportKey('pkcs1-private');

    // 書き込み前にディレクトリが存在するか確認
    await ensureDirectoryExists(PRIVATE_KEY_DIR);
    await fs.promises.writeFile(PRIVATE_KEY_PATH, privateKey, 'utf8');
  }
}

async function main() {
  try {
    await initializePrivateKey();
    console.log('🔐 private.ppk generated');
  } catch (error) {
    console.error(`Failed to initialize private key: ${error.message}`);
  }
}

main();

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * cli-kintone の実体（JavaScript のファイル）のパスを返す
 * `node_modules/.bin/cli-kintone` は Windows では `.cmd` になり、シェルを通さずに起動できない。
 * そのため実体を探し、今動いている Node で直接起動する（OS によらず同じ動き方にするため）
 */
const resolveCliKintone = async () => {
  const pkgUrl = import.meta.resolve('@kintone/cli/package.json');
  const pkg = JSON.parse(await fs.readFile(fileURLToPath(pkgUrl), 'utf8'));
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.['cli-kintone'];
  if (!bin) throw new Error('@kintone/cli の package.json に cli-kintone の bin がありません。');
  return fileURLToPath(new URL(bin, pkgUrl));
};

/**
 * cli-kintone を実行する
 * 実行したフォルダ（プラグインのフォルダ）で動かす
 */
export const runCliKintone = async (args) => {
  const cliPath = await resolveCliKintone();
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
    child.on('close', (code, signal) => {
      // Ctrl+C などで止めた場合（監視モードの終了など）は、失敗として扱わない
      if (code === 0 || signal === 'SIGINT' || signal === 'SIGTERM') resolve();
      else reject(new Error(`cli-kintone が終了コード ${code} で失敗しました。`));
    });
    child.on('error', reject);
  });
};

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import 'dotenv/config';

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(__dirname, '..');
  const pluginPath = path.join(rootDir, 'artifacts', 'plugin.zip');
  const artifactsPath = path.join(rootDir, 'artifacts');

  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch');

  const requiredEnvVars = ['KINTONE_BASE_URL', 'KINTONE_USERNAME', 'KINTONE_PASSWORD'];

  try {
    // 検証
    const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
    if (missingEnvVars.length > 0) {
      throw new Error(`環境変数が不足しています: ${missingEnvVars.join(', ')}`);
    }

    if (isWatch) {
      console.log(`👀 Watching for changes in dist directory...`);
      const uploaderArgs = ['--watch', artifactsPath];

      const uploaderProcess = spawn('kintone-plugin-uploader', uploaderArgs, { shell: true });
      uploaderProcess.stdout.on('data', (data) => process.stdout.write(data.toString()));
      uploaderProcess.stderr.on('data', (data) => process.stderr.write(data.toString()));

      return new Promise((_, reject) => {
        uploaderProcess.on('error', reject);
        uploaderProcess.on('close', (code) => {
          if (code !== 0) reject(new Error(`Uploader exited with code ${code}`));
        });
      });
    }

    if (!fs.existsSync(pluginPath)) {
      throw new Error(
        `プラグインファイルが見つかりません: ${pluginPath}\n先に 'npm run build' を実行してください。`
      );
    }

    console.log(`🚀 Uploading plugin...`);

    // kintone-plugin-uploader の実行
    await new Promise((resolve, reject) => {
      const uploaderProcess = spawn('kintone-plugin-uploader', [pluginPath], { shell: true });
      uploaderProcess.stdout.on('data', (data) => process.stdout.write(data.toString()));
      uploaderProcess.stderr.on('data', (data) => process.stderr.write(data.toString()));
      uploaderProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Uploader exited with code ${code}`));
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
  return Promise.resolve();
}

main();

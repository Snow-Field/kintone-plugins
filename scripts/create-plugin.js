import * as prompts from '@clack/prompts';
import { execFileSync } from 'node:child_process';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * template から複製しないもの
 * template は workspace に入っているため、依存関係やビルドの生成物、認証情報が置かれることがある
 */
const EXCLUDED_NAMES = new Set([
  'node_modules',
  'dist',
  'artifacts',
  '.turbo',
  '.env',
  'private.ppk',
]);

/** manifest.json の文字数の上限（kintone のプラグインの仕様） */
const NAME_MAX_LENGTH = 64;
const DESCRIPTION_MAX_LENGTH = 200;

/**
 * 空でなく、上限の文字数以内か
 * 前後の空白は除いて書き込むので、除いた後の長さで数える。絵文字なども1文字として数える（kintone の検証に合わせる）
 */
const validateLength = (label, max) => (value) => {
  const length = [...(value ?? '').trim()].length;
  if (length === 0) return `${label}は必須です`;
  if (length > max) return `${label}は${max}文字以内で入力してください（今は${length}文字）`;
  return undefined;
};

/**
 * 聞いた名前と説明を manifest.json に書き込む
 * homepage_url は template ではディレクトリの手前まで（`.../apps/`）なので、ディレクトリ名を足す
 */
const applyManifest = (manifest, { dirName, nameJa, nameEn, descriptionJa, descriptionEn }) => ({
  ...manifest,
  name: { ...manifest.name, ja: nameJa.trim(), en: nameEn.trim() },
  description: { ...manifest.description, ja: descriptionJa.trim(), en: descriptionEn.trim() },
  homepage_url: Object.fromEntries(
    Object.entries(manifest.homepage_url ?? {}).map(([lang, url]) => [lang, `${url}${dirName}`])
  ),
});

async function main() {
  prompts.intro('🚀 Create a new kintone plugin');

  const name = await prompts.text({
    message: 'Plugin directory name (kebab-case)',
    placeholder: 'my-new-plugin',
    validate(value) {
      if (!value) return 'Name is required';
      if (!/^[a-z0-9-]+$/.test(value)) return 'Use only lowercase, numbers and hyphens';
    },
  });

  if (prompts.isCancel(name)) {
    prompts.cancel('Operation cancelled.');
    process.exit(0);
  }

  const targetDir = path.resolve(rootDir, 'apps', name);

  if (await fs.pathExists(targetDir)) {
    prompts.cancel(`Error: Directory ${name} already exists in apps/`);
    process.exit(1);
  }

  // manifest.json の名前と説明（空のままだと zip を作れないため、ここで聞く）
  const manifestInput = await prompts.group(
    {
      nameJa: () =>
        prompts.text({
          message: 'プラグイン名（日本語）',
          placeholder: '年齢計算プラグイン',
          validate: validateLength('プラグイン名', NAME_MAX_LENGTH),
        }),
      nameEn: () =>
        prompts.text({
          message: 'プラグイン名（英語）',
          placeholder: 'Age Calculator',
          validate: validateLength('プラグイン名', NAME_MAX_LENGTH),
        }),
      descriptionJa: () =>
        prompts.text({
          message: 'プラグインの説明（日本語）',
          validate: validateLength('説明', DESCRIPTION_MAX_LENGTH),
        }),
      descriptionEn: () =>
        prompts.text({
          message: 'プラグインの説明（英語）',
          validate: validateLength('説明', DESCRIPTION_MAX_LENGTH),
        }),
    },
    {
      onCancel: () => {
        prompts.cancel('Operation cancelled.');
        process.exit(0);
      },
    }
  );

  const s = prompts.spinner();
  s.start('Scaffolding plugin...');

  try {
    // Copy template
    const templateDir = path.resolve(rootDir, 'template');
    await fs.copy(templateDir, targetDir, {
      filter: (src) => !EXCLUDED_NAMES.has(path.basename(src)),
    });

    // Update package.json name
    const pkgPath = path.join(targetDir, 'package.json');
    const pkg = await fs.readJson(pkgPath);
    pkg.name = name;
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });

    // Update manifest.json name and description
    const manifestPath = path.join(targetDir, 'public', 'manifest.json');
    const manifest = await fs.readJson(manifestPath);
    await fs.writeJson(manifestPath, applyManifest(manifest, { dirName: name, ...manifestInput }), {
      spaces: 2,
    });

    // JSON.stringify の書き方（配列を必ず複数行にする）は Biome の書式と違い、pnpm lint で失敗するため整形する
    let formatWarning;
    try {
      execFileSync('biome', ['format', '--write', pkgPath, manifestPath], {
        cwd: rootDir,
        stdio: 'ignore',
      });
    } catch (error) {
      formatWarning = `package.json と manifest.json を整形できませんでした（${error.message}）。ルートで pnpm fix を実行してください。`;
    }

    s.stop(`Plugin ${name} created successfully!`);
    if (formatWarning) prompts.log.warn(formatWarning);

    prompts.note(
      `Next steps:\n
        1. cd apps/${name}\n
        2. pnpm install\n
        3. pnpm run init (setup .env & key)`,
      'Success!'
    );

    prompts.outro('Happy hacking! 🎨');
  } catch (error) {
    s.stop('Failed to create plugin');
    console.error(error);
    process.exitCode = 1;
  }
}

main();

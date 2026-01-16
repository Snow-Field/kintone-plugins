import * as prompts from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

  const s = prompts.spinner();
  s.start('Scaffolding plugin...');

  try {
    // Copy template
    const templateDir = path.resolve(rootDir, 'templates', 'starter');
    await fs.copy(templateDir, targetDir);

    // Update package.json name
    const pkgPath = path.join(targetDir, 'package.json');
    const pkg = await fs.readJson(pkgPath);
    pkg.name = name;
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });

    s.stop(`Plugin ${name} created successfully!`);

    prompts.note(
      `Next steps:\n  1. cd apps/${name}\n  2. pnpm init (setup .env & key)\n  3. pnpm dev`,
      'Success!'
    );

    prompts.outro('Happy hacking! 🎨');
  } catch (error) {
    s.stop('Failed to create plugin');
    console.error(error);
  }
}

main();

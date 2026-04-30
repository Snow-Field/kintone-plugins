import * as prompts from '@clack/prompts';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * ユーザーによるキャンセルを処理する
 */
const handleCancel = (input) => {
  if (prompts.isCancel(input)) {
    prompts.cancel('Operation cancelled.');
    process.exit(0);
  }
};

const main = async () => {
  try {
    prompts.intro('📝 kintone接続用の.envファイルを作成します');

    const envPath = path.resolve(process.cwd(), '.env');

    // 既存ファイルの確認
    try {
      await fs.access(envPath);
      const overwrite = await prompts.confirm({
        message: '.envファイルが既に存在します。上書きしますか？',
        initialValue: false,
      });
      handleCancel(overwrite);
      if (!overwrite) {
        prompts.outro('Operation cancelled.');
        return;
      }
    } catch {
      // ファイルが存在しない場合は続行
    }

    const group = await prompts.group(
      {
        baseUrl: () =>
          prompts.text({
            message: 'kintoneのURLを入力してください',
            placeholder: 'https://example.cybozu.com',
            validate: (value) => {
              if (!value) return 'URLは必須です。';
              if (!value.startsWith('http')) return '有効なURLを入力してください。';
              return undefined;
            },
          }),
        username: () =>
          prompts.text({
            message: 'ユーザー名を入力してください',
            validate: (value) => (value ? undefined : 'ユーザー名は必須です。'),
          }),
        password: () =>
          prompts.password({
            message: 'パスワードを入力してください',
            validate: (value) => (value ? undefined : 'パスワードは必須です。'),
          }),
      },
      {
        onCancel: () => {
          prompts.cancel('Operation cancelled.');
          process.exit(0);
        },
      }
    );

    const envContent = [
      `KINTONE_BASE_URL=${group.baseUrl}`,
      `KINTONE_USERNAME=${group.username}`,
      `KINTONE_PASSWORD=${group.password}`,
    ].join('\n');

    await fs.writeFile(envPath, envContent, 'utf8');

    prompts.outro('✨ .envファイルが作成されました!');
  } catch (error) {
    console.error(`❌ Error occurred: ${error.message}`);
    process.exit(1);
  }
};

main();

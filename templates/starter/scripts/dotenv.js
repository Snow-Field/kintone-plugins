import * as prompts from '@clack/prompts';
import fs from 'fs-extra';

function isCancel(input) {
  if (prompts.isCancel(input)) {
    prompts.cancel('Operation cancelled.');
    process.exit(0);
  }
}

async function main() {
  try {
    // intro
    prompts.intro('📝 Create your Kintone .env file');

    // base-url
    const baseUrl = await prompts.text({
      message: 'Please enter Base URL',
      placeholder: 'https://example.cybozu.com',
      defaultValue: 'https://example.cybozu.com',
    });

    isCancel(baseUrl);

    // username
    const username = await prompts.text({
      message: 'Please enter username',
      placeholder: 'username',
      defaultValue: 'username',
    });

    isCancel(username);

    // password
    const password = await prompts.password({
      message: 'Please enter password',
      validate(value) {
        if (value.length === 0) return 'password is required!';
      },
    });

    isCancel(password);

    const envVariables = {
      KINTONE_BASE_URL: baseUrl,
      KINTONE_USERNAME: username,
      KINTONE_PASSWORD: password,
    };

    const envContent = Object.entries(envVariables)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // envファイル作成
    await fs.writeFile('.env', envContent);
    prompts.outro('✨ .env file generated!');
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

main();

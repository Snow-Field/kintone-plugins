import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest の globals を使わないため、Testing Library の後片付けを自分で登録する
afterEach(() => {
  cleanup();
});

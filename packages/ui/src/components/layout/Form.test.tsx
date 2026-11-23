import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Form } from './Form';

const tabs = [{ label: '基本', content: <input aria-label='名前' /> }];

/** 操作を止める範囲（タブの中身を囲む要素） */
const container = () => screen.getByRole('tabpanel').parentElement;

describe('Form', () => {
  it('disabled のときは、タブの中身全体を操作できないようにする', () => {
    render(<Form tabs={tabs} activeTab={0} disabled />);

    expect(container()?.hasAttribute('inert')).toBe(true);
    expect(container()?.getAttribute('aria-busy')).toBe('true');
  });

  it('disabled を外すと、再び操作できる', () => {
    const { rerender } = render(<Form tabs={tabs} activeTab={0} disabled />);

    rerender(<Form tabs={tabs} activeTab={0} />);

    expect(container()?.hasAttribute('inert')).toBe(false);
    expect(screen.getByRole('textbox', { name: '名前' })).toBeTruthy();
  });
});

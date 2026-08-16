import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { BudgetCategoryHeader } from './BudgetCategoryHeader';

function renderHeader(props: Partial<ComponentProps<typeof BudgetCategoryHeader>> = {}) {
  return render(
    <MantineProvider>
      <BudgetCategoryHeader
        onAddGroup={() => {}}
        hasAccounts
        {...props}
      />
    </MantineProvider>,
  );
}

describe('BudgetCategoryHeader', () => {
  it('renders add group button', () => {
    renderHeader();
    const addButton = screen.getByRole('button', { name: /add group/i });
    expect(addButton).toBeTruthy();
  });

  it('disables add group button when no accounts', () => {
    renderHeader({ hasAccounts: false });
    const addButton = screen.getByRole('button', { name: /add group/i });
    expect(addButton.hasAttribute('disabled')).toBe(true);
  });

  it('calls onAddGroup when add group clicked', () => {
    let called = 0;
    renderHeader({ onAddGroup: () => { called += 1; } });
    fireEvent.click(screen.getByRole('button', { name: /add group/i }));
    expect(called).toBe(1);
  });
});

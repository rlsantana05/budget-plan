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
  it('renders add group button by default', () => {
    renderHeader();
    const addButton = screen.getByRole('button', { name: /add group/i });
    expect(addButton).toBeTruthy();
  });

  it('hides add group button when showAddButton is false', () => {
    renderHeader({ showAddButton: false });
    expect(screen.queryByRole('button', { name: /add group/i })).toBeNull();
  });

  it('renders nothing when there are no accounts', () => {
    renderHeader({ hasAccounts: false });
    expect(screen.queryByRole('button', { name: /add group/i })).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls onAddGroup when add group clicked', () => {
    let called = 0;
    renderHeader({ onAddGroup: () => { called += 1; } });
    fireEvent.click(screen.getByRole('button', { name: /add group/i }));
    expect(called).toBe(1);
  });
});

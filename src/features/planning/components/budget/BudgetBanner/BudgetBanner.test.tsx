import { render, screen } from '@testing-library/react';
import BudgetBanner from './BudgetBanner';

describe('BudgetBanner', () => {
  const incomeGroup = {
    isIncome: true,
    items: [{ plannedCents: 400000, fundedCents: 0 }], // $4,000.00
  };

  const spendingGroup = {
    isIncome: false,
    items: [{ plannedCents: 20000, fundedCents: 0 }], // $200.00
  };

  test('displays correct left to budget when income and spending present', () => {
    const groups = [incomeGroup, spendingGroup];
    render(<BudgetBanner groups={groups} />);

    // The banner should show $3,800.00 Left to budget
    screen.getByText(/\$3,800\.00/);
    screen.getByText(/Left to budget/);
  });

  test('displays over budget when spending exceeds income', () => {
    const groups = [
      incomeGroup,
      { isIncome: false, items: [{ plannedCents: 500000, fundedCents: 0 }] }, // $5,000.00
    ];
    render(<BudgetBanner groups={groups} />);
    screen.getByText(/\$1,000\.00/); // 4000 - 5000 = -1000 => abs 1000
    screen.getByText(/Over budget/);
  });

  test('displays zero when income equals spending', () => {
    const groups = [
      { isIncome: true, items: [{ plannedCents: 300000, fundedCents: 0 }] }, // $3,000.00
      { isIncome: false, items: [{ plannedCents: 300000, fundedCents: 0 }] }, // $3,000.00
    ];
    render(<BudgetBanner groups={groups} />);
    screen.getByText(/\$0\.00/);
    screen.getByText(/Left to budget/); // zero is considered left to budget (non-negative)
  });
});
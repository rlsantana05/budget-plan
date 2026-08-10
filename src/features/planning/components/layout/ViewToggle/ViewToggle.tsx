'use client';

import classes from './ViewToggle.module.css';

type View = 'summary' | 'transactions';

interface ViewToggleProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

export default function ViewToggle({
  activeView,
  onViewChange,
}: ViewToggleProps) {
  return (
    <div className={classes.toggle} data-active={activeView}>
      <button
        type="button"
        className={activeView === 'summary' ? classes.active : ''}
        onClick={() => onViewChange('summary')}
      >
        <span aria-hidden>◐</span>
        {' '}
        Summary
      </button>
      <button
        type="button"
        className={activeView === 'transactions' ? classes.active : ''}
        onClick={() => onViewChange('transactions')}
      >
        <span aria-hidden>$</span>
        {' '}
        Transactions
      </button>
    </div>
  );
}

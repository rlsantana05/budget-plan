'use client';

import BudgetGroupList from '../BudgetGroupList/BudgetGroupList';
import classes from './BudgetGroupListWithHeader.module.css';

export default function BudgetGroupListWithHeader() {
  return (
    <div className={classes.wrapper}>
      <BudgetGroupList />
    </div>
  );
}

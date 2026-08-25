import classes from './BudgetColumnHeader.module.css';

export function BudgetColumnHeader() {
  return (
    <div className={classes.header} role="columnheader">
      <span>Category</span>
      <span>Planned</span>
      <span>Spent</span>
      <span>Remaining</span>
      <span aria-hidden="true" />
    </div>
  );
}

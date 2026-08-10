import classes from './BudgetColumnHeader.module.css';

export function BudgetColumnHeader() {
  return (
    <div className={classes.header} role="columnheader">
      <span>Category</span>
      <span>Assigned</span>
      <span>Activity</span>
      <span>Available</span>
      <span aria-hidden="true" />
    </div>
  );
}

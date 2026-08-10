import { formatMoney } from '../../utils/formatters';
import classes from './BudgetHero.module.css';

export type BudgetHeroProps = {
  leftToBudget: number;
  totalAssigned: number;
  totalIncome: number;
  onAssignClick: () => void;
};

export default function BudgetHero({
  leftToBudget,
  totalAssigned,
  totalIncome,
  onAssignClick,
}: BudgetHeroProps) {
  const progressPct = totalIncome > 0
    ? Math.min(totalAssigned / totalIncome, 1)
    : 0;

  return (
    <section className={classes.hero} aria-label="Budget overview">
      <div className={classes.topRow}>
        <span className={classes.label}>
          <span className={classes.dot} aria-hidden="true" />
          LEFT TO BUDGET
        </span>
        <button type="button" className={classes.assign} onClick={onAssignClick}>
          Assign
        </button>
      </div>

      <div className={classes.amount}>{formatMoney(leftToBudget)}</div>
      <div className={classes.subtitle}>
        {formatMoney(totalAssigned)} assigned of {formatMoney(totalIncome)} income
      </div>

      <div className={classes.progressBlock}>
        <div className={classes.progressTrack}>
          <div
            className={classes.progressFill}
            style={{ width: `${progressPct * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
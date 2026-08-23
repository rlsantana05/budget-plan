import { formatCents } from '../../utils/formatters';
import classes from './BudgetHero.module.css';

export type BudgetHeroProps = {
  leftToBudgetCents: number;
  totalAssignedCents: number;
  totalIncomeCents: number;
  onAssignClick: () => void;
};

export default function BudgetHero({
  leftToBudgetCents,
  totalAssignedCents,
  totalIncomeCents,
  onAssignClick,
}: BudgetHeroProps) {
  const progressPct = totalIncomeCents > 0
    ? Math.min(totalAssignedCents / totalIncomeCents, 1)
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

      <div className={classes.amount}>{formatCents(leftToBudgetCents)}</div>
      <div className={classes.subtitle}>
        {formatCents(totalAssignedCents)} assigned of {formatCents(totalIncomeCents)} income
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
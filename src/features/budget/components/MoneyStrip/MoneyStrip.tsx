'use client';

import { formatCents } from '../../utils/formatters';
import classes from './MoneyStrip.module.css';

interface MoneyStripProps {
  cashOnHandCents: number;
  readyToAssignCents: number;
  totalAssignedCents: number;
}

/**
 * Budget screen header (spec 2026-08-22-budget-envelope-screen Phase 1):
 * one hero number — Ready to Assign — flanked by the two numbers that explain it.
 */
export default function MoneyStrip({
  cashOnHandCents,
  readyToAssignCents,
  totalAssignedCents,
}: MoneyStripProps) {
  const tone = readyToAssignCents > 0
    ? classes.positive
    : readyToAssignCents < 0 ? classes.negative : '';

  return (
    <section className={classes.strip} aria-label="Budget money overview">
      <div className={classes.cell}>
        <span className={classes.label}>Cash on Hand</span>
        <span className={classes.value}>{formatCents(cashOnHandCents)}</span>
      </div>
      <div className={`${classes.cell} ${classes.hero}`}>
        <span className={classes.label}>Ready to Assign</span>
        <span className={`${classes.value} ${tone}`}>
          {formatCents(readyToAssignCents)}
        </span>
      </div>
      <div className={classes.cell}>
        <span className={classes.label}>Assigned this month</span>
        <span className={classes.value}>{formatCents(totalAssignedCents)}</span>
      </div>
    </section>
  );
}

'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { formatMoney } from '../../../utils/formatters';
import sharedClasses from '../../shared/BudgetPlanShared.module.css';
import classes from './BudgetBanner.module.css';

interface BudgetBannerProps {
  amount: number;
  label: string;
  children?: ReactNode;
  flat?: boolean;
}

type BannerStatus = 'in-progress' | 'complete' | 'over';

const statusByAmount = (amount: number): BannerStatus => {
  if (amount > 0) return 'in-progress';
  if (amount < 0) return 'over';
  return 'complete';
};

const STATUS_CLASS: Record<BannerStatus, string> = {
  complete: classes.statusComplete,
  'in-progress': classes.statusInProgress,
  over: classes.statusOver,
};

export default function BudgetBanner({
  amount,
  label,
  children,
  flat = false,
}: BudgetBannerProps) {
  const reduceMotion = useReducedMotion();
  const transition = {
    duration: reduceMotion ? 0 : 0.24,
    ease: 'easeOut' as const,
  };
  const status = statusByAmount(amount);
  const statusClass = STATUS_CLASS[status];

  return (
    <div
      className={`${sharedClasses.card} ${classes.banner} ${flat ? classes.flat : ''}`}
      data-status={status}
    >
      <div className={classes.bannerEyebrow}>
        <span className={classes.bannerLed}>
          <span className={`${classes.bannerDot} ${statusClass}`} aria-hidden="true" />
          <span className={classes.bannerLabel}>{label}</span>
        </span>
        <AnimatePresence>
          {status === 'complete' && (
            <motion.span
              key="check"
              className={classes.bannerCheck}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={transition}
              aria-label="Month is on budget"
            >
              <Check size={16} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${status}-${amount}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={transition}
          className={`${classes.bannerAmount} ${statusClass}`}
        >
          {formatMoney(Math.abs(amount))}
        </motion.div>
      </AnimatePresence>

      {children && (
        <>
          <div className={classes.bannerDivider} />
          {children}
        </>
      )}
    </div>
  );
}

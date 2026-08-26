'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { formatMoney } from '../../../utils/formatters';
import sharedClasses from '../../shared/BudgetPlanShared.module.css';

import classes from './BudgetBanner.module.css';

interface BudgetBannerProps {
  /** Spending groups from the planning store; used to compute `leftToBudget` internally. */
  groups: Array<{ isIncome: boolean; items: Array<{ plannedCents: number; fundedCents: number }> }>;
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
  complete: classes.bannerAmountComplete,
  'in-progress': classes.bannerAmountInProgress,
  over: classes.bannerAmountOver,
};

function useLeftToBudget(
  groups: BudgetBannerProps['groups'],
): number {
  return useMemo(() => {
    const incomeGroups = groups.filter((g) => g.isIncome);
    const spendingGroups = groups.filter((g) => !g.isIncome);
    
    const incomePlanned = incomeGroups
      .flatMap((g) => g.items ?? [])
      .reduce((sum, it) => sum + it.plannedCents, 0);
    
    const spendingPlanned = spendingGroups
      .flatMap((g) => g.items ?? [])
      .reduce((sum, it) => sum + it.plannedCents, 0);
    
    return incomePlanned - spendingPlanned;
  }, [groups]);
}

const MOTION_TRANSITION = {
  duration: 0.18,
  ease: 'easeOut',
} as const;

export default function BudgetBanner({
  groups,
  children,
  flat = false,
}: BudgetBannerProps) {
  const reduceMotion = useReducedMotion();
  const transition = {
    duration: reduceMotion ? 0 : MOTION_TRANSITION.duration,
    ease: MOTION_TRANSITION.ease,
  };

  const leftToBudget = useLeftToBudget(groups);
  const status = statusByAmount(leftToBudget);
  const amountStatusClass = STATUS_CLASS[status];
  const message = leftToBudget < 0 ? 'Over budget' : 'Left to budget';

  return (
    <div
      className={`${sharedClasses.card} ${classes.banner} ${flat ? classes.flat : ''}`}
      data-status={status}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${status}-${leftToBudget}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={transition}
          className={classes.bannerRow}
        >
          <span className={`${classes.bannerAmount} ${amountStatusClass}`}>
            {formatMoney(Math.abs(leftToBudget / 100))}
            <span className={classes.bannerMessage}>{message}</span>
          </span>
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

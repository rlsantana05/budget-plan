'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { formatMoney } from '../../../utils/formatters';
import sharedClasses from '../../shared/BudgetPlanShared.module.css';
import classes from './BudgetBanner.module.css';

interface BudgetBannerProps {
  amount: number;
  children?: ReactNode;
  flat?: boolean;
  message?: string;
}

type BannerStatus = 'in-progress' | 'complete' | 'over';

const statusByAmount = (amount: number): BannerStatus => {
  if (amount > 0) return 'in-progress';
  if (amount < 0) return 'over';
  return 'complete';
};

const STATUS_CLASS: Record<BannerStatus, string> = {
  complete: 'bannerAmount--complete',
  'in-progress': 'bannerAmount--in-progress',
  over: 'bannerAmount--over',
};

export default function BudgetBanner({
  amount,
  children,
  flat = false,
  message,
}: BudgetBannerProps) {
  const reduceMotion = useReducedMotion();
  const transition = {
    duration: reduceMotion ? 0 : 0.24,
    ease: 'easeOut' as const,
  };
  const status = statusByAmount(amount);
  const amountStatusClass = STATUS_CLASS[status];

  return (
    <div
      className={`${sharedClasses.card} ${classes.banner} ${flat ? classes.flat : ''}`}
      data-status={status}
    >
      {/* Compact row - no eyebrow, message to right of amount */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${status}-${amount}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={transition}
          className={classes.bannerRow}
        >
          <span className={`${classes.bannerAmount} ${amountStatusClass}`}>
            {formatMoney(Math.abs(amount))}
            {message && <span className={classes.bannerMessage}>{message}</span>}
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

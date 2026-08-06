'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { formatMoney } from '../utils/formatters';
import sharedClasses from '../styles/PlanningShared.module.css';
import classes from './PlanningBudgetBanner.module.css';

interface PlanningBudgetBannerProps {
  amount: number;
  label: string;
}

export default function PlanningBudgetBanner({
  amount,
  label,
}: PlanningBudgetBannerProps) {
  const reduceMotion = useReducedMotion();
  const transition = {
    duration: reduceMotion ? 0 : 0.18,
    ease: 'easeOut' as const,
  };
  const isOverBudget = amount > 0;
  const isUnderBudget = amount < 0;
  let status: 'over' | 'under' | 'on' = 'on';
  if (isOverBudget) status = 'over';
  if (isUnderBudget) status = 'under';
  const bannerClass = {
    over: classes.bannerOver,
    under: classes.bannerUnder,
    on: classes.bannerOnTrack,
  }[status];

  return (
    <div className={`${sharedClasses.card} ${classes.banner}`}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${status}${amount}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={transition}
          className={`${classes.bannerAmount} ${bannerClass}`}
        >
          {formatMoney(isUnderBudget ? -amount : amount)}
        </motion.div>
      </AnimatePresence>
      <div className={classes.bannerLabel}>{label}</div>
    </div>
  );
}

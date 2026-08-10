'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { TRANSACTION_TABS } from '../../../constants';
import classes from './StatusSubtabs.module.css';

interface StatusSubtabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function StatusSubtabs({
  activeTab,
  onTabChange,
}: StatusSubtabsProps) {
  const reduceMotion = useReducedMotion();
  const transition = {
    duration: reduceMotion ? 0 : 0.18,
    ease: 'easeOut' as const,
  };

  return (
    <div className={classes.subtabs}>
      {TRANSACTION_TABS.map((t) => (
        <button
          type="button"
          key={t}
          className={activeTab === t ? classes.active : ''}
          onClick={() => onTabChange(t)}
        >
          {t[0].toUpperCase() + t.slice(1)}
          {activeTab === t && (
            <motion.span
              layoutId="planning-subtab-underline"
              className={classes.subtabUnderline}
              transition={transition}
            />
          )}
        </button>
      ))}
    </div>
  );
}

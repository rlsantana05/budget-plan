import { Check, Clock } from 'lucide-react';
import type { CategoryMeta } from '../../types/budget.types';
import classes from './MetaPill.module.css';

interface MetaPillProps {
  meta: CategoryMeta;
}

export default function MetaPill({ meta }: MetaPillProps) {
  const isDue = meta.type === 'due';
  const icon = isDue ? (
    <Clock size={11} className={classes.icon} aria-hidden="true" />
  ) : (
    <Check size={11} className={classes.icon} aria-hidden="true" />
  );

  return (
    <span
      className={`${classes.pill} ${isDue ? classes.due : classes.met}`}
      title={meta.text}
    >
      {icon}
      <span className={classes.text}>{meta.text}</span>
    </span>
  );
}
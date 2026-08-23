'use client';

import {
  Box, BoxProps, ElementProps, factory, Factory,
  StylesApiProps, useProps, useStyles,
} from '@mantine/core';
import { ChevronRight, Plus } from 'lucide-react';
import { formatCents } from '../../../utils/money';
import classes from './BudgetGroupHeader.module.css';

export type BudgetGroupHeaderStylesNames =
  | 'root'
  | 'header'
  | 'categoryCell'
  | 'title'
  | 'chevron'
  | 'assigned'
  | 'activity'
  | 'available'
  | 'addItem'
  | 'status';

export interface BudgetGroupHeaderProps
  extends BoxProps, StylesApiProps<BudgetGroupHeaderFactory>, ElementProps<'div'> {
  title: string;
  assignedCents?: number;
  activityCents?: number;
  availableCents?: number;
  availableTone?: 'pos' | 'neg' | 'zero';
  isExpanded?: boolean;
  itemCount?: number;
  onAddItem?: () => void;
}

export type BudgetGroupHeaderFactory = Factory<{
  props: BudgetGroupHeaderProps;
  ref: HTMLDivElement;
  stylesNames: BudgetGroupHeaderStylesNames;
}>;

const defaultProps = { isExpanded: false } satisfies Partial<BudgetGroupHeaderProps>;

export const BudgetGroupHeader = factory<BudgetGroupHeaderFactory>((_props) => {
  const props = useProps('BudgetGroupHeader', defaultProps, _props);
  const {
    classNames, className, style, styles, unstyled, vars, attributes,
    title,
    assignedCents,
    activityCents,
    availableCents,
    availableTone = 'zero',
    isExpanded, itemCount, onAddItem, ...others
  } = props;

  const getStyles = useStyles<BudgetGroupHeaderFactory>({
    name: 'BudgetGroupHeader',
    classes,
    props,
    className,
    style,
    classNames,
    styles,
    unstyled,
    vars,
    attributes,
  });

  return (
    <Box {...getStyles('root')} {...others}>
      <div {...getStyles('header')} data-expanded={isExpanded || undefined}>
        <span {...getStyles('categoryCell')}>
          <ChevronRight
            size={14}
            data-open={isExpanded || undefined}
            aria-hidden="true"
            {...getStyles('chevron')}
          />
          <span {...getStyles('title')}>
            <span>{title}</span>
          </span>
          {!isExpanded && typeof itemCount === 'number' && (
            <span
              {...getStyles('status')}
              data-state={itemCount > 0 ? 'has-data' : 'empty'}
              aria-label={itemCount > 0
                ? `${itemCount} ${itemCount === 1 ? 'category' : 'categories'}`
                : 'Empty group'}
            >
              {itemCount > 0 ? itemCount : 'Empty'}
            </span>
          )}
        </span>
        <div {...getStyles('assigned')} data-test="total-assigned">
          {typeof assignedCents === 'number' ? formatCents(assignedCents) : ''}
        </div>
        <div {...getStyles('activity')} data-test="total-activity">
          {typeof activityCents === 'number' ? formatCents(activityCents) : ''}
        </div>
        <div {...getStyles('available')} data-test="total-available" data-tone={availableTone}>
          {typeof availableCents === 'number' ? formatCents(availableCents) : ''}
        </div>
        <span
          {...getStyles('addItem')}
          role="button"
          tabIndex={0}
          aria-label={`Add item to ${title}`}
          onClick={(event) => {
            event.stopPropagation();
            onAddItem?.();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onAddItem?.();
            }
          }}
        >
          <Plus size={14} aria-hidden="true" />
        </span>
      </div>
    </Box>
  );
});

BudgetGroupHeader.displayName = '@mantine/core/BudgetGroupHeader';
BudgetGroupHeader.classes = classes;

'use client';

import {
  Box, BoxProps, ElementProps, factory, Factory,
  StylesApiProps, useProps, useStyles,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import classes from './BudgetGroupHeader.module.css';

export type BudgetGroupHeaderStylesNames =
  | 'root'
  | 'header'
  | 'title'
  | 'chevron'
  | 'available';

export interface BudgetGroupHeaderProps
  extends BoxProps, StylesApiProps<BudgetGroupHeaderFactory>, ElementProps<'div'> {
  title: string;
  available?: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
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
    title, available, isExpanded, onToggle, ...others
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
      <div {...getStyles('header')}>
        <button
          type="button"
          {...getStyles('title')}
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <ChevronDown
            size={14}
            data-collapsed={!isExpanded || undefined}
            {...getStyles('chevron')}
          />
          <span>{title}</span>
        </button>
        <div {...getStyles('available')} data-test="total-available">
          {available}
        </div>
      </div>
    </Box>
  );
});

BudgetGroupHeader.displayName = '@mantine/core/BudgetGroupHeader';
BudgetGroupHeader.classes = classes;

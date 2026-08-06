'use client';

import { TextInput } from '@mantine/core';
import { Search } from 'lucide-react';
import classes from './PlanningTransactionSearch.module.css';

interface PlanningTransactionSearchProps {
  searchQuery: string;
  onChange: (value: string) => void;
}

export default function PlanningTransactionSearch({
  searchQuery,
  onChange,
}: PlanningTransactionSearchProps) {
  return (
    <TextInput
      placeholder="Search"
      value={searchQuery}
      onChange={(e) => onChange(e.target.value)}
      className={classes.search}
      leftSection={<Search size={16} />}
    />
  );
}

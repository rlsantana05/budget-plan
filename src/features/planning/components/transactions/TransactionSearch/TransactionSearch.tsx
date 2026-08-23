'use client';

import { TextInput } from '@mantine/core';
import { Search } from 'lucide-react';
import classes from './TransactionSearch.module.css';

interface TransactionSearchProps {
  searchQuery: string;
  onChange: (value: string) => void;
}

export default function TransactionSearch({
  searchQuery,
  onChange,
}: TransactionSearchProps) {
  return (
    <TextInput
      placeholder="Search"
      value={searchQuery}
      onChange={(e) => onChange(e.target.value)}
      className={classes.search}
      leftSection={<Search size={16} />}
      leftSectionWidth={36}
      styles={{
        input: {
          paddingLeft: '36px',
        },
      }}
    />
  );
}

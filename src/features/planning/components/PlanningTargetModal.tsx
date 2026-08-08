'use client';

import { useState } from 'react';
import {
  Modal, NumberInput, SegmentedControl, TextInput,
} from '@mantine/core';
import type { GroupItem } from '../types';
import classes from './PlanningTargetModal.module.css';

export interface TargetFormState {
  type: 'NONE' | 'ONCE' | 'MONTHLY';
  /** Amount per occurrence (type ONCE/MONTHLY). */
  amount: number;
  /** yyyy-mm-dd, required when type === 'ONCE'. */
  dueDate: string;
  /** 1–31, required when type === 'MONTHLY'. */
  monthDay: number | string;
}

interface PlanningTargetModalProps {
  opened: boolean;
  onClose: () => void;
  item: GroupItem | null;
  busy: boolean;
  onSave: (state: TargetFormState) => void;
}

export function emptyTargetForm(): TargetFormState {
  return {
    type: 'MONTHLY', amount: 0, dueDate: '', monthDay: '',
  };
}

function formFromItem(item: GroupItem | null): TargetFormState {
  if (!item || item.targetType === 'NONE') return emptyTargetForm();
  return {
    type: item.targetType,
    amount: item.targetAmount,
    dueDate: item.targetType === 'ONCE' ? (item.targetDate ?? '') : '',
    monthDay: item.targetType === 'MONTHLY' ? (item.targetMonthDay ?? '') : '',
  };
}

export default function PlanningTargetModal({
  opened,
  onClose,
  item,
  busy,
  onSave,
}: PlanningTargetModalProps) {
  const [form, setForm] = useState<TargetFormState>(() => formFromItem(item));

  return (
    <Modal.Root opened={opened} onClose={onClose} centered>
      <Modal.Overlay backgroundOpacity={0.6} blur={3} />
      <Modal.Content className={classes.content}>
        <Modal.Header>
          <Modal.Title className={classes.title}>
            {item?.name ?? 'Category'}
            {' '}
            · Target
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!item) return;
              onSave(form);
            }}
          >
            <SegmentedControl
              fullWidth
              data={[
                { label: 'None', value: 'NONE' },
                { label: 'Once', value: 'ONCE' },
                { label: 'Monthly', value: 'MONTHLY' },
              ]}
              value={form.type}
              onChange={(value) => setForm((f) => ({
                ...f,
                type: value as TargetFormState['type'],
                amount: value === 'NONE' ? 0 : f.amount,
              }))}
            />

            {form.type !== 'NONE' && (
              <NumberInput
                label="Amount"
                value={form.amount}
                onChange={(v) => setForm((f) => ({
                  ...f,
                  amount: typeof v === 'number' ? v : 0,
                }))}
                min={0}
                decimalScale={2}
                placeholder="0.00"
                mt="sm"
              />
            )}

            {form.type === 'ONCE' && (
              <TextInput
                label="Due date"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  dueDate: e.target.value,
                }))}
                mt="sm"
              />
            )}

            {form.type === 'MONTHLY' && (
              <NumberInput
                label="Day of month"
                value={form.monthDay}
                onChange={(v) => setForm((f) => ({
                  ...f,
                  monthDay: typeof v === 'number' ? v : '',
                }))}
                min={1}
                max={31}
                clampBehavior="strict"
                mt="sm"
              />
            )}

            <div className={classes.actions}>
              <button
                type="button"
                className={classes.cancel}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={classes.save}
                disabled={busy || !item}
              >
                {busy ? 'Saving…' : 'Save target'}
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}

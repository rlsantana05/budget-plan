'use client';

import {
  Modal, NumberInput, Select, TextInput,
} from '@mantine/core';
import type { BudgetAccountOptionDTO } from '@/types/budget';
import sharedClasses from '../../shared/BudgetPlanShared.module.css';
import classes from './TransactionsModal.module.css';

interface TransactionsModalProps {
  opened: boolean;
  onClose: () => void;
  categoryOptions: Array<{ value: string; label: string }>;
  accountOptions: BudgetAccountOptionDTO[];
  txAmount: number;
  onTxAmountChange: (value: number) => void;
  txPayee: string;
  onTxPayeeChange: (value: string) => void;
  txMemo: string;
  onTxMemoChange: (value: string) => void;
  txCategory: string | null;
  onTxCategoryChange: (value: string | null) => void;
  txAccount: string | null;
  onTxAccountChange: (value: string | null) => void;
  onSubmit: () => void;
  busy: 'add' | 'row' | null;
  error: string | null;
}

export default function TransactionsModal({
  opened,
  onClose,
  txAmount,
  onTxAmountChange,
  txPayee,
  onTxPayeeChange,
  txMemo,
  onTxMemoChange,
  txCategory,
  onTxCategoryChange,
  txAccount,
  onTxAccountChange,
  categoryOptions,
  accountOptions,
  onSubmit,
  busy,
  error,
}: TransactionsModalProps) {
  return (
    <Modal.Root
      opened={opened}
      onClose={onClose}
      centered
      // duration 0 mounts content synchronously — no rAF dependency, so the
      // dialog appears instantly even in background/hidden tabs.
      transitionProps={{ duration: 0, transition: 'fade' }}
    >
      <Modal.Overlay backgroundOpacity={0.6} blur={3} />
      <Modal.Content
        className={classes.content}
      >
        <Modal.Header>
          <Modal.Title className={classes.modalTitle}>Add transaction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={classes.modalField}>
            <NumberInput
              label="Amount"
              value={txAmount}
              onChange={(v) => {
                let num = 0;
                if (typeof v === 'number') {
                  num = v;
                } else if (v) {
                  num = Number(v);
                }
                if (num !== txAmount) onTxAmountChange(num);
              }}
              min={0}
              decimalScale={2}
              autoFocus
            />
          </div>
          <div className={classes.modalField}>
            <TextInput
              label="Payee"
              value={txPayee}
              onChange={(e) => onTxPayeeChange(e.target.value)}
              placeholder="e.g. Kroger"
            />
          </div>
          <div className={classes.modalField}>
            <TextInput
              label="Memo (optional)"
              value={txMemo}
              onChange={(e) => onTxMemoChange(e.target.value)}
              placeholder="e.g. Weekly groceries"
            />
          </div>
          <div className={classes.modalField}>
            <Select
              label="Category"
              data={categoryOptions.length > 0
                ? categoryOptions
                : [{ value: '', label: 'Uncategorized' }]}
              value={txCategory != null ? txCategory : ''}
              onChange={onTxCategoryChange}
              searchable
              clearable
              placeholder="Select a category"
            />
          </div>
          <div className={classes.modalField}>
            <Select
              label="Account"
              data={accountOptions.map((a) => ({ value: a.id, label: a.name }))}
              value={txAccount}
              onChange={onTxAccountChange}
              required
              placeholder="Select an account"
            />
          </div>
          {error && <div className={sharedClasses.error}>{error}</div>}
          <div className={classes.modalActions}>
            <button
              type="button"
              className={`${classes.modalButton} ${classes.secondary}`}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={classes.modalButton}
              onClick={onSubmit}
              disabled={busy === 'add'}
            >
              {busy === 'add' ? 'Saving…' : 'Add transaction'}
            </button>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}

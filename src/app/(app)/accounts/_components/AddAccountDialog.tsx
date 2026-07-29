"use client";

import { useState } from "react";
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Check, Landmark, Wallet } from "lucide-react";
import type { Account, AccountType, BankingAccountType } from "@/types/account";
import classes from "./AddAccountDialog.module.css";

interface AddAccountDialogProps {
  opened: boolean;
  onClose: () => void;
  onAccountCreated: (account: Account) => void;
}

export default function AddAccountDialog({
  opened,
  onClose,
  onAccountCreated,
}: AddAccountDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  const bankingForm = useForm({
    mode: "uncontrolled",
    initialValues: {
      bankingAccountType: "" as BankingAccountType | "",
      institutionName: "",
      nickname: "",
      balance: 0,
    },
    validate: {
      bankingAccountType: (v) =>
        !v ? "Select an account type" : null,
      institutionName: (v) =>
        !v.trim() ? "Institution name is required" : null,
    },
  });

  const cashForm = useForm({
    mode: "uncontrolled",
    initialValues: {
      nickname: "",
      balance: 0,
    },
    validate: {
      nickname: (v) => (!v.trim() ? "Nickname is required" : null),
    },
  });

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    bankingForm.reset();
    cashForm.reset();
    onClose();
  };

  const handleNext = () => {
    if (selectedType) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleBankingSubmit = bankingForm.onSubmit((values) => {
    const account: Account = {
      id: crypto.randomUUID(),
      type: "banking",
      nickname: values.nickname || values.institutionName,
      balance: values.balance,
      createdAt: new Date(),
      bankingAccountType: values.bankingAccountType as BankingAccountType,
      institutionName: values.institutionName,
    };
    onAccountCreated(account);
    handleClose();
  });

  const handleCashSubmit = cashForm.onSubmit((values) => {
    const account: Account = {
      id: crypto.randomUUID(),
      type: "cash",
      nickname: values.nickname,
      balance: values.balance,
      createdAt: new Date(),
    };
    onAccountCreated(account);
    handleClose();
  });

  const bankingValid =
    bankingForm.isValid() &&
    bankingForm.values.bankingAccountType !== "" &&
    bankingForm.values.institutionName.trim() !== "";

  const cashValid =
    cashForm.isValid() && cashForm.values.nickname.trim() !== "";

  return (
    <Modal.Root
      opened={opened}
      onClose={handleClose}
      size={580}
      padding={0}
    >
      <Modal.Overlay backgroundOpacity={0.6} blur={3} />
      <Modal.Content
        style={{
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          background: "var(--mantine-color-surface-2)",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Modal.Header
          style={{
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            padding: "20px 24px",
          }}
        >
          <Stack gap={2}>
            <Title order={3} style={{ fontSize: 17, fontWeight: 600 }}>
              Add Account
            </Title>
            <Text size="sm" c="dimmed">
              {step === 1
                ? "Choose the type of account you want to add."
                : selectedType === "banking"
                  ? "Banking Details"
                  : "Cash Details"}
            </Text>
          </Stack>
          <Modal.CloseButton />
        </Modal.Header>

        {step === 1 && (
          <>
            <Stack p="24px" gap="md" className={classes.stepContent}>
              <Group grow gap="md">
                <div
                  className={`${classes.card} ${selectedType === "banking" ? classes.cardSelected : ""}`}
                  onClick={() => setSelectedType("banking")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedType("banking");
                    }
                  }}
                >
                  {selectedType === "banking" && (
                    <div className={classes.checkmark}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                  <Stack align="center" gap="xs">
                    <Landmark size={32} strokeWidth={1.5} />
                    <Text fw={600} size="lg">
                      Banking
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Checking, savings, and money market accounts.
                    </Text>
                  </Stack>
                </div>

                <div
                  className={`${classes.card} ${selectedType === "cash" ? classes.cardSelected : ""}`}
                  onClick={() => setSelectedType("cash")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedType("cash");
                    }
                  }}
                >
                  {selectedType === "cash" && (
                    <div className={classes.checkmark}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                  <Stack align="center" gap="xs">
                    <Wallet size={32} strokeWidth={1.5} />
                    <Text fw={600} size="lg">
                      Cash
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Physical cash or a cash wallet.
                    </Text>
                  </Stack>
                </div>
              </Group>
            </Stack>

            <Group
              justify="space-between"
              p="16px 24px"
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <Button variant="default" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedType}
                style={{
                  backgroundColor: selectedType ? "#5D65B7" : undefined,
                  borderColor: selectedType ? "#5D65B7" : undefined,
                }}
              >
                Next
              </Button>
            </Group>
          </>
        )}

        {step === 2 && selectedType === "banking" && (
          <form onSubmit={handleBankingSubmit}>
            <Stack p="24px" gap="md" className={classes.stepContent}>
              <div>
                <Text className={classes.label} component="label" htmlFor="banking-account-type">
                  Banking Account Type
                </Text>
                <Select
                  id="banking-account-type"
                  placeholder="Select type"
                  data={[
                    { value: "checking", label: "Checking" },
                    { value: "savings", label: "Savings" },
                    { value: "money-market", label: "Money Market" },
                  ]}
                  classNames={{ input: classes.input }}
                  {...bankingForm.getInputProps("bankingAccountType")}
                />
              </div>

              <div>
                <Text className={classes.label} component="label" htmlFor="institution-name">
                  Institution Name
                </Text>
                <TextInput
                  id="institution-name"
                  placeholder="Chase Bank"
                  classNames={{ input: classes.input }}
                  {...bankingForm.getInputProps("institutionName")}
                />
              </div>

              <div>
                <Text className={classes.label} component="label" htmlFor="banking-nickname">
                  Account Nickname
                </Text>
                <TextInput
                  id="banking-nickname"
                  placeholder="Everyday Checking"
                  classNames={{ input: classes.input }}
                  {...bankingForm.getInputProps("nickname")}
                />
              </div>

              <div>
                <Text className={classes.label} component="label" htmlFor="banking-balance">
                  Current Balance
                </Text>
                <NumberInput
                  id="banking-balance"
                  placeholder="$0.00"
                  prefix="$"
                  decimalScale={2}
                  fixedDecimalScale
                  hideControls
                  classNames={{ input: classes.input }}
                  {...bankingForm.getInputProps("balance")}
                />
              </div>
            </Stack>

            <Group
              justify="space-between"
              p="16px 24px"
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <Group gap="xs">
                <Button variant="default" onClick={handleBack}>
                  Back
                </Button>
                <Button variant="default" onClick={handleClose}>
                  Cancel
                </Button>
              </Group>
              <Button
                type="submit"
                disabled={!bankingValid}
                style={{
                  backgroundColor: bankingValid ? "#5D65B7" : undefined,
                  borderColor: bankingValid ? "#5D65B7" : undefined,
                }}
              >
                Add Account
              </Button>
            </Group>
          </form>
        )}

        {step === 2 && selectedType === "cash" && (
          <form onSubmit={handleCashSubmit}>
            <Stack p="24px" gap="md" className={classes.stepContent}>
              <div>
                <Text className={classes.label} component="label" htmlFor="cash-nickname">
                  Account Nickname
                </Text>
                <TextInput
                  id="cash-nickname"
                  placeholder="Wallet"
                  classNames={{ input: classes.input }}
                  {...cashForm.getInputProps("nickname")}
                />
              </div>

              <div>
                <Text className={classes.label} component="label" htmlFor="cash-balance">
                  Current Balance
                </Text>
                <NumberInput
                  id="cash-balance"
                  placeholder="$0.00"
                  prefix="$"
                  decimalScale={2}
                  fixedDecimalScale
                  hideControls
                  classNames={{ input: classes.input }}
                  {...cashForm.getInputProps("balance")}
                />
              </div>
            </Stack>

            <Group
              justify="space-between"
              p="16px 24px"
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <Group gap="xs">
                <Button variant="default" onClick={handleBack}>
                  Back
                </Button>
                <Button variant="default" onClick={handleClose}>
                  Cancel
                </Button>
              </Group>
              <Button
                type="submit"
                disabled={!cashValid}
                style={{
                  backgroundColor: cashValid ? "#5D65B7" : undefined,
                  borderColor: cashValid ? "#5D65B7" : undefined,
                }}
              >
                Add Account
              </Button>
            </Group>
          </form>
        )}
      </Modal.Content>
    </Modal.Root>
  );
}

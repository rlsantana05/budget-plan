"use client";

import { useState } from "react";
import {
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
import { Landmark, Wallet } from "lucide-react";
import { createAccount, updateAccount } from "@/actions/accounts";
import type {
  AccountDTO,
  AccountType,
  CreateAccountInput,
} from "@/types/account";
import DialogFooter from "./DialogFooter";
import FieldLabel from "./FieldLabel";
import TypeCard from "./TypeCard";
import classes from "./AccountDialog.module.css";

type BankingAccountType = "checking" | "savings" | "money-market";
type AccountCategory = "banking" | "cash";

const bankingTypeMap: Record<BankingAccountType, AccountType> = {
  checking: "CHECKING",
  savings: "SAVINGS",
  "money-market": "MONEY_MARKET",
};

function dbTypeToForm(type: AccountType): BankingAccountType {
  switch (type) {
    case "SAVINGS":
      return "savings";
    case "MONEY_MARKET":
      return "money-market";
    default:
      return "checking";
  }
}

function categoryOf(account: AccountDTO): AccountCategory {
  return account.type === "CASH" ? "cash" : "banking";
}

interface AccountDialogProps {
  opened: boolean;
  onClose: () => void;
  account?: AccountDTO | null;
  onAccountCreated: (account: AccountDTO) => void;
  onAccountUpdated: (account: AccountDTO) => void;
}

export default function AccountDialog({
  opened,
  onClose,
  account = null,
  onAccountCreated,
  onAccountUpdated,
}: AccountDialogProps) {
  const isEdit = account !== null;
  const [step, setStep] = useState<1 | 2>(isEdit ? 2 : 1);
  const [selectedType, setSelectedType] = useState<AccountCategory | null>(
    account ? categoryOf(account) : null,
  );
  const [submitting, setSubmitting] = useState(false);

  const bankingForm = useForm({
    mode: "uncontrolled",
    initialValues: {
      bankingAccountType: account
        ? dbTypeToForm(account.type)
        : ("" as BankingAccountType | ""),
      institutionName: account?.institutionName ?? "",
      nickname: account?.name ?? "",
      balance: account?.balance ?? 0,
    },
    validate: {
      bankingAccountType: (v) => (!v ? "Select an account type" : null),
      institutionName: (v) =>
        !v.trim() ? "Institution name is required" : null,
    },
  });

  const cashForm = useForm({
    mode: "uncontrolled",
    initialValues: {
      nickname: account?.name ?? "",
      balance: account?.balance ?? 0,
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

  const submit = async (input: CreateAccountInput) => {
    setSubmitting(true);
    try {
      const result =
        isEdit && account
          ? await updateAccount(account.id, input)
          : await createAccount(input);
      if (isEdit && account) {
        onAccountUpdated(result);
      } else {
        onAccountCreated(result);
      }
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleBankingSubmit = bankingForm.onSubmit((values) =>
    submit({
      name: values.nickname || values.institutionName,
      type: bankingTypeMap[values.bankingAccountType as BankingAccountType],
      institutionName: values.institutionName,
      balance: values.balance,
    }),
  );

  const handleCashSubmit = cashForm.onSubmit((values) =>
    submit({
      name: values.nickname,
      type: "CASH",
      balance: values.balance,
    }),
  );

  const bankingValid =
    bankingForm.isValid() &&
    bankingForm.values.bankingAccountType !== "" &&
    bankingForm.values.institutionName.trim() !== "";

  const cashValid =
    cashForm.isValid() && cashForm.values.nickname.trim() !== "";

  return (
    <Modal.Root opened={opened} onClose={handleClose} size={580} padding={0}>
      <Modal.Overlay backgroundOpacity={0.6} blur={3} />
      <Modal.Content className={classes.content}>
        <Modal.Header className={classes.header}>
          <Stack gap={2}>
            <Title order={3} style={{ fontSize: 17, fontWeight: 600 }}>
              {isEdit ? "Edit Account" : "Add Account"}
            </Title>
            <Text size="sm" c="dimmed">
              {isEdit
                ? "Update the details of your account."
                : step === 1
                  ? "Choose the type of account you want to add."
                  : selectedType === "banking"
                    ? "Banking Details"
                    : "Cash Details"}
            </Text>
          </Stack>
          <Modal.CloseButton />
        </Modal.Header>

        {!isEdit && step === 1 && (
          <>
            <Stack p="24px" gap="md" className={classes.stepContent}>
              <Group grow gap="md">
                <TypeCard
                  title="Banking"
                  description="Checking, savings, and money market accounts."
                  icon={<Landmark size={32} strokeWidth={1.5} />}
                  selected={selectedType === "banking"}
                  onSelect={() => setSelectedType("banking")}
                />

                <TypeCard
                  title="Cash"
                  description="Physical cash or a cash wallet."
                  icon={<Wallet size={32} strokeWidth={1.5} />}
                  selected={selectedType === "cash"}
                  onSelect={() => setSelectedType("cash")}
                />
              </Group>
            </Stack>

            <DialogFooter
              onCancel={handleClose}
              submitLabel="Next"
              submitDisabled={!selectedType}
              buttonType="button"
              onButtonClick={handleNext}
            />
          </>
        )}

        {step === 2 && selectedType === "banking" && (
          <form onSubmit={handleBankingSubmit}>
            <Stack p="24px" gap="md" className={classes.stepContent}>
              <div>
                <FieldLabel htmlFor="banking-account-type">
                  Banking Account Type
                </FieldLabel>
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
                <FieldLabel htmlFor="institution-name">
                  Institution Name
                </FieldLabel>
                <TextInput
                  id="institution-name"
                  placeholder="Chase Bank"
                  classNames={{ input: classes.input }}
                  {...bankingForm.getInputProps("institutionName")}
                />
              </div>

              <div>
                <FieldLabel htmlFor="banking-nickname">
                  Account Nickname
                </FieldLabel>
                <TextInput
                  id="banking-nickname"
                  placeholder="Everyday Checking"
                  classNames={{ input: classes.input }}
                  {...bankingForm.getInputProps("nickname")}
                />
              </div>

              <div>
                <FieldLabel htmlFor="banking-balance">
                  Current Balance
                </FieldLabel>
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

            <DialogFooter
              onBack={isEdit ? undefined : handleBack}
              onCancel={handleClose}
              submitLabel={isEdit ? "Save Changes" : "Add Account"}
              submitDisabled={!bankingValid || submitting}
              submitting={submitting}
              buttonType="submit"
            />
          </form>
        )}

        {step === 2 && selectedType === "cash" && (
          <form onSubmit={handleCashSubmit}>
            <Stack p="24px" gap="md" className={classes.stepContent}>
              <div>
                <FieldLabel htmlFor="cash-nickname">Account Nickname</FieldLabel>
                <TextInput
                  id="cash-nickname"
                  placeholder="Wallet"
                  classNames={{ input: classes.input }}
                  {...cashForm.getInputProps("nickname")}
                />
              </div>

              <div>
                <FieldLabel htmlFor="cash-balance">Current Balance</FieldLabel>
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

            <DialogFooter
              onBack={isEdit ? undefined : handleBack}
              onCancel={handleClose}
              submitLabel={isEdit ? "Save Changes" : "Add Account"}
              submitDisabled={!cashValid || submitting}
              submitting={submitting}
              buttonType="submit"
            />
          </form>
        )}
      </Modal.Content>
    </Modal.Root>
  );
}

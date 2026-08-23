"use client";

import { useState } from "react";
import {
  Button,
  Group,
  Menu,
  Modal,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Ellipsis, Landmark, Pencil, PlusIcon, Trash, Wallet } from "lucide-react";
import { deleteAccount } from "@/actions/accounts";
import AccountDialog from "./AccountDialog";
import type { AccountDTO, AccountType } from "@/types/account";
import classes from "../AccountsPage.module.css";

interface AccountsClientProps {
  initialAccounts: AccountDTO[];
}

export default function AccountsClient({
  initialAccounts,
}: AccountsClientProps) {
  const [accounts, setAccounts] = useState<AccountDTO[]>(initialAccounts);
  const [opened, { open, close }] = useDisclosure(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [editingAccount, setEditingAccount] = useState<AccountDTO | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AccountDTO | null>(
    null,
  );
  const [deleteOpen, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [deleting, setDeleting] = useState(false);
  const [fadeState, setFadeState] = useState<"empty" | "fading" | "list">(
    initialAccounts.length > 0 ? "list" : "empty",
  );

  const openCreateDialog = () => {
    setEditingAccount(null);
    setDialogKey((prev) => prev + 1);
    open();
  };

  const openEditDialog = (account: AccountDTO) => {
    setEditingAccount(account);
    setDialogKey((prev) => prev + 1);
    open();
  };

  const handleAccountCreated = (account: AccountDTO) => {
    setAccounts((prev) => [...prev, account]);
    if (fadeState !== "list") {
      setFadeState("fading");
      setTimeout(() => setFadeState("list"), 200);
    }
  };

  const handleAccountUpdated = (updated: AccountDTO) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a)),
    );
  };

  const handleDeleteRequest = (account: AccountDTO) => {
    setDeletingAccount(account);
    openDelete();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    setDeleting(true);
    try {
      await deleteAccount(deletingAccount.id);
      setAccounts((prev) =>
        prev.filter((a) => a.id !== deletingAccount.id),
      );
      closeDelete();
      setDeletingAccount(null);
      if (accounts.length === 1) {
        setFadeState("fading");
        setTimeout(() => setFadeState("empty"), 200);
      }
    } finally {
      setDeleting(false);
    }
  };

  const hasAccounts = accounts.length > 0;

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <>
      {!hasAccounts ? (
        <div
          className={`${classes.root} ${fadeState === "fading" ? classes.fadeOut : ""} ${fadeState === "list" ? classes.hidden : ""}`}
        >
          <svg aria-hidden="true" className={classes.noiseOverlay}>
            <filter id="eas-noise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="2"
                stitchTiles="stitch"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#eas-noise)" />
          </svg>
          <div className={classes.glow} aria-hidden="true" />
          <svg
            className={classes.watermark}
            viewBox="0 0 120 120"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="60"
              cy="60"
              r="40"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M60 34v52M46 44c0-6 6-8 14-8s14 4 14 9-6 7-14 8-14 3-14 9 6 9 14 9 14-2 14-8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <Stack align="center" className={classes.content}>
            <svg
              className={classes.illustration}
              width="88"
              height="88"
              viewBox="0 0 88 88"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="14"
                y="34"
                width="46"
                height="34"
                rx="7"
                stroke="rgba(199,203,214,0.55)"
                strokeWidth="1.5"
              />
              <path
                d="M14 44h46"
                stroke="rgba(199,203,214,0.3)"
                strokeWidth="1.5"
              />
              <circle cx="50" cy="51" r="2.5" fill="rgba(129,140,248,0.9)" />
              <g transform="rotate(-9 60 26)">
                <rect
                  x="42"
                  y="14"
                  width="34"
                  height="22"
                  rx="4.5"
                  fill="#0a0b0f"
                  stroke="rgba(129,140,248,0.65)"
                  strokeWidth="1.5"
                />
                <path
                  d="M42 21.5h34"
                  stroke="rgba(129,140,248,0.4)"
                  strokeWidth="1.5"
                />
                <rect
                  x="46.5"
                  y="26.5"
                  width="9"
                  height="2.4"
                  rx="1.2"
                  fill="rgba(129,140,248,0.5)"
                />
              </g>
              <circle
                cx="18"
                cy="66"
                r="10"
                fill="#0a0b0f"
                stroke="rgba(199,203,214,0.5)"
                strokeWidth="1.5"
              />
              <path
                d="M18 61v10M15 63.8c0-1.4 1.4-2 3-2s3 .8 3 1.9-1.3 1.5-3 1.7-3 .6-3 1.9 1.4 1.9 3 1.9 3-.4 3-1.7"
                stroke="rgba(199,203,214,0.55)"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </svg>
            <Title order={2} style={{ fontSize: 33, letterSpacing: "-0.02em" }}>
              No accounts yet
            </Title>
            <Text c="dimmed" className={classes.description}>
              Add your first account to start tracking your money and building
              your financial plan.
            </Text>
            <Button
              leftSection={<PlusIcon size={15} />}
              mt="xl"
              variant="default"
              radius="md"
              size="md"
              className={classes.cta}
              onClick={openCreateDialog}
            >
              Add your first account
            </Button>
            <Text className={classes.caption}>Takes less than a minute</Text>
          </Stack>
        </div>
      ) : (
        <div
          className={`${classes.accountsRoot} ${fadeState === "list" ? classes.fadeIn : ""}`}
        >
          <div className={classes.pageHeader}>
            <div>
              <h1 className={classes.title}>Accounts</h1>
              <div className={classes.summary}>
                <strong>${totalBalance.toFixed(2)}</strong> total across{" "}
                {accounts.length}{" "}
                {accounts.length === 1 ? "account" : "accounts"}
              </div>
            </div>
          </div>

          <div className={classes.grid}>
            {accounts.map((account) => {
              const isBanking = account.type !== "CASH";
              return (
                <div key={account.id} className={classes.card}>
                  <Menu position="bottom-end" withArrow arrowPosition="center">
                    <Menu.Target>
                      <button
                        className={classes.kebab}
                        aria-label="Account menu"
                        aria-haspopup="menu"
                      >
                        <Ellipsis size={16} />
                      </button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<Pencil size={15} />}
                        onClick={() => openEditDialog(account)}
                      >
                        Edit account
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<Trash size={15} />}
                        color="red"
                        onClick={() => handleDeleteRequest(account)}
                      >
                        Delete account
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                  <div className={classes.cardTop}>
                    <div
                      className={classes.badge}
                      style={{
                        background: isBanking
                          ? "rgba(99,102,241,0.10)"
                          : "rgba(52,211,153,0.10)",
                        borderColor: isBanking
                          ? "rgba(99,102,241,0.22)"
                          : "rgba(52,211,153,0.22)",
                      }}
                    >
                      {isBanking ? (
                        <Landmark
                          size={20}
                          strokeWidth={1.75}
                          style={{ color: "rgb(99,102,241)" }}
                        />
                      ) : (
                        <Wallet
                          size={20}
                          strokeWidth={1.75}
                          style={{ color: "rgb(52,211,153)" }}
                        />
                      )}
                    </div>
                    <div>
                      <div className={classes.cardName}>{account.name}</div>
                      <div className={classes.cardSub}>
                        {isBanking
                          ? `${accountTypeLabel(account.type)} · ${account.institutionName ?? ""}`
                          : "Cash"}
                      </div>
                    </div>
                  </div>
                  <div className={classes.cardBalance}>
                    ${account.balance.toFixed(2)}
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              className={classes.ghostCard}
              onClick={openCreateDialog}
            >
              <div className={classes.ghostCircle}>
                <PlusIcon size={15} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Add account</span>
            </button>
          </div>
        </div>
      )}

      <AccountDialog
        key={`${dialogKey}-${editingAccount?.id ?? "new"}`}
        opened={opened}
        onClose={close}
        account={editingAccount}
        onAccountCreated={handleAccountCreated}
        onAccountUpdated={handleAccountUpdated}
      />

      <Modal.Root opened={deleteOpen} onClose={closeDelete} size={420}>
        <Modal.Overlay backgroundOpacity={0.6} blur={3} />
        <Modal.Content
          style={{
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            background: "var(--mantine-color-surface-2)",
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
            padding: "24px",
          }}
        >
          <Stack gap="xs">
            <Title order={3} style={{ fontSize: 17, fontWeight: 600 }}>
              Delete account?
            </Title>
            <Text size="sm" c="dimmed">
              <strong>{deletingAccount?.name}</strong> will be hidden from your
              accounts. Its history is kept so you can recover it later.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeDelete} disabled={deleting}>
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleDeleteConfirm}
                loading={deleting}
              >
                Delete
              </Button>
            </Group>
          </Stack>
        </Modal.Content>
      </Modal.Root>
    </>
  );
}

function accountTypeLabel(type: AccountType) {
  switch (type) {
    case "CHECKING":
      return "Checking";
    case "SAVINGS":
      return "Savings";
    case "MONEY_MARKET":
      return "Money Market";
    case "CREDIT_CARD":
      return "Credit Card";
    case "CASH":
      return "Cash";
    case "INVESTMENT":
      return "Investment";
    case "OTHER":
      return "Other";
  }
}

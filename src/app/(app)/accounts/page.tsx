"use client";

import { useState } from "react";
import { Button, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Landmark, PlusIcon, Wallet } from "lucide-react";
import AddAccountDialog from "./_components/AddAccountDialog";
import type { Account } from "@/types/account";
import classes from "./AccountsPage.module.css";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [fadeState, setFadeState] = useState<"empty" | "fading" | "list">("empty");

  const openDialog = () => {
    setDialogKey((prev) => prev + 1);
    open();
  };

  const handleAccountCreated = (account: Account) => {
    setAccounts((prev) => [...prev, account]);
    setFadeState("fading");
    setTimeout(() => setFadeState("list"), 200);
  };

  const hasAccounts = accounts.length > 0;

  return (
    <>
      {!hasAccounts ? (
        <div
          className={`${classes.root} ${fadeState === "fading" ? classes.fadeOut : ""} ${fadeState === "list" ? classes.hidden : ""}`}
        >
          <svg aria-hidden="true" className={classes.noiseOverlay}>
            <filter id="eas-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
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
            <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="1.5" />
            <path d="M60 34v52M46 44c0-6 6-8 14-8s14 4 14 9-6 7-14 8-14 3-14 9 6 9 14 9 14-2 14-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
              <rect x="14" y="34" width="46" height="34" rx="7" stroke="rgba(199,203,214,0.55)" strokeWidth="1.5" />
              <path d="M14 44h46" stroke="rgba(199,203,214,0.3)" strokeWidth="1.5" />
              <circle cx="50" cy="51" r="2.5" fill="rgba(129,140,248,0.9)" />
              <g transform="rotate(-9 60 26)">
                <rect x="42" y="14" width="34" height="22" rx="4.5" fill="#0a0b0f" stroke="rgba(129,140,248,0.65)" strokeWidth="1.5" />
                <path d="M42 21.5h34" stroke="rgba(129,140,248,0.4)" strokeWidth="1.5" />
                <rect x="46.5" y="26.5" width="9" height="2.4" rx="1.2" fill="rgba(129,140,248,0.5)" />
              </g>
              <circle cx="18" cy="66" r="10" fill="#0a0b0f" stroke="rgba(199,203,214,0.5)" strokeWidth="1.5" />
              <path d="M18 61v10M15 63.8c0-1.4 1.4-2 3-2s3 .8 3 1.9-1.3 1.5-3 1.7-3 .6-3 1.9 1.4 1.9 3 1.9 3-.4 3-1.7" stroke="rgba(199,203,214,0.55)" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
            <Title order={2} style={{ fontSize: 33, letterSpacing: "-0.02em" }}>
              No accounts yet
            </Title>
            <Text c="dimmed" className={classes.description}>
              Add your first account to start tracking your money and building your financial plan.
            </Text>
            <Button
              leftSection={<PlusIcon size={15} />}
              mt="xl"
              variant="default"
              radius="md"
              size="md"
              className={classes.cta}
              onClick={openDialog}
            >
              Add your first account
            </Button>
            <Text className={classes.caption}>Takes less than a minute</Text>
          </Stack>
        </div>
      ) : (
        <div className={`${classes.listRoot} ${fadeState === "list" ? classes.fadeIn : ""}`}>
          <Group justify="space-between" mb="lg">
            <Title order={2}>Accounts</Title>
            <Button
              leftSection={<PlusIcon size={15} />}
              variant="default"
              radius="md"
              size="sm"
              onClick={openDialog}
            >
              Add Account
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {accounts.map((account) => (
              <Card
                key={account.id}
                withBorder
                padding="lg"
                radius="md"
                bg="surface.1"
              >
                <Group mb="xs">
                  {account.type === "banking" ? (
                    <Landmark size={20} strokeWidth={1.5} />
                  ) : (
                    <Wallet size={20} strokeWidth={1.5} />
                  )}
                  <div style={{ flex: 1 }}>
                    <Text fw={600} size="sm">
                      {account.nickname}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {account.type === "banking"
                        ? `${capitalize(account.bankingAccountType ?? "")} · ${account.institutionName}`
                        : "Cash"}
                    </Text>
                  </div>
                </Group>
                <Text fz={24} fw={700}>
                  ${account.balance.toFixed(2)}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </div>
      )}

      <AddAccountDialog
        key={dialogKey}
        opened={opened}
        onClose={close}
        onAccountCreated={handleAccountCreated}
      />
    </>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

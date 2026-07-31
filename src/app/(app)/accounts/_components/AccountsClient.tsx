"use client";

import { useState } from "react";
import { Button, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Ellipsis, Landmark, PlusIcon, Wallet } from "lucide-react";
import AddAccountDialog from "./AddAccountDialog";
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
  const [fadeState, setFadeState] = useState<"empty" | "fading" | "list">(
    initialAccounts.length > 0 ? "list" : "empty",
  );

  const openDialog = () => {
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
              onClick={openDialog}
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
                  <button className={classes.kebab} aria-label="Account menu">
                    <Ellipsis size={16} />
                  </button>
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

            <div
              className={classes.ghostCard}
              onClick={openDialog}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openDialog();
                }
              }}
            >
              <div className={classes.ghostCircle}>
                <PlusIcon size={15} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Add account</span>
            </div>
          </div>
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

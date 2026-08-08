"use client";

import {
  ActionIcon,
  Avatar,
  Box,
  Burger,
  Group,
  NavLink,
  Overlay,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  BanknoteIcon,
  BellIcon,
  CrosshairIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  SettingsIcon,
  WalletIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ColorSchemeToggle } from "./_components/ColorSchemeToggle";
import classes from "./AppLayout.module.css";

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboardIcon },
  { label: "Planning", href: "/planning", icon: ScrollTextIcon },
  { label: "Accounts", href: "/accounts", icon: WalletIcon },
  { label: "Goals", href: "/goals", icon: CrosshairIcon },
];

function Sidebar({ close }: { close?: () => void }) {
  const pathname = usePathname();

  return (
    <Stack h="100%" gap={0}>
      <Stack gap={2} mt="5rem" style={{ flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            component={Link}
            href={item.href}
            label={item.label}
            leftSection={<item.icon size={18} />}
            active={
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            }
            className={classes.navLink}
            variant="light"
            color="blue"
            onClick={close}
          />
        ))}
      </Stack>

      <NavLink
        component={Link}
        href="/settings"
        label="Settings"
        leftSection={<SettingsIcon size={18} />}
        active={pathname.startsWith("/settings")}
        className={classes.navLink}
        variant="light"
        color="blue"
        onClick={close}
      />
    </Stack>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <Box className={classes.shell}>
      <Group px="md" py="md">
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <BanknoteIcon size={24} />
        <Text fw={700} size="lg" c="indigo">
          Budget Plan
        </Text>
        <div style={{ flex: 1 }} />
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          aria-label="Notifications"
        >
          <BellIcon size={18} />
        </ActionIcon>
        <ColorSchemeToggle />
        <Avatar src={null} alt="User" radius="xl" color="blue">
          U
        </Avatar>
      </Group>

      <Box className={classes.body}>
        <Box visibleFrom="sm" className={classes.sidebar}>
          <Sidebar />
        </Box>

        {opened && (
          <>
            <Overlay onClick={close} zIndex={200} />
            <Box
              className={classes.sidebarMobile}
              bg="surface.1"
              px="xs"
              pb="xs"
              pt="md"
            >
              <Sidebar close={close} />
            </Box>
          </>
        )}

        <Paper className={classes.mainPanel} bg="surface.2" p="md">
          {children}
        </Paper>
      </Box>
    </Box>
  );
}

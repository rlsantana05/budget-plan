"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "lucide-react";
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import classes from "./Dashboard.module.css";

export default function Dashboard() {
  return (
    <Box px="20rem">
      <div>
        <Group justify="center" mb="xl">
          <ActionIcon variant="subtle" color="gray" aria-label="Previous month">
            <ChevronLeftIcon size={20} />
          </ActionIcon>
          <Title order={2}>July 2026</Title>
          <ActionIcon variant="subtle" color="gray" aria-label="Next month">
            <ChevronRightIcon size={20} />
          </ActionIcon>
        </Group>

        <Stack align="center" mb={48}>
          <Text size="sm" c="dimmed">
            Available to Allocate
          </Text>
          <Text
            fz={48}
            fw={700}
            style={{ lineHeight: 1 }}
            variant="gradient"
            gradient={{ from: "teal", to: "green", deg: 90 }}
          >
            $0.00
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 2, lg: 4 }} mb={48}>
          <Card withBorder padding="lg" radius="md" bg="surface.1" className={classes.nestedCard}>
            <Text size="sm" c="dimmed" mb={4}>
              Planned
            </Text>
            <Text size="xl" fw={700}>
              $0.00
            </Text>
          </Card>

          <Card withBorder padding="lg" radius="md" bg="surface.1" className={classes.nestedCard}>
            <Text size="sm" c="dimmed" mb={4}>
              Funded
            </Text>
            <Text size="xl" fw={700} c="teal">
              $0.00
            </Text>
          </Card>

          <Card withBorder padding="lg" radius="md" bg="surface.1" className={classes.nestedCard}>
            <Text size="sm" c="dimmed" mb={4}>
              Spent
            </Text>
            <Text size="xl" fw={700} c="orange">
              $0.00
            </Text>
          </Card>

          <Card withBorder padding="lg" radius="md" bg="surface.1" className={classes.nestedCard}>
            <Text size="sm" c="dimmed" mb={4}>
              Remaining
            </Text>
            <Text size="xl" fw={700}>
              $0.00
            </Text>
          </Card>
        </SimpleGrid>

        <Paper withBorder p={48} bg="surface.1" style={{ borderStyle: "dashed" }}>
          <Stack align="center" gap="xs">
            <Title order={3}>Welcome to Budget Plan</Title>
            <Text size="sm" c="dimmed">
              Start by adding an account and planning your first month.
            </Text>
            <Button leftSection={<PlusIcon size={16} />} mt="md">
              New Account
            </Button>
          </Stack>
        </Paper>
      </div>
    </Box>
  );
}

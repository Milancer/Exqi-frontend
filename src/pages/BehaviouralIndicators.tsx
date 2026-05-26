import { useEffect, useMemo, useState } from "react";
import {
  Title,
  Text,
  Stack,
  Button,
  Paper,
  Group,
  Table,
  Badge,
  Box,
  Loader,
  Alert,
  Divider,
} from "@mantine/core";
import {
  IconDownload,
  IconAlertCircle,
  IconCategory,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import api from "../services/api";

interface BiLevel {
  bi_level_id: number;
  level: number;
  level_label: string;
  level_subtitle: string;
  indicators: string[];
}

interface BiCompetency {
  bi_competency_id: number;
  category: string;
  competency_name: string;
  description: string;
  sort_order: number;
  levels: BiLevel[];
}

const LEVEL_COLORS: Record<number, string> = {
  1: "gray",
  2: "blue",
  3: "teal",
  4: "violet",
  5: "orange",
};

export default function BehaviouralIndicators() {
  const [data, setData] = useState<BiCompetency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/behavioural-indicators/pdf", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "CBI Behavioural Indicators.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: unknown } };
      // Blob responses don't auto-parse error JSON; try to read it
      let message = "Failed to download PDF";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          message = JSON.parse(text)?.message || message;
        } catch {
          /* keep generic message */
        }
      }
      notifications.show({
        title: "Download failed",
        message,
        color: "red",
      });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<BiCompetency[]>("/behavioural-indicators")
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e.response?.data?.message ||
              "Failed to load behavioural indicators",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Group by category in stable order
  const grouped = useMemo(() => {
    const map = new Map<string, BiCompetency[]>();
    for (const c of data) {
      const arr = map.get(c.category) ?? [];
      arr.push(c);
      map.set(c.category, arr);
    }
    return Array.from(map.entries());
  }, [data]);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2} fw={800}>
            Behavioural Indicators
          </Title>
          <Text size="sm" c="dimmed">
            CBI competency proficiency levels — Novice through Mastery
          </Text>
        </Box>
        <Button
          onClick={handleDownload}
          loading={downloading}
          leftSection={<IconDownload size={16} />}
          variant="gradient"
          gradient={{ from: "indigo", to: "violet", deg: 135 }}
        >
          Download PDF
        </Button>
      </Group>

      {loading ? (
        <Box ta="center" py="xl">
          <Loader />
        </Box>
      ) : error ? (
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
          {error}
        </Alert>
      ) : data.length === 0 ? (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="yellow"
          title="No data"
        >
          No behavioural indicators have been seeded yet. Run{" "}
          <code>npm run seed:behavioural-indicators</code> in the backend to
          populate this table.
        </Alert>
      ) : (
        grouped.map(([category, competencies]) => (
          <CategorySection
            key={category}
            category={category}
            competencies={competencies}
          />
        ))
      )}
    </Stack>
  );
}

function CategorySection({
  category,
  competencies,
}: {
  category: string;
  competencies: BiCompetency[];
}) {
  return (
    <Box>
      <Group gap="xs" mb="sm">
        <IconCategory size={20} stroke={1.8} />
        <Title order={3} fw={700} tt="uppercase">
          {category}
        </Title>
        <Badge variant="light" color="indigo" size="md">
          {competencies.length}{" "}
          {competencies.length === 1 ? "competency" : "competencies"}
        </Badge>
      </Group>
      <Stack gap="md">
        {competencies.map((c) => (
          <CompetencyCard key={c.bi_competency_id} competency={c} />
        ))}
      </Stack>
      <Divider mt="xl" />
    </Box>
  );
}

function CompetencyCard({ competency }: { competency: BiCompetency }) {
  return (
    <Paper
      withBorder
      p="md"
      style={{ border: "1px solid var(--mantine-color-default-border)" }}
    >
      <Box mb="md">
        <Text fw={700} size="lg">
          {competency.competency_name}
        </Text>
        {competency.description && (
          <Text size="sm" c="dimmed" mt={4}>
            {competency.description}
          </Text>
        )}
      </Box>

      <Box style={{ overflowX: "auto" }}>
        <Table
          withTableBorder
          withColumnBorders
          striped
          highlightOnHover
          verticalSpacing="sm"
          style={{ minWidth: 1100 }}
        >
          <Table.Thead>
            <Table.Tr>
              {competency.levels.map((lvl) => (
                <Table.Th
                  key={lvl.bi_level_id}
                  style={{
                    width: `${100 / competency.levels.length}%`,
                    verticalAlign: "top",
                  }}
                >
                  <Stack gap={4}>
                    <Badge
                      variant="filled"
                      color={LEVEL_COLORS[lvl.level] || "gray"}
                      size="sm"
                      w="fit-content"
                    >
                      {lvl.level} — {lvl.level_label}
                    </Badge>
                    <Text size="xs" c="dimmed" fs="italic">
                      {lvl.level_subtitle}
                    </Text>
                  </Stack>
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              {competency.levels.map((lvl) => (
                <Table.Td
                  key={lvl.bi_level_id}
                  style={{ verticalAlign: "top" }}
                >
                  <ul
                    style={{
                      paddingLeft: 18,
                      margin: 0,
                      fontSize: "var(--mantine-font-size-sm)",
                      lineHeight: 1.5,
                    }}
                  >
                    {lvl.indicators.map((ind, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>
                        {ind}
                      </li>
                    ))}
                  </ul>
                </Table.Td>
              ))}
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Box>
    </Paper>
  );
}

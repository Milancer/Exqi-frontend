import { useState, useEffect, useCallback } from "react";
import {
  Title,
  Text,
  Card,
  Group,
  ThemeIcon,
  Box,
  SimpleGrid,
  Stack,
  Badge,
  RingProgress,
  Center,
  Skeleton,
  Paper,
  Progress,
} from "@mantine/core";
import {
  IconBrain,
  IconQuestionMark,
  IconTemplate,
  IconBriefcase,
  IconArrowUpRight,
  IconTargetArrow,
  IconTool,
  IconFileDescription,
  IconChartBar,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

interface Stats {
  competencies: number;
  competencyTypes: number;
  questions: number;
  templates: number;
  jobProfiles: number;
  jobProfilesByStatus: { status: string; count: number }[];
  recentProfiles: {
    job_profile_id: number;
    job_title: string;
    status: string;
    division: string;
  }[];
  interviews: {
    total: number;
    pending: number;
    completed: number;
    avgScore: number;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [compRes, questionsRes, templatesRes, profilesRes, interviewsRes] =
        await Promise.allSettled([
          api.get("/competencies"),
          api.get("/cbi/questions"),
          api.get("/cbi/templates"),
          api.get("/job-profiles"),
          api.get("/interviews"),
        ]);

      const competencies =
        compRes.status === "fulfilled" ? compRes.value.data : [];
      const questions =
        questionsRes.status === "fulfilled" ? questionsRes.value.data : [];
      const templates =
        templatesRes.status === "fulfilled" ? templatesRes.value.data : [];
      const profiles =
        profilesRes.status === "fulfilled" ? profilesRes.value.data : [];
      const interviews =
        interviewsRes.status === "fulfilled" ? interviewsRes.value.data : [];

      // Count unique competency types
      const typeSet = new Set(
        competencies
          .map((c: any) => c.competencyType?.competency_type)
          .filter(Boolean),
      );

      // Group profiles by status
      const statusMap: Record<string, number> = {};
      profiles.forEach((p: any) => {
        statusMap[p.status || "Draft"] =
          (statusMap[p.status || "Draft"] || 0) + 1;
      });
      const jobProfilesByStatus = Object.entries(statusMap).map(
        ([status, count]) => ({ status, count }),
      );

      // Recent profiles (last 5)
      const recentProfiles = profiles
        .slice(-5)
        .reverse()
        .map((p: any) => ({
          job_profile_id: p.job_profile_id,
          job_title: p.job_title,
          status: p.status || "Draft",
          division: p.division || "",
        }));

      // Calculate interview stats
      const completedInterviews = interviews.filter(
        (i: any) => i.status === "Completed",
      );
      const totalScoreSum = completedInterviews.reduce(
        (sum: number, i: any) => sum + (i.percentage || 0),
        0,
      );
      const avgScore =
        completedInterviews.length > 0
          ? Math.round(totalScoreSum / completedInterviews.length)
          : 0;

      setStats({
        competencies: competencies.length,
        competencyTypes: typeSet.size,
        questions: questions.length,
        templates: templates.length,
        jobProfiles: profiles.length,
        jobProfilesByStatus,
        recentProfiles,
        interviews: {
          total: interviews.length,
          pending: interviews.filter(
            (i: any) => i.status === "Pending" || i.status === "InProgress",
          ).length,
          completed: completedInterviews.length,
          avgScore,
        },
      });
    } catch {
      /* fail silently */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statusColors: Record<string, string> = {
    Draft: "gray",
    Active: "green",
    "Awaiting Review": "yellow",
    "Awaiting Approval": "orange",
    Approved: "teal",
    Archived: "red",
    "In Progress": "blue",
  };

  const modules = [
    {
      title: "Competencies",
      description: "Organisational competency framework",
      icon: IconBrain,
      gradient: { from: "indigo", to: "violet" },
      path: "/competencies",
      stat: stats?.competencies ?? "—",
      statLabel: "competencies",
      sub: stats ? `${stats.competencyTypes} types` : "",
    },
    {
      title: "Question Bank",
      description: "Interview questions by competency",
      icon: IconQuestionMark,
      gradient: { from: "teal", to: "cyan" },
      path: "/question-bank",
      stat: stats?.questions ?? "—",
      statLabel: "questions",
      sub: "",
    },
    {
      title: "CBI Templates",
      description: "Structured interview templates",
      icon: IconTemplate,
      gradient: { from: "orange", to: "pink" },
      path: "/cbi-templates",
      stat: stats?.templates ?? "—",
      statLabel: "templates",
      sub: "",
    },
    {
      title: "Job Profiles",
      description: "Profiles with competency mapping",
      icon: IconBriefcase,
      gradient: { from: "grape", to: "violet" },
      path: "/job-profiles",
      stat: stats?.jobProfiles ?? "—",
      statLabel: "profiles",
      sub: "",
    },
  ];

  return (
    <Stack gap="xl">
      <Box>
        <Title order={2} fw={800}>
          Welcome back
          {user?.email ? `, ${user.email.split("@")[0]}` : ""}!
        </Title>
        <Text c="dimmed" mt={4}>
          Manage your competencies, interviews, and job profiles from one place.
        </Text>
      </Box>

      {/* ─── Module cards with live counts ─── */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        {modules.map((mod) => (
          <Card
            key={mod.title}
            padding="lg"
            withBorder
            style={{
              cursor: "pointer",
              transition: "transform 150ms ease, box-shadow 150ms ease",
              border: "1px solid var(--mantine-color-default-border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 8px 24px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "";
            }}
            onClick={() => navigate(mod.path)}
          >
            <Group justify="space-between" mb="md">
              <ThemeIcon
                size={48}
                radius="md"
                variant="gradient"
                gradient={{ ...mod.gradient, deg: 135 }}
              >
                <mod.icon size={24} stroke={1.5} />
              </ThemeIcon>
              <Box ta="right">
                {loading ? (
                  <Skeleton height={28} width={40} />
                ) : (
                  <Text fw={800} fz={28} lh={1}>
                    {mod.stat}
                  </Text>
                )}
                <Text size="xs" c="dimmed">
                  {mod.statLabel}
                </Text>
              </Box>
            </Group>
            <Group justify="space-between" align="end">
              <Box>
                <Text fw={600} size="sm">
                  {mod.title}
                </Text>
                <Text size="xs" c="dimmed">
                  {mod.description}
                </Text>
              </Box>
              <IconArrowUpRight
                size={16}
                style={{ color: "var(--mantine-color-dimmed)" }}
              />
            </Group>
            {mod.sub && (
              <Badge variant="light" size="xs" mt="xs">
                {mod.sub}
              </Badge>
            )}
          </Card>
        ))}
      </SimpleGrid>

      {/* ─── Interview Stats ─── */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Paper withBorder p="lg">
          <Group justify="space-between" mb="xs">
            <Text c="dimmed" size="xs" fw={700} tt="uppercase">
              Interviews
            </Text>
            <ThemeIcon variant="light" color="blue" size="sm">
              <IconChartBar size={14} />
            </ThemeIcon>
          </Group>
          <Group align="flex-end" gap="xs">
            <Text fw={700} fz={24}>
              {stats?.interviews?.total ?? 0}
            </Text>
            <Text
              c={stats?.interviews?.completed ? "teal" : "dimmed"}
              size="sm"
              fw={500}
            >
              {stats?.interviews?.completed ?? 0} completed
            </Text>
          </Group>
          <Progress
            value={
              stats?.interviews?.total
                ? (stats.interviews.completed / stats.interviews.total) * 100
                : 0
            }
            mt="md"
            size="lg"
            radius="xl"
          />
        </Paper>

        <Paper withBorder p="lg">
          <Group justify="space-between" mb="xs">
            <Text c="dimmed" size="xs" fw={700} tt="uppercase">
              Pending Action
            </Text>
            <ThemeIcon variant="light" color="orange" size="sm">
              <IconAlertTriangle size={14} />
            </ThemeIcon>
          </Group>
          <Group align="flex-end" gap="xs">
            <Text fw={700} fz={24}>
              {stats?.interviews?.pending ?? 0}
            </Text>
            <Text c="dimmed" size="sm" fw={500}>
              sessions awaiting
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mt="md">
            Scheduled interviews waiting for candidate or completion.
          </Text>
        </Paper>

        <Paper withBorder p="lg">
          <Group justify="space-between" mb="xs">
            <Text c="dimmed" size="xs" fw={700} tt="uppercase">
              Average Score
            </Text>
            <ThemeIcon variant="light" color="green" size="sm">
              <IconTargetArrow size={14} />
            </ThemeIcon>
          </Group>
          <Group align="flex-end" gap="xs">
            <Text fw={700} fz={24}>
              {stats?.interviews?.avgScore ?? 0}%
            </Text>
            <Text c="dimmed" size="sm" fw={500}>
              across all completed
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mt="md">
            Based on {stats?.interviews?.completed ?? 0} completed interviews.
          </Text>
        </Paper>
      </SimpleGrid>

      {/* ─── Bottom row: Profile Status + Recent Profiles ─── */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Job Profile Status Breakdown */}
        <Paper withBorder p="lg">
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <ThemeIcon size={32} variant="light" color="grape">
                <IconChartBar size={18} />
              </ThemeIcon>
              <Text fw={600}>Job Profile Status</Text>
            </Group>
            <Badge variant="light" size="sm">
              {stats?.jobProfiles ?? 0} total
            </Badge>
          </Group>
          {loading ? (
            <Stack gap="xs">
              <Skeleton height={20} />
              <Skeleton height={20} />
              <Skeleton height={20} />
            </Stack>
          ) : stats?.jobProfilesByStatus &&
            stats.jobProfilesByStatus.length > 0 ? (
            <Group align="center" gap="xl">
              <RingProgress
                size={140}
                thickness={14}
                roundCaps
                sections={stats.jobProfilesByStatus.map((s) => ({
                  value:
                    stats.jobProfiles > 0
                      ? (s.count / stats.jobProfiles) * 100
                      : 0,
                  color: statusColors[s.status] || "gray",
                  tooltip: `${s.status}: ${s.count}`,
                }))}
                label={
                  <Center>
                    <Text fw={700} fz={22}>
                      {stats.jobProfiles}
                    </Text>
                  </Center>
                }
              />
              <Stack gap={6} style={{ flex: 1 }}>
                {stats.jobProfilesByStatus.map((s) => (
                  <Group key={s.status} justify="space-between">
                    <Group gap="xs">
                      <Box
                        w={10}
                        h={10}
                        style={{
                          borderRadius: "50%",
                          background: `var(--mantine-color-${statusColors[s.status] || "gray"}-6)`,
                        }}
                      />
                      <Text size="sm">{s.status}</Text>
                    </Group>
                    <Text size="sm" fw={600}>
                      {s.count}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Group>
          ) : (
            <Text c="dimmed" size="sm" ta="center" py="lg">
              No job profiles yet
            </Text>
          )}
        </Paper>

        {/* Recent Job Profiles */}
        <Paper withBorder p="lg">
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <ThemeIcon size={32} variant="light" color="violet">
                <IconFileDescription size={18} />
              </ThemeIcon>
              <Text fw={600}>Recent Job Profiles</Text>
            </Group>
          </Group>
          {loading ? (
            <Stack gap="xs">
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </Stack>
          ) : stats?.recentProfiles && stats.recentProfiles.length > 0 ? (
            <Stack gap={0}>
              {stats.recentProfiles.map((p) => (
                <Group
                  key={p.job_profile_id}
                  justify="space-between"
                  py="xs"
                  style={{
                    borderBottom:
                      "1px solid var(--mantine-color-default-border)",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate("/job-profiles")}
                >
                  <Box>
                    <Text size="sm" fw={500}>
                      {p.job_title}
                    </Text>
                    {p.division && (
                      <Text size="xs" c="dimmed">
                        {p.division}
                      </Text>
                    )}
                  </Box>
                  <Badge
                    variant="light"
                    size="sm"
                    color={statusColors[p.status] || "gray"}
                  >
                    {p.status}
                  </Badge>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" size="sm" ta="center" py="lg">
              No job profiles yet
            </Text>
          )}
        </Paper>
      </SimpleGrid>

      {/* ─── Quick Actions ─── */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {[
          {
            icon: IconTargetArrow,
            color: "indigo",
            label: "Add Competency",
            path: "/competencies",
          },
          {
            icon: IconTool,
            color: "teal",
            label: "Create CBI Template",
            path: "/cbi-templates",
          },
          {
            icon: IconBriefcase,
            color: "grape",
            label: "New Job Profile",
            path: "/job-profiles",
          },
        ].map((action) => (
          <Paper
            key={action.label}
            withBorder
            p="md"
            style={{
              cursor: "pointer",
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "var(--mantine-color-default-hover)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            onClick={() => navigate(action.path)}
          >
            <Group gap="sm">
              <ThemeIcon size={36} variant="light" color={action.color}>
                <action.icon size={18} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                {action.label}
              </Text>
              <IconArrowUpRight
                size={14}
                style={{
                  color: "var(--mantine-color-dimmed)",
                  marginLeft: "auto",
                }}
              />
            </Group>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

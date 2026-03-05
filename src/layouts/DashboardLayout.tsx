import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Avatar,
  Menu,
  rem,
  Box,
  ThemeIcon,
  Divider,
  Indicator,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAuth } from "../contexts/AuthContext";
import {
  IconDashboard,
  IconBrain,
  IconBriefcase,
  IconLogout,
  IconUser,
  IconUsers,
  IconBuilding,
  IconSettings,
  IconBell,
  IconUserSearch,
  IconClipboardList,
  IconSitemap,
  IconTable,
  IconUpload,
} from "@tabler/icons-react";
import api from "../lib/api";

export default function DashboardLayout() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Poll for unread notifications every 30 seconds
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get("/notifications/count");
        setUnreadCount(res.data.count);
      } catch {
        // ignore
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  // CBI sub-nav items
  const cbiChildren = [
    { label: "Competencies", path: "/competencies", icon: IconTable },
    { label: "CBI Templates", path: "/cbi-templates", icon: IconClipboardList },
  ];

  const isCbiActive = cbiChildren.some((c) => location.pathname === c.path);

  // Admin sub-nav items
  const adminChildren = [
    { label: "Users", path: "/users", icon: IconUsers },
    { label: "Clients", path: "/clients", icon: IconBuilding },
    { label: "Bulk Import", path: "/bulk-import", icon: IconUpload },
  ];

  const isAdminActive = adminChildren.some((c) => location.pathname === c.path);

  // Role Architecture sub-nav items
  const roleArchChildren = [
    { label: "Job Profiles", path: "/job-profiles", icon: IconBriefcase },
    { label: "Competency Table", path: "/jp-competencies", icon: IconTable },
  ];

  const isRoleArchActive = roleArchChildren.some((c) =>
    location.pathname.startsWith(c.path),
  );

  // Recruitment sub-nav items
  const recruitmentChildren = [
    { label: "Candidates", path: "/candidates", icon: IconUserSearch },
    { label: "Interviews", path: "/interviews", icon: IconClipboardList },
  ];

  const isRecruitmentActive = recruitmentChildren.some(
    (c) => location.pathname === c.path,
  );

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="lg"
      styles={{
        header: {
          borderBottom: "1px solid var(--mantine-color-default-border)",
          background: "#1e3a5f",
          color: "#fff",
        },
        navbar: {
          borderRight: "none",
          background: "linear-gradient(180deg, #1e3a5f 0%, #153050 100%)",
        },
        main: {
          background: "#f8f9fc",
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              color="#fff"
            />
            <ThemeIcon
              size="lg"
              radius="md"
              variant="gradient"
              gradient={{ from: "#4dabf7", to: "#228be6", deg: 135 }}
            >
              <IconBrain size={18} stroke={1.5} />
            </ThemeIcon>
            <Text size="lg" fw={800} c="#fff">
              Nexus
            </Text>
          </Group>

          <Group gap="sm">
            {/* Notification Bell */}
            <Tooltip label="Notifications">
              <Indicator
                color="red"
                size={16}
                label={unreadCount > 0 ? String(unreadCount) : undefined}
                disabled={unreadCount === 0}
                offset={4}
              >
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  style={{ color: "#fff" }}
                  onClick={() => navigate("/notifications")}
                >
                  <IconBell size={20} stroke={1.5} />
                </ActionIcon>
              </Indicator>
            </Tooltip>

            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <Avatar
                  style={{ cursor: "pointer" }}
                  radius="xl"
                  size="sm"
                  variant="filled"
                  color="blue.4"
                >
                  {initials}
                </Avatar>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>
                  <Text size="sm" fw={600} truncate>
                    {user?.email}
                  </Text>
                  <Text size="xs" c="dimmed" tt="capitalize">
                    {user?.role}
                  </Text>
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item
                  leftSection={
                    <IconUser style={{ width: rem(14), height: rem(14) }} />
                  }
                  onClick={() => navigate("/profile")}
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={
                    <IconLogout style={{ width: rem(14), height: rem(14) }} />
                  }
                  onClick={handleLogout}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Box style={{ flex: 1 }}>
          <Text
            size="xs"
            fw={600}
            tt="uppercase"
            mb="sm"
            px="sm"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Navigation
          </Text>

          {/* Dashboard */}
          <NavLink
            label="Dashboard"
            leftSection={<IconDashboard size="1.1rem" stroke={1.5} />}
            active={location.pathname === "/"}
            onClick={() => {
              navigate("/");
              if (opened) toggle();
            }}
            mb={4}
            style={() => ({
              borderRadius: "var(--mantine-radius-md)",
              color:
                location.pathname === "/" ? "#fff" : "rgba(255,255,255,0.75)",
              backgroundColor:
                location.pathname === "/"
                  ? "rgba(255,255,255,0.15)"
                  : "transparent",
            })}
            variant="subtle"
          />

          {/* Admin parent with sub-nav */}
          <NavLink
            label="Admin"
            leftSection={<IconSettings size="1.1rem" stroke={1.5} />}
            defaultOpened={isAdminActive}
            mb={4}
            style={() => ({
              borderRadius: "var(--mantine-radius-md)",
              color: isAdminActive ? "#fff" : "rgba(255,255,255,0.75)",
              backgroundColor: isAdminActive
                ? "rgba(255,255,255,0.08)"
                : "transparent",
            })}
            variant="subtle"
          >
            {adminChildren.map((child) => (
              <NavLink
                key={child.path}
                label={child.label}
                leftSection={
                  child.icon ? <child.icon size="0.9rem" stroke={1.5} /> : null
                }
                active={location.pathname === child.path}
                onClick={() => {
                  navigate(child.path);
                  if (opened) toggle();
                }}
                mb={2}
                style={() => ({
                  borderRadius: "var(--mantine-radius-md)",
                  color:
                    location.pathname === child.path
                      ? "#fff"
                      : "rgba(255,255,255,0.6)",
                  backgroundColor:
                    location.pathname === child.path
                      ? "rgba(255,255,255,0.15)"
                      : "transparent",
                })}
                variant="subtle"
              />
            ))}
          </NavLink>

          {/* Role Architecture parent with sub-nav */}
          <NavLink
            label="Role Architecture"
            leftSection={<IconSitemap size="1.1rem" stroke={1.5} />}
            defaultOpened={isRoleArchActive}
            mb={4}
            style={() => ({
              borderRadius: "var(--mantine-radius-md)",
              color: isRoleArchActive ? "#fff" : "rgba(255,255,255,0.75)",
              backgroundColor: isRoleArchActive
                ? "rgba(255,255,255,0.08)"
                : "transparent",
            })}
            variant="subtle"
          >
            {roleArchChildren.map((child) => (
              <NavLink
                key={child.path}
                label={child.label}
                leftSection={<child.icon size="0.9rem" stroke={1.5} />}
                active={location.pathname.startsWith(child.path)}
                onClick={() => {
                  navigate(child.path);
                  if (opened) toggle();
                }}
                mb={2}
                style={() => ({
                  borderRadius: "var(--mantine-radius-md)",
                  color: location.pathname.startsWith(child.path)
                    ? "#fff"
                    : "rgba(255,255,255,0.6)",
                  backgroundColor: location.pathname.startsWith(child.path)
                    ? "rgba(255,255,255,0.15)"
                    : "transparent",
                })}
                variant="subtle"
              />
            ))}
          </NavLink>

          {/* CBI parent with sub-nav */}
          <NavLink
            label="CBI"
            leftSection={<IconBrain size="1.1rem" stroke={1.5} />}
            defaultOpened={isCbiActive}
            mb={4}
            style={() => ({
              borderRadius: "var(--mantine-radius-md)",
              color: isCbiActive ? "#fff" : "rgba(255,255,255,0.75)",
              backgroundColor: isCbiActive
                ? "rgba(255,255,255,0.08)"
                : "transparent",
            })}
            variant="subtle"
          >
            {cbiChildren.map((child) => (
              <NavLink
                key={child.path}
                label={child.label}
                leftSection={
                  child.icon ? <child.icon size="0.9rem" stroke={1.5} /> : null
                }
                active={location.pathname === child.path}
                onClick={() => {
                  navigate(child.path);
                  if (opened) toggle();
                }}
                mb={2}
                style={() => ({
                  borderRadius: "var(--mantine-radius-md)",
                  color:
                    location.pathname === child.path
                      ? "#fff"
                      : "rgba(255,255,255,0.6)",
                  backgroundColor:
                    location.pathname === child.path
                      ? "rgba(255,255,255,0.15)"
                      : "transparent",
                })}
                variant="subtle"
              />
            ))}
          </NavLink>

          {/* Recruitment parent with sub-nav */}
          <NavLink
            label="Recruitment"
            leftSection={<IconUserSearch size="1.1rem" stroke={1.5} />}
            defaultOpened={isRecruitmentActive}
            mb={4}
            style={() => ({
              borderRadius: "var(--mantine-radius-md)",
              color: isRecruitmentActive ? "#fff" : "rgba(255,255,255,0.75)",
              backgroundColor: isRecruitmentActive
                ? "rgba(255,255,255,0.08)"
                : "transparent",
            })}
            variant="subtle"
          >
            {recruitmentChildren.map((child) => (
              <NavLink
                key={child.path}
                label={child.label}
                leftSection={<child.icon size="0.9rem" stroke={1.5} />}
                active={location.pathname === child.path}
                onClick={() => {
                  navigate(child.path);
                  if (opened) toggle();
                }}
                mb={2}
                style={() => ({
                  borderRadius: "var(--mantine-radius-md)",
                  color:
                    location.pathname === child.path
                      ? "#fff"
                      : "rgba(255,255,255,0.6)",
                  backgroundColor:
                    location.pathname === child.path
                      ? "rgba(255,255,255,0.15)"
                      : "transparent",
                })}
                variant="subtle"
              />
            ))}
          </NavLink>
        </Box>

        <Divider my="sm" color="rgba(255,255,255,0.15)" />

        <Box px="sm" pb="xs">
          <Group gap="xs">
            <Avatar size="sm" radius="xl" variant="filled" color="blue.4">
              {initials}
            </Avatar>
            <Box style={{ flex: 1, overflow: "hidden" }}>
              <Text size="xs" fw={600} truncate c="#fff">
                {user?.email}
              </Text>
              <Text
                size="xs"
                style={{ color: "rgba(255,255,255,0.5)" }}
                tt="capitalize"
              >
                {user?.role}
              </Text>
            </Box>
          </Group>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Avatar,
  Badge,
  SimpleGrid,
  Skeleton,
  Button,
  Modal,
  Box,
  Divider,
  ThemeIcon,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconId,
  IconShieldCheck,
  IconSignature,
  IconTrash,
  IconCheck,
  IconEdit,
  IconX,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useMyProfile, useUpdateMyProfile } from "../services/profile/hooks";

/* ------------------------------------------------------------------ */
/*  Info row helper (read-only mode)                                   */
/* ------------------------------------------------------------------ */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IconUser;
  label: string;
  value?: string | null;
}) {
  return (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon variant="light" size="lg" radius="md">
        <Icon size={18} stroke={1.5} />
      </ThemeIcon>
      <Box>
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Text size="sm" fw={500}>
          {value || "—"}
        </Text>
      </Box>
    </Group>
  );
}

/* ------------------------------------------------------------------ */
/*  Editable row helper (edit mode)                                    */
/* ------------------------------------------------------------------ */
function EditableRow({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof IconUser;
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <Group gap="sm" wrap="nowrap" align="flex-end">
      <ThemeIcon variant="light" size="lg" radius="md" mt={20}>
        <Icon size={18} stroke={1.5} />
      </ThemeIcon>
      <TextInput
        label={label}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        style={{ flex: 1 }}
        size="sm"
      />
    </Group>
  );
}

/* ------------------------------------------------------------------ */
/*  Signature pad modal                                                */
/* ------------------------------------------------------------------ */
function SignaturePad({
  opened,
  onClose,
  onSave,
  existingSignature,
}: {
  opened: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  existingSignature?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  /* Initialise canvas when modal opens */
  useEffect(() => {
    if (!opened || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
      img.src = existingSignature;
    } else {
      setHasDrawn(false);
    }
  }, [opened, existingSignature]);

  /* ---- Coordinate helpers ---- */
  const getPos = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  /* ---- Drawing handlers (mouse + touch) ---- */
  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      e.preventDefault();
      setIsDrawing(true);
      setHasDrawn(true);
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [],
  );

  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      e.preventDefault();
      if (!isDrawing) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing],
  );

  const stopDrawing = useCallback(() => setIsDrawing(false), []);

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setHasDrawn(false);
  };

  const handleSave = () => {
    if (!canvasRef.current || !hasDrawn) return;
    onSave(canvasRef.current.toDataURL("image/png"));
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Draw Your Signature"
      size="lg"
      centered
    >
      <Stack align="center" gap="md">
        <Box
          style={{
            border: "1px solid var(--mantine-color-gray-3)",
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
            touchAction: "none",
          }}
        >
          <canvas
            ref={canvasRef}
            width={560}
            height={180}
            style={{
              display: "block",
              cursor: "crosshair",
              backgroundColor: "#fff",
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </Box>

        <Text size="xs" c="dimmed">
          Use your mouse, trackpad, or finger to draw your signature above
        </Text>

        <Group>
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconTrash size={16} />}
            onClick={clearCanvas}
          >
            Clear
          </Button>
          <Button
            leftSection={<IconCheck size={16} />}
            onClick={handleSave}
            disabled={!hasDrawn}
          >
            Save Signature
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile page                                                       */
/* ------------------------------------------------------------------ */
export default function Profile() {
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /* ---- Editable form state ---- */
  const [formName, setFormName] = useState("");
  const [formSurname, setFormSurname] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formIdNumber, setFormIdNumber] = useState("");

  /* Sync form state when profile loads or edit mode starts */
  useEffect(() => {
    if (profile) {
      setFormName(profile.name || "");
      setFormSurname(profile.surname || "");
      setFormEmail(profile.email || "");
      setFormPhone(profile.phoneNumber || "");
      setFormIdNumber(profile.idNumber || "");
    }
  }, [profile]);

  const handleStartEdit = () => {
    if (profile) {
      setFormName(profile.name || "");
      setFormSurname(profile.surname || "");
      setFormEmail(profile.email || "");
      setFormPhone(profile.phoneNumber || "");
      setFormIdNumber(profile.idNumber || "");
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        name: formName,
        surname: formSurname,
        email: formEmail,
        phoneNumber: formPhone,
        idNumber: formIdNumber,
      });
      setIsEditing(false);
      notifications.show({
        title: "Profile updated",
        message: "Your profile has been saved",
        color: "green",
        icon: <IconCheck size={16} />,
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to update profile. Please try again.",
        color: "red",
      });
    }
  };

  const handleSignatureSave = async (dataUrl: string) => {
    try {
      await updateProfile.mutateAsync({ signature: dataUrl });
      notifications.show({
        title: "Signature saved",
        message: "Your digital signature has been updated",
        color: "green",
        icon: <IconCheck size={16} />,
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save signature. Please try again.",
        color: "red",
      });
    }
  };

  const initials = profile
    ? `${profile.name?.[0] ?? ""}${profile.surname?.[0] ?? ""}`.toUpperCase()
    : "?";

  const roleBadgeColor =
    profile?.role === "ADMIN"
      ? "red"
      : profile?.role === "OFFICE_MANAGER"
        ? "orange"
        : "blue";

  if (isLoading) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" radius="md">
          <Stack align="center" gap="lg">
            <Skeleton height={100} circle />
            <Skeleton height={20} width="40%" />
            <Skeleton height={14} width="60%" />
            <SimpleGrid cols={2} spacing="lg" w="100%">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} height={48} />
              ))}
            </SimpleGrid>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      {/* ---- Header card ---- */}
      <Paper p="xl" radius="md" mb="lg">
        <Stack align="center" gap="sm">
          <Avatar size={100} radius={100} color="brand" variant="filled">
            {initials}
          </Avatar>
          <Title order={3}>
            {profile?.name} {profile?.surname}
          </Title>
          <Group gap="xs">
            <Badge color={roleBadgeColor} variant="light" size="lg">
              {profile?.role?.replace(/_/g, " ")}
            </Badge>
            <Badge
              color={profile?.status === "ACTIVE" ? "green" : "gray"}
              variant="dot"
              size="lg"
            >
              {profile?.status}
            </Badge>
          </Group>
        </Stack>
      </Paper>

      {/* ---- Details card ---- */}
      <Paper p="xl" radius="md" mb="lg">
        <Group justify="space-between" mb="md">
          <Title order={5}>Personal Information</Title>
          {!isEditing ? (
            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={handleStartEdit}
              size="sm"
            >
              Edit
            </Button>
          ) : (
            <Group gap="xs">
              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconX size={16} />}
                onClick={handleCancelEdit}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSaveProfile}
                loading={updateProfile.isPending}
                size="sm"
              >
                Save
              </Button>
            </Group>
          )}
        </Group>

        {isEditing ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <EditableRow
              icon={IconUser}
              label="First Name"
              value={formName}
              onChange={setFormName}
            />
            <EditableRow
              icon={IconUser}
              label="Surname"
              value={formSurname}
              onChange={setFormSurname}
            />
            <EditableRow
              icon={IconMail}
              label="Email"
              value={formEmail}
              onChange={setFormEmail}
            />
            <EditableRow
              icon={IconPhone}
              label="Phone Number"
              value={formPhone}
              onChange={setFormPhone}
            />
            <EditableRow
              icon={IconId}
              label="ID Number"
              value={formIdNumber}
              onChange={setFormIdNumber}
            />
            {/* Role is read-only even in edit mode */}
            <InfoRow
              icon={IconShieldCheck}
              label="Role"
              value={profile?.role?.replace(/_/g, " ")}
            />
          </SimpleGrid>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <InfoRow icon={IconUser} label="First Name" value={profile?.name} />
            <InfoRow icon={IconUser} label="Surname" value={profile?.surname} />
            <InfoRow icon={IconMail} label="Email" value={profile?.email} />
            <InfoRow
              icon={IconPhone}
              label="Phone Number"
              value={profile?.phoneNumber}
            />
            <InfoRow
              icon={IconId}
              label="ID Number"
              value={profile?.idNumber}
            />
            <InfoRow
              icon={IconShieldCheck}
              label="Role"
              value={profile?.role?.replace(/_/g, " ")}
            />
          </SimpleGrid>
        )}
      </Paper>

      {/* ---- Signature card ---- */}
      <Paper p="xl" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={5}>Digital Signature</Title>
          <Button
            variant="light"
            leftSection={<IconSignature size={16} />}
            onClick={() => setSigModalOpen(true)}
            loading={updateProfile.isPending}
          >
            {profile?.signature ? "Update Signature" : "Add Signature"}
          </Button>
        </Group>

        {profile?.signature ? (
          <Stack align="center">
            <Box
              style={{
                border: "1px solid var(--mantine-color-gray-3)",
                borderRadius: "var(--mantine-radius-md)",
                padding: "var(--mantine-spacing-md)",
                backgroundColor: "#fff",
                display: "inline-block",
              }}
            >
              <img
                src={profile.signature}
                alt="Your signature"
                style={{ maxWidth: 300, maxHeight: 100, display: "block" }}
              />
            </Box>
          </Stack>
        ) : (
          <Box
            py="xl"
            style={{
              border: "2px dashed var(--mantine-color-gray-3)",
              borderRadius: "var(--mantine-radius-md)",
              textAlign: "center",
            }}
          >
            <IconSignature
              size={40}
              stroke={1}
              style={{ color: "var(--mantine-color-gray-4)" }}
            />
            <Text size="sm" c="dimmed" mt="xs">
              No signature added yet
            </Text>
            <Text size="xs" c="dimmed">
              Click "Add Signature" to draw yours
            </Text>
          </Box>
        )}

        <Divider my="lg" />

        <Text size="xs" c="dimmed">
          Your digital signature may be used on official documents generated by
          the system.
        </Text>
      </Paper>

      {/* ---- Signature modal ---- */}
      <SignaturePad
        opened={sigModalOpen}
        onClose={() => setSigModalOpen(false)}
        onSave={handleSignatureSave}
        existingSignature={profile?.signature}
      />
    </Container>
  );
}

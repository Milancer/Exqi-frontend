import { useState, useRef, useCallback, useEffect } from "react";
import {
  Modal,
  Stack,
  Group,
  Button,
  Text,
  Box,
  Tabs,
  Image,
} from "@mantine/core";
import {
  IconPencil,
  IconUpload,
  IconTrash,
  IconCheck,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function SignatureSetup() {
  const { user, setSignatureComplete } = useAuth();
  const [saving, setSaving] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("draw");

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const opened = !!user && !user.hasSignature;

  useEffect(() => {
    if (!opened || activeTab !== "draw" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setHasDrawn(false);
  }, [opened, activeTab]);

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const handleUpload = (file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|svg\+xml)$/)) {
      notifications.show({ title: "Error", message: "Only PNG, JPG, or SVG images", color: "red" });
      return;
    }
    if (file.size > 500 * 1024) {
      notifications.show({ title: "Error", message: "Image must be under 500KB", color: "red" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSignatureData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    let dataUrl: string | null = null;

    if (activeTab === "draw") {
      if (!canvasRef.current || !hasDrawn) return;
      dataUrl = canvasRef.current.toDataURL("image/png");
    } else {
      dataUrl = signatureData;
    }

    if (!dataUrl) return;

    setSaving(true);
    try {
      await api.patch("/users/me", { signature: dataUrl });
      setSignatureComplete();
      notifications.show({
        title: "Signature saved",
        message: "Your signature has been set up successfully",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save signature",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!opened) return null;

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      title="Set Up Your Signature"
      size="lg"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Before you continue, please set up your digital signature. This will be used for document approvals and PDF exports.
        </Text>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="draw" leftSection={<IconPencil size={14} />}>
              Draw Signature
            </Tabs.Tab>
            <Tabs.Tab value="upload" leftSection={<IconUpload size={14} />}>
              Upload Image
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="draw" pt="md">
            <Stack align="center" gap="sm">
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
                  style={{ display: "block", cursor: "crosshair", backgroundColor: "#fff" }}
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
                Use your mouse, trackpad, or finger to draw your signature
              </Text>
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={clearCanvas}
              >
                Clear
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="upload" pt="md">
            <Stack align="center" gap="sm">
              {signatureData ? (
                <Box
                  p="md"
                  style={{
                    border: "1px solid var(--mantine-color-gray-3)",
                    borderRadius: "var(--mantine-radius-md)",
                    backgroundColor: "#fff",
                  }}
                >
                  <Image src={signatureData} alt="Uploaded signature" maw={400} mah={150} fit="contain" />
                </Box>
              ) : (
                <Box
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/png,image/jpeg,image/svg+xml";
                    input.onchange = () => { if (input.files?.[0]) handleUpload(input.files[0]); };
                    input.click();
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
                  }}
                  p="xl"
                  style={{
                    border: "2px dashed var(--mantine-color-gray-4)",
                    borderRadius: "var(--mantine-radius-md)",
                    backgroundColor: "var(--mantine-color-gray-0)",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  <Stack align="center" gap="xs">
                    <IconUpload size={32} stroke={1.5} color="var(--mantine-color-gray-5)" />
                    <Text size="sm" fw={500}>Drag & drop a signature image, or click to browse</Text>
                    <Text size="xs" c="dimmed">PNG, JPG, or SVG - max 500KB</Text>
                  </Stack>
                </Box>
              )}
              {signatureData && (
                <Group gap="xs">
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => setSignatureData(null)}
                  >
                    Remove
                  </Button>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconUpload size={14} />}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/png,image/jpeg,image/svg+xml";
                      input.onchange = () => { if (input.files?.[0]) handleUpload(input.files[0]); };
                      input.click();
                    }}
                  >
                    Replace
                  </Button>
                </Group>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Button
          fullWidth
          size="md"
          leftSection={<IconCheck size={18} />}
          onClick={handleSave}
          loading={saving}
          disabled={activeTab === "draw" ? !hasDrawn : !signatureData}
        >
          Save Signature & Continue
        </Button>
      </Stack>
    </Modal>
  );
}

import { useState, useRef } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Radio,
  Button,
  Stack,
  Alert,
  List,
  ActionIcon,
  Card,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconUpload,
  IconDownload,
  IconInfoCircle,
  IconCheck,
  IconX,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import api from "../services/api";

export default function BulkImport() {
  const [target, setTarget] = useState<"jp" | "cbi">("jp");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get("/bulk-import/template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "competency_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      notifications.show({
        title: "Download Failed",
        message: "Could not download the template.",
        color: "red",
        icon: <IconX size={14} />,
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".xlsx")) {
      notifications.show({
        title: "Invalid File",
        message: "Please select an Excel (.xlsx) file.",
        color: "red",
      });
      return;
    }

    setFile(selectedFile);
    setPreview(null); // Reset prev preview

    // Auto trigger preview
    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await api.post("/bulk-import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(res.data);
    } catch (err: any) {
      notifications.show({
        title: "Preview Failed",
        message:
          err.response?.data?.message || "Could not parse this spreadsheet.",
        color: "red",
        icon: <IconX size={14} />,
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target", target);

    try {
      const res = await api.post("/bulk-import/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { types, clusters, competencies, questions, skippedRows } =
        res.data;

      notifications.show({
        title: "Import Successful",
        message:
          `Imported ${types} types, ${clusters} clusters, ${competencies} competencies, and ${questions} questions.` +
          (skippedRows > 0 ? ` (${skippedRows} empty rows skipped)` : ""),
        color: "green",
        icon: <IconCheck size={14} />,
        autoClose: 10000,
      });

      // Reset
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      notifications.show({
        title: "Import Failed",
        message:
          err.response?.data?.message || "An error occurred during import.",
        color: "red",
        icon: <IconX size={14} />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" mb="lg">
        <div>
          <Title order={2}>Bulk Import Competencies</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Import competency frameworks from Excel. Ensure your file matches
            the required template format.
          </Text>
        </div>
        <Button
          variant="light"
          leftSection={<IconDownload size={16} />}
          onClick={handleDownloadTemplate}
        >
          Download Template
        </Button>
      </Group>

      <Paper withBorder p="xl" radius="md" shadow="sm">
        <Stack gap="lg">
          <div>
            <Text fw={600} mb="sm">
              1. Select Destination
            </Text>
            <Radio.Group
              value={target}
              onChange={(val) => setTarget(val as "jp" | "cbi")}
              description="Where should this competency data be imported?"
            >
              <Group mt="xs">
                <Radio
                  value="jp"
                  label="Job Profiles (Role Architecture)"
                  description="Questions are added as text indicators"
                />
                <Radio
                  value="cbi"
                  label="CBI Interviews (Recruitment)"
                  description="Questions are saved as individual records"
                />
              </Group>
            </Radio.Group>
          </div>

          <div>
            <Text fw={600} mb="sm">
              2. Upload Excel File (.xlsx)
            </Text>

            <input
              type="file"
              accept=".xlsx"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileSelect}
            />

            {!file ? (
              <Button
                variant="outline"
                size="md"
                leftSection={<IconUpload size={18} />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
              >
                Select Spreadsheet
              </Button>
            ) : (
              <Card withBorder padding="sm" radius="md">
                <Group justify="space-between">
                  <Group>
                    <ThemeIcon color="green" size="lg" variant="light">
                      <IconFileSpreadsheet size={24} />
                    </ThemeIcon>
                    <div>
                      <Text fw={500}>{file.name}</Text>
                      <Text size="xs" c="dimmed">
                        {(file.size / 1024).toFixed(1)} KB
                      </Text>
                    </div>
                  </Group>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <IconX size={18} />
                  </ActionIcon>
                </Group>
              </Card>
            )}
          </div>

          {preview && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Spreadsheet Preview"
              color="blue"
              variant="light"
            >
              <Text size="sm" mb="xs">
                The spreadsheet contains {preview.questionsCount} valid question
                rows. The following records will be created/updated:
              </Text>
              <List size="sm" spacing="xs" withPadding>
                <List.Item>
                  <b>{preview.typesCount}</b> Competency Type(s):{" "}
                  {preview.types.join(", ")}
                </List.Item>
                <List.Item>
                  <b>{preview.clustersCount}</b> Cluster(s):{" "}
                  {preview.clusters.join(", ")}
                </List.Item>
                <List.Item>
                  <b>{preview.competenciesCount}</b> Competencies (e.g.,{" "}
                  {preview.competencies.slice(0, 3).join(", ")}
                  {preview.competencies.length > 3 ? "..." : ""})
                </List.Item>
              </List>

              <Button
                mt="md"
                color="blue"
                onClick={handleImport}
                loading={loading}
                leftSection={<IconUpload size={16} />}
              >
                Confirm Import to {target === "jp" ? "Job Profiles" : "CBI"}
              </Button>
            </Alert>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

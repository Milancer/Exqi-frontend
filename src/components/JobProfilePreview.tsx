import { useState } from "react";
import {
  Modal,
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Paper,
  Table,
  Button,
  Divider,
  Box,
} from "@mantine/core";
import { IconDownload, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import {
  Document,
  Page,
  Text as PDFText,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { JobProfile } from "../services/job-profiles/interfaces";

interface JobProfilePreviewProps {
  profile: JobProfile | null;
  opened: boolean;
  onClose: () => void;
}

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1a365d",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#666",
  },
  section: {
    marginBottom: 15,
  },
  sectionHeader: {
    backgroundColor: "#1a365d",
    color: "#FFFFFF",
    padding: 8,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  fieldLabel: {
    fontWeight: "bold",
    width: "30%",
    color: "#333",
  },
  fieldValue: {
    width: "70%",
    color: "#555",
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
  },
  purposeText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#333",
    padding: 8,
    backgroundColor: "#f8f9fa",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
});

// PDF Document Component
const JobProfilePDF = ({ profile }: { profile: JobProfile }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header}>
        <PDFText style={pdfStyles.title}>{profile.job_title}</PDFText>
        <PDFText style={pdfStyles.subtitle}>
          {profile.division || "No Division"} | {profile.job_family || "No Family"} | Status: {profile.status}
        </PDFText>
      </View>

      {/* Job Purpose */}
      <View style={pdfStyles.section}>
        <PDFText style={pdfStyles.sectionHeader}>JOB PURPOSE</PDFText>
        <PDFText style={pdfStyles.purposeText}>{profile.job_purpose}</PDFText>
      </View>

      {/* Job Details */}
      <View style={pdfStyles.section}>
        <PDFText style={pdfStyles.sectionHeader}>JOB DETAILS</PDFText>
        <View style={pdfStyles.fieldRow}>
          <PDFText style={pdfStyles.fieldLabel}>Location:</PDFText>
          <PDFText style={pdfStyles.fieldValue}>{profile.job_location || "N/A"}</PDFText>
        </View>
        <View style={pdfStyles.fieldRow}>
          <PDFText style={pdfStyles.fieldLabel}>Level of Work:</PDFText>
          <PDFText style={pdfStyles.fieldValue}>{profile.level_of_work || "N/A"}</PDFText>
        </View>
      </View>

      {/* Competencies */}
      {profile.competencies && profile.competencies.length > 0 && (
        <View style={pdfStyles.section}>
          <PDFText style={pdfStyles.sectionHeader}>COMPETENCIES</PDFText>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <PDFText style={[pdfStyles.tableCell, { width: "50%" }]}>Competency</PDFText>
              <PDFText style={[pdfStyles.tableCell, { width: "20%" }]}>Level</PDFText>
              <PDFText style={[pdfStyles.tableCell, { width: "15%" }]}>Critical</PDFText>
              <PDFText style={[pdfStyles.tableCell, { width: "15%" }]}>Differentiating</PDFText>
            </View>
            {profile.competencies.map((comp, idx) => (
              <View key={idx} style={pdfStyles.tableRow}>
                <PDFText style={[pdfStyles.tableCell, { width: "50%" }]}>
                  {comp.jpCompetency?.competency || "N/A"}
                </PDFText>
                <PDFText style={[pdfStyles.tableCell, { width: "20%", textAlign: "center" }]}>
                  {comp.level}
                </PDFText>
                <PDFText style={[pdfStyles.tableCell, { width: "15%", textAlign: "center" }]}>
                  {comp.is_critical ? "Yes" : "No"}
                </PDFText>
                <PDFText style={[pdfStyles.tableCell, { width: "15%", textAlign: "center" }]}>
                  {comp.is_differentiating ? "Yes" : "No"}
                </PDFText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <View style={pdfStyles.section}>
          <PDFText style={pdfStyles.sectionHeader}>SKILLS</PDFText>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <PDFText style={[pdfStyles.tableCell, { width: "60%" }]}>Skill</PDFText>
              <PDFText style={[pdfStyles.tableCell, { width: "20%" }]}>Level</PDFText>
              <PDFText style={[pdfStyles.tableCell, { width: "20%" }]}>Critical</PDFText>
            </View>
            {profile.skills.map((skill, idx) => (
              <View key={idx} style={pdfStyles.tableRow}>
                <PDFText style={[pdfStyles.tableCell, { width: "60%" }]}>{skill.skill_name}</PDFText>
                <PDFText style={[pdfStyles.tableCell, { width: "20%", textAlign: "center" }]}>
                  {skill.level}
                </PDFText>
                <PDFText style={[pdfStyles.tableCell, { width: "20%", textAlign: "center" }]}>
                  {skill.is_critical ? "Yes" : "No"}
                </PDFText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Deliverables */}
      {profile.deliverables && profile.deliverables.length > 0 && (
        <View style={pdfStyles.section}>
          <PDFText style={pdfStyles.sectionHeader}>KEY DELIVERABLES</PDFText>
          {profile.deliverables.map((del, idx) => (
            <View key={idx} style={pdfStyles.fieldRow}>
              <PDFText style={pdfStyles.fieldLabel}>{idx + 1}.</PDFText>
              <PDFText style={pdfStyles.fieldValue}>{del.deliverable}</PDFText>
            </View>
          ))}
        </View>
      )}

      {/* Requirements */}
      {profile.requirements && (
        <View style={pdfStyles.section}>
          <PDFText style={pdfStyles.sectionHeader}>REQUIREMENTS</PDFText>
          {profile.requirements.education && (
            <View style={pdfStyles.fieldRow}>
              <PDFText style={pdfStyles.fieldLabel}>Education:</PDFText>
              <PDFText style={pdfStyles.fieldValue}>{profile.requirements.education}</PDFText>
            </View>
          )}
          {profile.requirements.experience && (
            <View style={pdfStyles.fieldRow}>
              <PDFText style={pdfStyles.fieldLabel}>Experience:</PDFText>
              <PDFText style={pdfStyles.fieldValue}>{profile.requirements.experience}</PDFText>
            </View>
          )}
          {profile.requirements.certifications && (
            <View style={pdfStyles.fieldRow}>
              <PDFText style={pdfStyles.fieldLabel}>Certifications:</PDFText>
              <PDFText style={pdfStyles.fieldValue}>{profile.requirements.certifications}</PDFText>
            </View>
          )}
          {profile.requirements.other_requirements && (
            <View style={pdfStyles.fieldRow}>
              <PDFText style={pdfStyles.fieldLabel}>Other:</PDFText>
              <PDFText style={pdfStyles.fieldValue}>{profile.requirements.other_requirements}</PDFText>
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <PDFText style={pdfStyles.footer}>
        Generated from EXQi - {new Date().toLocaleDateString()}
      </PDFText>
    </Page>
  </Document>
);

export default function JobProfilePreview({ profile, opened, onClose }: JobProfilePreviewProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!profile) return;

    setDownloading(true);
    try {
      const blob = await pdf(<JobProfilePDF profile={profile} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${profile.job_title.replace(/\s+/g, "_")}_Job_Profile.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      notifications.show({
        title: "Downloaded",
        message: "Job profile PDF downloaded successfully",
        color: "green",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      notifications.show({
        title: "Error",
        message: "Failed to generate PDF",
        color: "red",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (!profile) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <Title order={4}>Job Profile Preview</Title>
        </Group>
      }
      size="xl"
      styles={{ body: { maxHeight: "75vh", overflowY: "auto" } }}
    >
      {/* Action Buttons */}
      <Group justify="flex-end" mb="md">
        <Button
          leftSection={<IconDownload size={16} />}
          onClick={handleDownload}
          loading={downloading}
          variant="gradient"
          gradient={{ from: "blue", to: "cyan", deg: 135 }}
        >
          Download PDF
        </Button>
        <Button variant="subtle" color="gray" onClick={onClose} leftSection={<IconX size={16} />}>
          Close
        </Button>
      </Group>

      {/* Preview Content */}
      <Paper withBorder p="lg" radius="md" style={{ backgroundColor: "#fafafa" }}>
        {/* Header */}
        <Box mb="lg" pb="md" style={{ borderBottom: "2px solid #1a365d" }}>
          <Title order={2} c="dark">{profile.job_title}</Title>
          <Group gap="xs" mt="xs">
            <Badge variant="light" color="blue">{profile.division || "No Division"}</Badge>
            <Badge variant="light" color="gray">{profile.job_family || "No Family"}</Badge>
            <Badge variant="light" color={profile.status === "Active" ? "green" : "orange"}>
              {profile.status}
            </Badge>
          </Group>
        </Box>

        {/* Job Purpose */}
        <Stack gap="md">
          <Box>
            <Text fw={700} size="sm" c="dimmed" tt="uppercase" mb={4}>Job Purpose</Text>
            <Paper p="sm" withBorder style={{ backgroundColor: "white" }}>
              <Text size="sm">{profile.job_purpose}</Text>
            </Paper>
          </Box>

          <Divider />

          {/* Job Details */}
          <Box>
            <Text fw={700} size="sm" c="dimmed" tt="uppercase" mb={4}>Job Details</Text>
            <Group grow>
              <Box>
                <Text size="xs" c="dimmed">Location</Text>
                <Text size="sm" fw={500}>{profile.job_location || "N/A"}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Level of Work</Text>
                <Text size="sm" fw={500}>{profile.level_of_work || "N/A"}</Text>
              </Box>
            </Group>
          </Box>

          {/* Competencies */}
          {profile.competencies && profile.competencies.length > 0 && (
            <>
              <Divider />
              <Box>
                <Text fw={700} size="sm" c="dimmed" tt="uppercase" mb={4}>
                  Competencies ({profile.competencies.length})
                </Text>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Competency</Table.Th>
                      <Table.Th w={80}>Level</Table.Th>
                      <Table.Th w={80}>Critical</Table.Th>
                      <Table.Th w={80}>Diff.</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {profile.competencies.map((comp) => (
                      <Table.Tr key={comp.job_profile_competency_id}>
                        <Table.Td>
                          <Text size="sm">{comp.jpCompetency?.competency || "N/A"}</Text>
                          {comp.jpCompetency?.competencyType && (
                            <Text size="xs" c="dimmed">
                              {comp.jpCompetency.competencyType.competency_type}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td ta="center">
                          <Badge size="sm" variant="light" color="blue">L{comp.level}</Badge>
                        </Table.Td>
                        <Table.Td ta="center">
                          {comp.is_critical ? (
                            <Badge size="sm" color="red">Yes</Badge>
                          ) : (
                            <Text size="xs" c="dimmed">No</Text>
                          )}
                        </Table.Td>
                        <Table.Td ta="center">
                          {comp.is_differentiating ? (
                            <Badge size="sm" color="orange">Yes</Badge>
                          ) : (
                            <Text size="xs" c="dimmed">No</Text>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            </>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <>
              <Divider />
              <Box>
                <Text fw={700} size="sm" c="dimmed" tt="uppercase" mb={4}>
                  Skills ({profile.skills.length})
                </Text>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Skill</Table.Th>
                      <Table.Th w={80}>Level</Table.Th>
                      <Table.Th w={80}>Critical</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {profile.skills.map((skill) => (
                      <Table.Tr key={skill.job_profile_skill_id}>
                        <Table.Td>{skill.skill_name}</Table.Td>
                        <Table.Td ta="center">
                          <Badge size="sm" variant="light" color="teal">L{skill.level}</Badge>
                        </Table.Td>
                        <Table.Td ta="center">
                          {skill.is_critical ? (
                            <Badge size="sm" color="red">Yes</Badge>
                          ) : (
                            <Text size="xs" c="dimmed">No</Text>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            </>
          )}

          {/* Deliverables */}
          {profile.deliverables && profile.deliverables.length > 0 && (
            <>
              <Divider />
              <Box>
                <Text fw={700} size="sm" c="dimmed" tt="uppercase" mb={4}>
                  Key Deliverables ({profile.deliverables.length})
                </Text>
                <Stack gap="xs">
                  {profile.deliverables
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((del, idx) => (
                      <Paper key={del.job_profile_deliverable_id} p="xs" withBorder>
                        <Group gap="xs" wrap="nowrap">
                          <Badge size="sm" variant="light" color="gray">{idx + 1}</Badge>
                          <Text size="sm">{del.deliverable}</Text>
                        </Group>
                      </Paper>
                    ))}
                </Stack>
              </Box>
            </>
          )}

          {/* Requirements */}
          {profile.requirements && (
            <>
              <Divider />
              <Box>
                <Text fw={700} size="sm" c="dimmed" tt="uppercase" mb={4}>Requirements</Text>
                <Stack gap="xs">
                  {profile.requirements.education && (
                    <Box>
                      <Text size="xs" c="dimmed" fw={500}>Education</Text>
                      <Text size="sm">{profile.requirements.education}</Text>
                    </Box>
                  )}
                  {profile.requirements.experience && (
                    <Box>
                      <Text size="xs" c="dimmed" fw={500}>Experience</Text>
                      <Text size="sm">{profile.requirements.experience}</Text>
                    </Box>
                  )}
                  {profile.requirements.certifications && (
                    <Box>
                      <Text size="xs" c="dimmed" fw={500}>Certifications</Text>
                      <Text size="sm">{profile.requirements.certifications}</Text>
                    </Box>
                  )}
                  {profile.requirements.other_requirements && (
                    <Box>
                      <Text size="xs" c="dimmed" fw={500}>Other Requirements</Text>
                      <Text size="sm">{profile.requirements.other_requirements}</Text>
                    </Box>
                  )}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </Paper>
    </Modal>
  );
}

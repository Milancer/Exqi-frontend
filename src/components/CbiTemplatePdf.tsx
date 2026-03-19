import {
  Document,
  Page,
  Text as PDFText,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { notifications } from "@mantine/notifications";
import type { Competency, CompetencyQuestion } from "../services/competencies/interfaces";
import type { CbiTemplate, CompetencySelection } from "../services/cbi/interfaces";

/* ─── PDF Styles ─── */
const s = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#222",
  },
  /* Header */
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 16,
  },
  /* Info fields (Candidate Name, Date, Panel) */
  fieldRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  fieldLabel: {
    width: 140,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  fieldLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#aaa",
    height: 18,
  },
  /* Panel rows (multiple blank lines) */
  panelRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  panelLabel: {
    width: 140,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  /* Competency section */
  competencyHeader: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  /* Question */
  questionRow: {
    marginBottom: 14,
  },
  questionText: {
    fontSize: 10,
    marginBottom: 6,
  },
  answerBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 3,
    minHeight: 60,
    padding: 6,
  },
  /* Footer */
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

/* ─── Types for grouped data ─── */
interface QuestionGroup {
  competency_name: string;
  level: number;
  questions: CompetencyQuestion[];
}

/* ─── PDF Document ─── */
function CbiTemplatePdfDoc({
  template,
  groups,
}: {
  template: CbiTemplate;
  groups: QuestionGroup[];
}) {
  let globalIdx = 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Title */}
        <View style={s.header}>
          <PDFText style={s.title}>{template.template_name}</PDFText>
          {template.description && (
            <PDFText style={s.subtitle}>{template.description}</PDFText>
          )}
        </View>

        {/* Candidate Name */}
        <View style={s.fieldRow}>
          <PDFText style={s.fieldLabel}>Candidate's Name:</PDFText>
          <View style={s.fieldLine} />
        </View>

        {/* Interview Date */}
        <View style={s.fieldRow}>
          <PDFText style={s.fieldLabel}>Interview Date:</PDFText>
          <View style={s.fieldLine} />
        </View>

        {/* Interview Panel — 3 blank rows */}
        <View style={{ marginBottom: 4 }} />
        <View style={s.panelRow}>
          <PDFText style={s.panelLabel} />
          <View style={s.fieldLine} />
        </View>
        <View style={s.panelRow}>
          <PDFText style={s.panelLabel} />
          <View style={s.fieldLine} />
        </View>
        <View style={s.fieldRow}>
          <PDFText style={s.fieldLabel}>Interview Panel:</PDFText>
          <View style={s.fieldLine} />
        </View>
        <View style={s.panelRow}>
          <PDFText style={s.panelLabel} />
          <View style={s.fieldLine} />
        </View>
        <View style={s.panelRow}>
          <PDFText style={s.panelLabel} />
          <View style={s.fieldLine} />
        </View>

        {/* Questions grouped by competency */}
        {groups.map((group, gi) => (
          <View key={gi} wrap={false}>
            <PDFText style={s.competencyHeader}>
              {group.competency_name}
            </PDFText>
            {group.questions.map((q) => {
              globalIdx += 1;
              return (
                <View key={q.competency_question_id} style={s.questionRow}>
                  <PDFText style={s.questionText}>
                    {globalIdx}. {q.question}
                  </PDFText>
                  <View style={s.answerBox} />
                </View>
              );
            })}
          </View>
        ))}

        <PDFText style={s.footer}>
          {template.template_name} — Competency-Based Interview Questionnaire
        </PDFText>
      </Page>
    </Document>
  );
}

/* ─── Public download function ─── */
export function buildQuestionGroups(
  template: CbiTemplate,
  competencies: Competency[],
  allQuestions: CompetencyQuestion[],
): QuestionGroup[] {
  if (!template.competencies || template.competencies.length === 0) return [];

  return template.competencies
    .map((sel: CompetencySelection) => {
      const comp = competencies.find(
        (c) => c.competency_id === sel.competency_id,
      );
      const questionsForLevel = allQuestions.filter(
        (q) =>
          q.competency_id === sel.competency_id &&
          q.level === sel.level &&
          q.status === "Active",
      );
      return {
        competency_name: comp?.competency || `Competency #${sel.competency_id}`,
        level: sel.level,
        questions: questionsForLevel,
      };
    })
    .filter((g) => g.questions.length > 0);
}

export async function downloadCbiTemplatePdf(
  template: CbiTemplate,
  competencies: Competency[],
  allQuestions: CompetencyQuestion[],
) {
  const groups = buildQuestionGroups(template, competencies, allQuestions);

  if (groups.length === 0) {
    notifications.show({
      title: "No questions",
      message: "This template has no active questions to export.",
      color: "orange",
    });
    return;
  }

  try {
    const blob = await pdf(
      <CbiTemplatePdfDoc template={template} groups={groups} />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.template_name.replace(/[^a-zA-Z0-9]/g, "_")}_CBI.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    notifications.show({
      title: "Downloaded",
      message: "CBI questionnaire PDF downloaded",
      color: "green",
    });
  } catch {
    notifications.show({
      title: "Error",
      message: "Failed to generate PDF",
      color: "red",
    });
  }
}

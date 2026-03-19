import {
  Document,
  Page,
  Text as PDFText,
  View,
  Image as PDFImage,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { notifications } from "@mantine/notifications";
import type {
  Competency,
  CompetencyQuestion,
} from "../services/competencies/interfaces";
import type {
  CbiTemplate,
  CompetencySelection,
} from "../services/cbi/interfaces";

/* ─── Brand colours ─── */
const BRAND = "#1a365d";
const BORDER = "#cbd5e1";

/* ─── PDF Styles ─── */
const s = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#222",
  },

  /* ── Header ── */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: "contain" as const,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  headerDivider: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    marginBottom: 18,
    marginTop: 8,
  },

  /* ── Info section (Candidate, Date, Panel) ── */
  infoBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 14,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 10,
    textTransform: "uppercase" as const,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 14,
    alignItems: "flex-end",
  },
  fieldLabel: {
    width: 130,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#444",
  },
  fieldLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#bbb",
    height: 18,
  },
  panelSpacer: {
    marginTop: 4,
  },

  /* ── Competency section header ── */
  competencyHeader: {
    backgroundColor: BRAND,
    color: "#fff",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    padding: 8,
    paddingHorizontal: 10,
    marginTop: 16,
    marginBottom: 10,
    borderRadius: 3,
  },

  /* ── Question ── */
  questionRow: {
    marginBottom: 12,
  },
  questionText: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 6,
    color: "#333",
  },
  answerBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    minHeight: 65,
    backgroundColor: "#fafbfc",
  },

  /* ── Footer ── */
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: "#999",
  },
});

/* ─── Types ─── */
interface QuestionGroup {
  competency_name: string;
  level: number;
  questions: CompetencyQuestion[];
}

/* ─── PDF Document ─── */
function CbiTemplatePdfDoc({
  template,
  groups,
  clientLogo,
}: {
  template: CbiTemplate;
  groups: QuestionGroup[];
  clientLogo?: string | null;
}) {
  let globalIdx = 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <PDFText style={s.title}>{template.template_name}</PDFText>
            {template.description && (
              <PDFText style={s.subtitle}>{template.description}</PDFText>
            )}
          </View>
          {clientLogo && <PDFImage src={clientLogo} style={s.logo} />}
        </View>
        <View style={s.headerDivider} />

        {/* ── Info Section ── */}
        <View style={s.infoBox}>
          <PDFText style={s.infoTitle}>Interview Details</PDFText>

          <View style={s.fieldRow}>
            <PDFText style={s.fieldLabel}>Candidate's Name:</PDFText>
            <View style={s.fieldLine} />
          </View>

          <View style={s.fieldRow}>
            <PDFText style={s.fieldLabel}>Interview Date:</PDFText>
            <View style={s.fieldLine} />
          </View>

          <View style={s.panelSpacer} />
          <View style={s.fieldRow}>
            <PDFText style={s.fieldLabel}>Interview Panel:</PDFText>
            <View style={s.fieldLine} />
          </View>
          <View style={s.fieldRow}>
            <PDFText style={s.fieldLabel} />
            <View style={s.fieldLine} />
          </View>
          <View style={{ ...s.fieldRow, marginBottom: 0 }}>
            <PDFText style={s.fieldLabel} />
            <View style={s.fieldLine} />
          </View>
        </View>

        {/* ── Questions grouped by competency ── */}
        {groups.map((group, gi) => {
          const groupQuestions = group.questions.map((q) => {
            globalIdx += 1;
            return (
              <View key={q.competency_question_id} style={s.questionRow}>
                <PDFText style={s.questionText}>
                  {globalIdx}. {q.question}
                </PDFText>
                <View style={s.answerBox} />
              </View>
            );
          });

          return (
            <View key={gi}>
              <PDFText style={s.competencyHeader}>
                {group.competency_name}
              </PDFText>
              {groupQuestions}
            </View>
          );
        })}

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <PDFText style={s.footerText}>
            {template.template_name} — Competency-Based Interview
            Questionnaire
          </PDFText>
          <PDFText style={s.footerText}>Confidential</PDFText>
        </View>
      </Page>
    </Document>
  );
}

/* ─── Public helpers ─── */
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
  clientLogo?: string | null,
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
      <CbiTemplatePdfDoc
        template={template}
        groups={groups}
        clientLogo={clientLogo}
      />,
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

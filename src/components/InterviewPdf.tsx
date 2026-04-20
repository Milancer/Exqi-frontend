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
import exqiLogo from "../assets/logo.svg";

const BRAND = "#1a365d";
const BORDER = "#cbd5e1";

const s = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#222",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerLeft: { flex: 1 },
  logo: { width: 80, height: 40, objectFit: "contain" as const },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: BRAND },
  subtitle: { fontSize: 10, color: "#666", marginTop: 2 },
  headerDivider: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    marginBottom: 18,
    marginTop: 8,
  },
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
  fieldValue: { flex: 1, fontSize: 10, color: "#333" },
  fieldLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: "#bbb", height: 18 },
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
    minPresenceAhead: 80,
  },
  questionRow: { marginBottom: 12 },
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
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 6,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerLogo: { width: 60, height: 25, objectFit: "contain" as const },
  footerText: { fontSize: 7, color: "#999" },
});

export interface InterviewQuestion {
  question_id: number;
  competency_id: number;
  question_text: string;
  competency_name: string;
  level: number;
}

export interface InterviewPdfData {
  candidateName: string;
  templateName: string;
  interviewDate?: string | Date;
  interviewer?: string;
  questions: InterviewQuestion[];
}

function InterviewPdfDoc({
  data,
  clientLogo,
}: {
  data: InterviewPdfData;
  clientLogo?: string | null;
}) {
  // Group questions by competency, preserving the order they appear
  const groups: Array<{ competency_name: string; questions: InterviewQuestion[] }> = [];
  for (const q of data.questions) {
    const existing = groups.find((g) => g.competency_name === q.competency_name);
    if (existing) existing.questions.push(q);
    else groups.push({ competency_name: q.competency_name, questions: [q] });
  }

  const dateStr = data.interviewDate
    ? new Date(data.interviewDate).toLocaleDateString()
    : "";

  let globalIdx = 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <PDFText style={s.title}>{data.templateName}</PDFText>
            <PDFText style={s.subtitle}>
              Interview for {data.candidateName}
            </PDFText>
          </View>
          {clientLogo && <PDFImage src={clientLogo} style={s.logo} />}
        </View>
        <View style={s.headerDivider} />

        <View style={s.infoBox}>
          <PDFText style={s.infoTitle}>Interview Details</PDFText>
          <View style={s.fieldRow}>
            <PDFText style={s.fieldLabel}>Candidate's Name:</PDFText>
            <PDFText style={s.fieldValue}>{data.candidateName}</PDFText>
          </View>
          <View style={s.fieldRow}>
            <PDFText style={s.fieldLabel}>Interview Date:</PDFText>
            {dateStr ? (
              <PDFText style={s.fieldValue}>{dateStr}</PDFText>
            ) : (
              <View style={s.fieldLine} />
            )}
          </View>
          <View style={s.fieldRow}>
            <PDFText style={s.fieldLabel}>Interview Panel:</PDFText>
            {data.interviewer ? (
              <PDFText style={s.fieldValue}>{data.interviewer}</PDFText>
            ) : (
              <View style={s.fieldLine} />
            )}
          </View>
        </View>

        {groups.map((group, gi) => {
          const rendered = group.questions.map((q) => {
            globalIdx += 1;
            return (
              <View key={q.question_id} style={s.questionRow} wrap={false}>
                <PDFText style={s.questionText}>
                  {globalIdx}. {q.question_text}
                </PDFText>
                <View style={s.answerBox} />
              </View>
            );
          });
          return (
            <View key={gi}>
              <PDFText style={s.competencyHeader}>{group.competency_name}</PDFText>
              {rendered}
            </View>
          );
        })}

        <View style={s.footer} fixed>
          <View style={s.footerRow}>
            <View style={s.footerLeft}>
              <PDFImage src={exqiLogo} style={s.footerLogo} />
              <PDFText style={s.footerText}>Powered by EXQi</PDFText>
            </View>
            <PDFText style={s.footerText}>Confidential</PDFText>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadInterviewPdf(
  data: InterviewPdfData,
  clientLogo?: string | null,
) {
  if (!data.questions.length) {
    notifications.show({
      title: "No questions",
      message: "This interview has no questions to export.",
      color: "orange",
    });
    return;
  }
  try {
    const blob = await pdf(
      <InterviewPdfDoc data={data} clientLogo={clientLogo} />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safe = `${data.candidateName.replace(/[^a-zA-Z0-9]/g, "_")}_${data.templateName.replace(/[^a-zA-Z0-9]/g, "_")}`;
    link.download = `${safe}_Interview.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    notifications.show({
      title: "Downloaded",
      message: "Interview PDF downloaded",
      color: "green",
    });
  } catch {
    notifications.show({
      title: "Error",
      message: "Failed to generate interview PDF",
      color: "red",
    });
  }
}

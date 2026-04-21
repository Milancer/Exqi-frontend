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

/* ─── Palette ─── */
const BRAND = "#1a365d"; // dark navy
const BRAND_ACCENT = "#2b4c7e";
const BOX_BORDER = "#c8d1df";
const BOX_BG = "#e9eef7";
const BOX_BG_LIGHT = "#f2f5fa";
const TEXT_DIM = "#666";
const TEXT = "#222";

/* ─── Styles ─── */
const s = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: TEXT,
  },

  /* Top header (template name + client logo) */
  topHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  topHeaderLeft: { flex: 1 },
  topTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  topSubtitle: {
    fontSize: 10,
    color: TEXT_DIM,
    marginTop: 2,
  },
  clientLogo: {
    width: 80,
    height: 40,
    objectFit: "contain" as const,
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    marginTop: 6,
    marginBottom: 20,
  },

  /* Interview Details box — outer blue border with rounded corners */
  detailsBox: {
    borderWidth: 1,
    borderColor: "#b0bfd7",
    borderRadius: 6,
    padding: 20,
    paddingTop: 18,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 16,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  fieldLabel: {
    width: 130,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#333",
  },
  fieldLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#b0bfd7",
    height: 14,
  },
  fieldValue: {
    flex: 1,
    fontSize: 10,
    color: TEXT,
    borderBottomWidth: 1,
    borderBottomColor: "#b0bfd7",
    paddingBottom: 2,
  },
  panelBlankRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  panelBlankSpacer: { width: 130 },

  /* Guidelines */
  guidelinesTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    marginBottom: 6,
  },
  guidelinesSubtitle: {
    fontSize: 10,
    color: "#333",
    marginBottom: 4,
  },
  guidelineItem: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 4,
  },
  guidelineNumber: {
    width: 16,
    fontSize: 9,
    color: "#333",
  },
  guidelineText: {
    flex: 1,
    fontSize: 9,
    color: "#333",
    lineHeight: 1.35,
  },
  guidelineSubItem: {
    flexDirection: "row",
    marginLeft: 24,
    marginBottom: 2,
  },
  guidelineSubBullet: {
    width: 12,
    fontSize: 8,
    color: "#333",
  },
  guidelineSubText: {
    flex: 1,
    fontSize: 9,
    color: "#333",
    lineHeight: 1.35,
  },

  /* Rating legend */
  ratingLabel: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#333",
  },
  ratingTable: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#333",
    width: "90%",
  },
  ratingCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    textAlign: "center" as const,
    fontFamily: "Helvetica-Bold",
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  ratingCellLast: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    textAlign: "center" as const,
    fontFamily: "Helvetica-Bold",
  },

  /* Competency header block */
  competencyBar: {
    backgroundColor: BRAND,
    color: "#fff",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    padding: 8,
    paddingHorizontal: 12,
    marginBottom: 0,
    minPresenceAhead: 100,
  },
  competencyInfo: {
    backgroundColor: BOX_BG,
    padding: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  competencyInfoLine: {
    fontSize: 9,
    color: "#333",
    marginBottom: 2,
  },

  /* Question + answer box */
  questionText: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 4,
    marginTop: 10,
    color: "#333",
  },
  answerBoxWrap: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BOX_BORDER,
    backgroundColor: BOX_BG_LIGHT,
    borderRadius: 2,
    marginBottom: 6,
  },
  answerBoxText: {
    flex: 1,
    minHeight: 60,
  },
  ratingBox: {
    width: 58,
    borderLeftWidth: 1,
    borderLeftColor: BOX_BORDER,
    padding: 4,
  },
  ratingBoxLabel: {
    fontSize: 7,
    color: TEXT_DIM,
    textAlign: "right" as const,
  },
  ratingBoxSlot: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: BOX_BORDER,
    backgroundColor: "#fff",
    height: 28,
    borderRadius: 2,
  },

  /* Overall Rating table */
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    marginTop: 6,
    marginBottom: 6,
  },
  ratingsTable: {
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 16,
  },
  ratingsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    minHeight: 22,
  },
  ratingsRowLast: {
    flexDirection: "row",
    minHeight: 22,
  },
  ratingsCell: {
    flex: 2,
    padding: 5,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  ratingsCellScore: {
    flex: 1,
    padding: 5,
    fontSize: 9,
  },
  ratingsHeaderCell: {
    flex: 2,
    padding: 5,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  ratingsHeaderScore: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },

  /* Strengths / Development Areas side-by-side */
  sdRow: {
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  sdCol: {
    flex: 1,
    padding: 5,
    minHeight: 120,
  },
  sdColDivider: {
    borderLeftWidth: 1,
    borderLeftColor: "#333",
  },
  sdHeader: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },

  /* Recommendation */
  recommendRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 10,
  },
  recommendLabel: {
    flex: 2,
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  recommendCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    textAlign: "center" as const,
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  recommendCellLast: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    textAlign: "center" as const,
  },
  recommendNote: {
    fontSize: 9,
    marginTop: 4,
    marginBottom: 4,
  },
  recommendBox: {
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 55,
    marginBottom: 10,
  },

  /* Final sign-off */
  signOffTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 6,
  },
  signOffLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    color: "#333",
    marginBottom: 4,
    marginTop: 10,
  },
  signOffTable: {
    borderWidth: 1,
    borderColor: "#333",
  },
  signOffHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  signOffHeaderCell: {
    padding: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  signOffHeaderCellLast: {
    padding: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  signOffDataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    minHeight: 32,
  },
  signOffDataRowLast: {
    flexDirection: "row",
    minHeight: 32,
  },
  signOffCell: {
    padding: 4,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  signOffCellLast: {
    padding: 4,
    fontSize: 9,
  },

  /* Footer */
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

/* ─── Types ─── */
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
  templateDescription?: string;
  interviewDate?: string | Date;
  interviewer?: string;
  questions: InterviewQuestion[];
}

/* ─── Reusable header rendered at top of every page ─── */
function PageHeader({
  templateName,
  templateDescription,
  clientLogo,
}: {
  templateName: string;
  templateDescription?: string;
  clientLogo?: string | null;
}) {
  return (
    <>
      <View style={s.topHeaderRow} fixed>
        <View style={s.topHeaderLeft}>
          <PDFText style={s.topTitle}>{templateName}</PDFText>
          {templateDescription && (
            <PDFText style={s.topSubtitle}>{templateDescription}</PDFText>
          )}
        </View>
        {clientLogo && <PDFImage src={clientLogo} style={s.clientLogo} />}
      </View>
      <View style={s.divider} fixed />
    </>
  );
}

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <View style={s.footerRow}>
        <View style={s.footerLeft}>
          <PDFImage src={exqiLogo} style={s.footerLogo} />
          <PDFText style={s.footerText}>Powered by EXQi</PDFText>
        </View>
        <PDFText style={s.footerText}>Confidential</PDFText>
      </View>
    </View>
  );
}

/* ─── PDF Document ─── */
function InterviewPdfDoc({
  data,
  clientLogo,
}: {
  data: InterviewPdfData;
  clientLogo?: string | null;
}) {
  // Group questions by competency, preserving insertion order
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
  let competencyIdx = 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PageHeader
          templateName={data.templateName}
          templateDescription={data.templateDescription}
          clientLogo={clientLogo}
        />

        {/* Interview Details box */}
        <View style={s.detailsBox}>
          <PDFText style={s.detailsTitle}>Interview Details</PDFText>

          <View style={s.fieldRow}>
            <PDFText style={s.fieldLabel}>Candidate's Name:</PDFText>
            {data.candidateName ? (
              <PDFText style={s.fieldValue}>{data.candidateName}</PDFText>
            ) : (
              <View style={s.fieldLine} />
            )}
          </View>

          <View style={s.fieldRow}>
            <PDFText style={s.fieldLabel}>Interview Date:</PDFText>
            {dateStr ? (
              <PDFText style={s.fieldValue}>{dateStr}</PDFText>
            ) : (
              <View style={s.fieldLine} />
            )}
          </View>

          <View style={[s.fieldRow, { marginTop: 10 }]}>
            <PDFText style={s.fieldLabel}>Interview Panel:</PDFText>
            {data.interviewer ? (
              <PDFText style={s.fieldValue}>{data.interviewer}</PDFText>
            ) : (
              <View style={s.fieldLine} />
            )}
          </View>
          {/* Two extra blank lines for additional panel members */}
          <View style={s.panelBlankRow}>
            <View style={s.panelBlankSpacer} />
            <View style={s.fieldLine} />
          </View>
          <View style={{ flexDirection: "row" }}>
            <View style={s.panelBlankSpacer} />
            <View style={s.fieldLine} />
          </View>
        </View>

        {/* Guidelines */}
        <PDFText style={s.guidelinesTitle}>Guidelines</PDFText>
        <PDFText style={s.guidelinesSubtitle}>How to do the interview?</PDFText>
        {[
          "Welcome the candidate and thank them for their CV and interest in the role",
          "Introduce all panel members and mention the role they play in the organization",
          "Confirm interview time needed",
          "Reconfirm role applied for",
        ].map((t, i) => (
          <View key={i} style={s.guidelineItem}>
            <PDFText style={s.guidelineNumber}>{i + 1}.</PDFText>
            <PDFText style={s.guidelineText}>{t}</PDFText>
          </View>
        ))}
        <View style={s.guidelineItem}>
          <PDFText style={s.guidelineNumber}>5.</PDFText>
          <PDFText style={s.guidelineText}>Talk about the nature of the interview:</PDFText>
        </View>
        {[
          "Interview will be structured covering competency-based questions and possible technical clarification questions",
          "Interview answers should be given through an example and elaborate on it",
          "Panel members will share questions between them",
          "Panel members will make notes during the interview",
          "Candidate will have the opportunity to ask questions once the interview is done",
        ].map((t, i) => (
          <View key={`sub-${i}`} style={s.guidelineSubItem}>
            <PDFText style={s.guidelineSubBullet}>o</PDFText>
            <PDFText style={s.guidelineSubText}>{t}</PDFText>
          </View>
        ))}
        {[
          "Discuss aspects from CV that need clarification – but you cannot score it as it does not indicate behavior.",
          "Proceed to Competency Questions",
        ].map((t, i) => (
          <View key={`tail-${i}`} style={s.guidelineItem}>
            <PDFText style={s.guidelineNumber}>{6 + i}.</PDFText>
            <PDFText style={s.guidelineText}>{t}</PDFText>
          </View>
        ))}

        {/* Rating legend */}
        <PDFText style={s.ratingLabel}>Rating:</PDFText>
        <View style={s.ratingTable}>
          <PDFText style={s.ratingCell}>1 - Novice</PDFText>
          <PDFText style={s.ratingCell}>2 - Developing</PDFText>
          <PDFText style={s.ratingCell}>3 - Proficient</PDFText>
          <PDFText style={s.ratingCell}>4 - Highly Proficient</PDFText>
          <PDFText style={s.ratingCellLast}>5 - Mastery</PDFText>
        </View>

        <PageFooter />
      </Page>

      {/* Competency pages */}
      <Page size="A4" style={s.page}>
        <PageHeader
          templateName={data.templateName}
          templateDescription={data.templateDescription}
          clientLogo={clientLogo}
        />

        {groups.map((group) => {
          competencyIdx += 1;
          return (
            <View key={group.competency_name} wrap>
              <PDFText style={s.competencyBar}>
                Competency {competencyIdx}: {group.competency_name}
              </PDFText>
              <View style={s.competencyInfo}>
                <PDFText style={s.competencyInfoLine}>Definition</PDFText>
                <PDFText style={s.competencyInfoLine}>Behavioral Descriptors</PDFText>
              </View>

              {group.questions.map((q) => {
                globalIdx += 1;
                return (
                  <View key={q.question_id} wrap={false}>
                    <PDFText style={s.questionText}>
                      {globalIdx}. {q.question_text}
                    </PDFText>
                    <View style={s.answerBoxWrap}>
                      <View style={s.answerBoxText} />
                      <View style={s.ratingBox}>
                        <PDFText style={s.ratingBoxLabel}>Rating</PDFText>
                        <View style={s.ratingBoxSlot} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        <PageFooter />
      </Page>

      {/* Overall Rating + Strengths + Recommendation */}
      <Page size="A4" style={s.page}>
        <PageHeader
          templateName={data.templateName}
          templateDescription={data.templateDescription}
          clientLogo={clientLogo}
        />

        <PDFText style={s.sectionHeader}>Overall Rating per Competency:</PDFText>
        <View style={s.ratingsTable}>
          <View style={s.ratingsRow}>
            <PDFText style={s.ratingsHeaderCell}>Competency Name</PDFText>
            <PDFText style={s.ratingsHeaderScore}>Rating</PDFText>
          </View>
          {groups.map((g, i) => (
            <View
              key={g.competency_name}
              style={i === groups.length - 1 ? s.ratingsRow : s.ratingsRow}
            >
              <PDFText style={s.ratingsCell}>{g.competency_name}</PDFText>
              <PDFText style={s.ratingsCellScore}> </PDFText>
            </View>
          ))}
          <View style={s.ratingsRowLast}>
            <PDFText
              style={[s.ratingsCell, { fontFamily: "Helvetica-Bold" }]}
            >
              Average
            </PDFText>
            <PDFText style={s.ratingsCellScore}> </PDFText>
          </View>
        </View>

        {/* Strengths + Development Areas */}
        <View style={s.sdRow} wrap={false}>
          <View style={s.sdCol}>
            <PDFText style={s.sdHeader}>Strengths</PDFText>
          </View>
          <View style={[s.sdCol, s.sdColDivider]}>
            <PDFText style={s.sdHeader}>Development Areas</PDFText>
          </View>
        </View>

        {/* Recommendation */}
        <View style={s.recommendRow}>
          <PDFText style={s.recommendLabel}>Recommendation</PDFText>
          <PDFText style={s.recommendCell}>Yes</PDFText>
          <PDFText style={s.recommendCellLast}>No</PDFText>
        </View>

        <PDFText style={s.recommendNote}>
          If yes, key reasons for recommendation?
        </PDFText>
        <View style={s.recommendBox} />

        <PDFText style={s.recommendNote}>
          If no, key reasons for recommendation and any suggestions on alternative placement?
        </PDFText>
        <View style={s.recommendBox} />

        <PageFooter />
      </Page>

      {/* Final Sign-Off */}
      <Page size="A4" style={s.page}>
        <PageHeader
          templateName={data.templateName}
          templateDescription={data.templateDescription}
          clientLogo={clientLogo}
        />

        <PDFText style={s.signOffTitle}>FINAL SIGN-OFF</PDFText>

        <PDFText style={s.signOffLabel}>Signatures of Panel Members:</PDFText>
        <View style={s.signOffTable}>
          <View style={s.signOffHeader}>
            <PDFText style={[s.signOffHeaderCell, { width: 70 }]}>Date:</PDFText>
            <PDFText style={[s.signOffHeaderCell, { flex: 2 }]}>Name:</PDFText>
            <PDFText style={[s.signOffHeaderCell, { flex: 2 }]}>Position:</PDFText>
            <PDFText style={[s.signOffHeaderCellLast, { flex: 2 }]}>
              Signature:
            </PDFText>
          </View>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={s.signOffDataRow}>
              <View style={[s.signOffCell, { width: 70 }]} />
              <View style={[s.signOffCell, { flex: 2 }]} />
              <View style={[s.signOffCell, { flex: 2 }]} />
              <View style={[s.signOffCellLast, { flex: 2 }]} />
            </View>
          ))}
          <View style={s.signOffDataRowLast}>
            <View style={[s.signOffCell, { width: 70 }]} />
            <View style={[s.signOffCell, { flex: 2 }]} />
            <View style={[s.signOffCell, { flex: 2 }]} />
            <View style={[s.signOffCellLast, { flex: 2 }]} />
          </View>
        </View>

        <PDFText style={s.signOffLabel}>Signatures of HP Partner:</PDFText>
        <View style={s.signOffTable}>
          <View style={s.signOffHeader}>
            <PDFText style={[s.signOffHeaderCell, { width: 70 }]}>Date:</PDFText>
            <PDFText style={[s.signOffHeaderCell, { flex: 2 }]}>Name:</PDFText>
            <PDFText style={[s.signOffHeaderCell, { flex: 2 }]}>Position:</PDFText>
            <PDFText style={[s.signOffHeaderCellLast, { flex: 2 }]}>
              Signature:
            </PDFText>
          </View>
          <View style={s.signOffDataRowLast}>
            <View style={[s.signOffCell, { width: 70 }]} />
            <View style={[s.signOffCell, { flex: 2 }]} />
            <View style={[s.signOffCell, { flex: 2 }]} />
            <View style={[s.signOffCellLast, { flex: 2 }]} />
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export async function downloadInterviewPdf(
  data: InterviewPdfData,
  clientLogo?: string | null,
) {
  // `BRAND_ACCENT` is part of the palette but not directly referenced inside
  // rendered styles — reference it here so the palette constant isn't
  // flagged as unused by eslint.
  void BRAND_ACCENT;

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

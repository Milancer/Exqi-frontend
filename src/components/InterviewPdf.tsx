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
import cbiLogo from "../assets/cbi-logo.png";

/* ─── Palette ─── */
const BRAND = "#1a365d"; // dark navy
const BRAND_ACCENT = "#2b4c7e";
const BOX_BORDER = "#c8d1df";
const BOX_BG = "#e9eef7";
const BOX_BG_LIGHT = "#f2f5fa";
const GRID = "#333";
const TEXT_DIM = "#666";
const TEXT = "#222";

/* ─── Styles ─── */
const s = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 64,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: TEXT,
  },

  /* Cover page — no running header here */
  coverPage: {
    flex: 1,
    flexDirection: "column",
  },
  coverMain: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  coverClientLogo: {
    width: 160,
    height: 90,
    objectFit: "contain" as const,
    marginBottom: 28,
  },
  coverTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    textAlign: "center" as const,
    paddingHorizontal: 60,
  },
  coverCandidateBlock: {
    alignItems: "center",
    paddingBottom: 40,
  },
  coverCandidateName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    textAlign: "center" as const,
  },

  /* Guide title block — no running header here */
  guideTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  guideTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    lineHeight: 1.25,
    paddingRight: 12,
  },
  guideTitleLogo: {
    width: 70,
    height: 46,
    objectFit: "contain" as const,
  },
  guideTitleDivider: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    marginTop: 4,
    marginBottom: 16,
  },

  /* Running header (competency + back pages) — slim, single line, no repeated description */
  topHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  topHeaderLeft: { flex: 1 },
  topHeaderCaption: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  clientLogo: {
    width: 54,
    height: 26,
    objectFit: "contain" as const,
  },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND,
    marginTop: 4,
    marginBottom: 14,
  },

  /* Generic bordered table */
  table: {
    borderWidth: 1,
    borderColor: GRID,
    borderBottomWidth: 0,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: GRID,
  },

  /* Intake details table (label | value) */
  intakeLabelCell: {
    width: 150,
    padding: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    backgroundColor: BOX_BG,
    borderRightWidth: 1,
    borderRightColor: GRID,
  },
  intakeValueCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    color: TEXT,
    justifyContent: "center",
    minHeight: 22,
  },

  /* Section headings */
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginTop: 6,
    marginBottom: 8,
  },
  sectionSubTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    marginTop: 8,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 9.5,
    lineHeight: 1.45,
    color: "#333",
    marginBottom: 8,
  },

  /* Interview panel table */
  panelHeaderCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    backgroundColor: BRAND,
  },
  panelRowCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    color: TEXT,
    minHeight: 22,
    justifyContent: "center",
  },

  /* Rating scale (3 columns) */
  scaleHeaderCell: {
    padding: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    backgroundColor: BRAND,
    borderRightWidth: 1,
    borderRightColor: GRID,
  },
  scaleCell: {
    padding: 6,
    fontSize: 9,
    color: "#333",
    borderRightWidth: 1,
    borderRightColor: GRID,
  },
  scaleCellLast: {
    padding: 6,
    fontSize: 9,
    color: "#333",
  },

  /* STAR bullets */
  starItem: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 6,
  },
  starBullet: { width: 12, fontSize: 9.5, color: "#333" },
  starText: { flex: 1, fontSize: 9.5, lineHeight: 1.4, color: "#333" },
  starLabel: { fontFamily: "Helvetica-Bold" },

  /* Guidelines list */
  guidelineItem: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 4,
  },
  guidelineNumber: { width: 16, fontSize: 9.5, color: "#333" },
  guidelineText: { flex: 1, fontSize: 9.5, color: "#333", lineHeight: 1.4 },
  guidelineSubItem: {
    flexDirection: "row",
    marginLeft: 22,
    marginBottom: 2,
  },
  guidelineSubBullet: { width: 12, fontSize: 9, color: "#333" },
  guidelineSubText: { flex: 1, fontSize: 9.5, color: "#333", lineHeight: 1.4 },

  /* Competency header block */
  competencyBar: {
    backgroundColor: BRAND,
    color: "#fff",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    padding: 8,
    paddingHorizontal: 12,
    marginBottom: 0,
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

  /* Question + STAR notes table */
  questionText: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 6,
    marginTop: 10,
    color: "#333",
    fontFamily: "Helvetica-Bold",
  },
  notesBox: {
    borderWidth: 1,
    borderColor: GRID,
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    backgroundColor: BOX_BG_LIGHT,
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: GRID,
  },
  starHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: GRID,
  },
  starHeaderCell: {
    flex: 1,
    padding: 5,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    backgroundColor: BOX_BG,
    borderRightWidth: 1,
    borderRightColor: GRID,
  },
  starHeaderCellLast: {
    flex: 1,
    padding: 5,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    backgroundColor: BOX_BG,
  },
  starBodyRow: {
    flexDirection: "row",
    // One question per page: the notes area fills the remaining page height
    // so panel members have maximum writing space.
    minHeight: 420,
  },
  starBodyCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: BOX_BORDER,
  },
  starBodyCellLast: { flex: 1 },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: GRID,
    padding: 4,
    paddingRight: 6,
  },
  ratingLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    marginRight: 6,
  },
  ratingSlot: {
    borderWidth: 1,
    borderColor: GRID,
    backgroundColor: "#fff",
    width: 40,
    height: 20,
  },

  /* Overall rating table */
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    marginTop: 6,
    marginBottom: 6,
  },
  ratingsTable: {
    borderWidth: 1,
    borderColor: GRID,
    marginBottom: 16,
  },
  ratingsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: GRID,
    minHeight: 22,
  },
  ratingsRowLast: { flexDirection: "row", minHeight: 22 },
  ratingsCell: {
    flex: 2,
    padding: 5,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: GRID,
  },
  ratingsCellScore: { flex: 1, padding: 5, fontSize: 9 },
  ratingsHeaderCell: {
    flex: 2,
    padding: 5,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    backgroundColor: BRAND,
    borderRightWidth: 1,
    borderRightColor: GRID,
  },
  ratingsHeaderScore: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    backgroundColor: BRAND,
  },

  /* Strengths / Development Areas */
  sdRow: {
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GRID,
  },
  sdCol: { flex: 1, padding: 5, minHeight: 120 },
  sdColDivider: { borderLeftWidth: 1, borderLeftColor: GRID },
  sdHeader: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 4 },

  /* Recommendation */
  recommendRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: GRID,
    marginBottom: 10,
  },
  recommendLabel: {
    flex: 2,
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: GRID,
  },
  recommendCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    textAlign: "center" as const,
    borderRightWidth: 1,
    borderRightColor: GRID,
  },
  recommendCellLast: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    textAlign: "center" as const,
  },
  recommendNote: { fontSize: 9, marginTop: 4, marginBottom: 4 },
  recommendBox: {
    borderWidth: 1,
    borderColor: GRID,
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
  signOffTable: { borderWidth: 1, borderColor: GRID },
  signOffHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: GRID,
  },
  signOffHeaderCell: {
    padding: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    borderRightWidth: 1,
    borderRightColor: GRID,
  },
  signOffHeaderCellLast: { padding: 4, fontSize: 9, fontFamily: "Helvetica-Bold" },
  signOffDataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: GRID,
    minHeight: 32,
  },
  signOffDataRowLast: { flexDirection: "row", minHeight: 32 },
  signOffCell: {
    padding: 4,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: GRID,
  },
  signOffCellLast: { padding: 4, fontSize: 9 },

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
  footerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerLogo: { width: 60, height: 25, objectFit: "contain" as const },
  footerCbiLogo: { width: 46, height: 22, objectFit: "contain" as const },
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
  jobTitle?: string;
  division?: string;
  department?: string;
  templateName: string;
  templateDescription?: string;
  interviewDate?: string | Date;
  interviewer?: string;
  questions: InterviewQuestion[];
}

/* ─── Running header (competency + back pages) ─── */
function PageHeader({
  candidateName,
  templateName,
  clientLogo,
}: {
  candidateName?: string;
  templateName: string;
  clientLogo?: string | null;
}) {
  const caption = candidateName ? `${candidateName} — ${templateName}` : templateName;
  return (
    <>
      <View style={s.topHeaderRow} fixed>
        <View style={s.topHeaderLeft}>
          <PDFText style={s.topHeaderCaption}>{caption}</PDFText>
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
        <View style={s.footerRight}>
          <PDFImage src={cbiLogo} style={s.footerCbiLogo} />
          <PDFText style={s.footerText}>Confidential</PDFText>
        </View>
      </View>
    </View>
  );
}

/* ─── Intake row helper ─── */
function IntakeRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={s.tableRow}>
      <PDFText style={s.intakeLabelCell}>{label}</PDFText>
      <PDFText style={s.intakeValueCell}>{value || " "}</PDFText>
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

  const ratingScale: Array<[string, string, string]> = [
    ["1", "Much less than acceptable", "Novice"],
    ["2", "Less than acceptable", "Developing"],
    ["3", "Acceptable", "Proficient"],
    ["4", "More than acceptable", "Highly Proficient"],
    ["5", "Much more than acceptable", "Mastery"],
  ];

  let globalIdx = 0;

  return (
    <Document>
      {/* ── Page 1: Cover (no running header) ── */}
      <Page size="A4" style={s.page}>
        <View style={s.coverPage}>
          <View style={s.coverMain}>
            {clientLogo && <PDFImage src={clientLogo} style={s.coverClientLogo} />}
            <PDFText style={s.coverTitle}>
              Competency-Based Interview (CBI) Guide for use by SITA Selection Panels
            </PDFText>
          </View>
          <View style={s.coverCandidateBlock}>
            <PDFText style={s.coverCandidateName}>{data.candidateName}</PDFText>
          </View>
        </View>
        <PageFooter />
      </Page>

      {/* ── Page 2+: CBI Guide ── */}
      <Page size="A4" style={s.page}>
        <PageHeader
          candidateName={data.candidateName}
          templateName={data.templateName}
          clientLogo={clientLogo}
        />
        <View style={s.guideTitleRow}>
          <PDFText style={s.guideTitle}>
            Competency-Based Interview (CBI) Guide for use by SITA Selection
            Panels
          </PDFText>
        </View>
        <View style={s.guideTitleDivider} />

        {/* Intake details */}
        <View style={s.table}>
          <IntakeRow label="Job Title" value={data.jobTitle} />
          <IntakeRow label="Division" value={data.division} />
          <IntakeRow label="Department" value={data.department} />
          <IntakeRow label="Candidate's Name" value={data.candidateName} />
          <IntakeRow label="Interview Date" value={dateStr} />
        </View>

        {/* Interview panel */}
        <View style={s.table}>
          <View style={s.tableRow}>
            <PDFText style={s.panelHeaderCell}>Interview Panel</PDFText>
          </View>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={s.tableRow}>
              <PDFText style={s.panelRowCell}>
                {i === 0 && data.interviewer ? data.interviewer : " "}
              </PDFText>
            </View>
          ))}
        </View>

        {/* Intro */}
        <PDFText style={s.sectionTitle}>Competency-Based Interview (CBI)</PDFText>
        <PDFText style={s.bodyText}>
          This Competency-Based Interview (CBI) has been developed for use by SITA
          selection panels and is based on the Targeted Selection™ interviewing
          methodology. This structured approach focuses the interview on the
          critical competencies required for successful job performance, thereby
          enhancing the accuracy, fairness, consistency and legal defensibility of
          the selection process.
        </PDFText>
        <PDFText style={s.bodyText}>
          Once the key competencies for the role have been identified, the next
          step is to develop structured behavioural interview questions. These
          questions are designed to elicit specific examples of a candidate's past
          behaviour for each competency. The underlying principle of behavioural
          interviewing is that past behaviour is one of the strongest predictors of
          future performance in similar circumstances.
        </PDFText>
        <PDFText style={s.bodyText}>
          This guide assists interviewers in obtaining clear and comprehensive
          behavioural evidence by exploring both successful and less successful
          experiences. It also provides a structured framework for organising,
          evaluating and rating the information gathered, ensuring objective and
          consistent assessment across candidates.
        </PDFText>

        {/* Rating scale — heading and table stay together on the same page */}
        <View wrap={false}>
          <PDFText style={s.sectionSubTitle}>Behavioural Interview Rating Scale</PDFText>
          <View style={s.table}>
            <View style={s.tableRow}>
              <PDFText style={[s.scaleHeaderCell, { width: 60 }]}>Score</PDFText>
              <PDFText style={[s.scaleHeaderCell, { flex: 1 }]}>Description</PDFText>
              <PDFText style={[s.scaleHeaderCell, { width: 130, borderRightWidth: 0 }]}>
                Proficiency Level
              </PDFText>
            </View>
            {ratingScale.map(([score, desc, level]) => (
              <View key={score} style={s.tableRow}>
                <PDFText style={[s.scaleCell, { width: 60 }]}>{score}</PDFText>
                <PDFText style={[s.scaleCell, { flex: 1 }]}>{desc}</PDFText>
                <PDFText style={[s.scaleCellLast, { width: 130 }]}>{level}</PDFText>
              </View>
            ))}
          </View>
        </View>

        {/* STAR technique — kept as one block so it isn't split mid-list */}
        <View wrap={false}>
          <PDFText style={s.sectionSubTitle}>Using the STAR Technique</PDFText>
          <PDFText style={s.bodyText}>
            Interviewers should aim to obtain at least three complete STAR examples
            for each assigned competency. Each behavioural example should include:
          </PDFText>
          <View style={s.starItem}>
            <PDFText style={s.starBullet}>•</PDFText>
            <PDFText style={s.starText}>
              <PDFText style={s.starLabel}>Situation/Task (S/T): </PDFText>
              The context or challenge faced by the candidate.
            </PDFText>
          </View>
          <View style={s.starItem}>
            <PDFText style={s.starBullet}>•</PDFText>
            <PDFText style={s.starText}>
              <PDFText style={s.starLabel}>Action (A): </PDFText>
              The specific actions taken by the candidate.
            </PDFText>
          </View>
          <View style={s.starItem}>
            <PDFText style={s.starBullet}>•</PDFText>
            <PDFText style={s.starText}>
              <PDFText style={s.starLabel}>Result (R): </PDFText>
              The outcomes achieved and the lessons learned.
            </PDFText>
          </View>
          <PDFText style={[s.bodyText, { marginTop: 8 }]}>
            Appropriate probing questions should be used to obtain complete STAR
            responses where necessary. A single STAR example may provide evidence for
            more than one competency and can therefore be considered across multiple
            competency areas, provided it is relevant and demonstrates the required
            behaviours.
          </PDFText>
        </View>

        {/* Summary of competencies — heading and table stay together */}
        <View wrap={false}>
          <PDFText style={s.sectionSubTitle}>Summary of Competencies</PDFText>
          <View style={s.table}>
            {groups.map((g, i) => (
              <View key={g.competency_name} style={s.tableRow}>
                <PDFText style={[s.intakeValueCell, { flex: 1 }]}>
                  Competency {i + 1}: {g.competency_name}
                </PDFText>
              </View>
            ))}
          </View>
        </View>

        {/* Interview guidelines — each subsection stays together */}
        <View wrap={false}>
          <PDFText style={s.sectionSubTitle}>Interview Guidelines</PDFText>
          <PDFText style={[s.bodyText, { fontFamily: "Helvetica-Bold", marginBottom: 4 }]}>
            Conducting the Interview
          </PDFText>
          {[
            "Welcome the candidate and thank them for their interest in the position and for submitting their application.",
            "Introduce all panel members and briefly explain each member's role within the organisation.",
            "Confirm the expected duration of the interview.",
            "Verify the position for which the candidate has applied.",
            "Inform the candidate that:",
          ].map((t, i) => (
            <View key={i} style={s.guidelineItem}>
              <PDFText style={s.guidelineNumber}>{i + 1}.</PDFText>
              <PDFText style={s.guidelineText}>{t}</PDFText>
            </View>
          ))}
          {[
            "The interview will follow a structured, competency-based format and may include technical clarification questions where applicable.",
            "Responses should be based on actual examples from their previous work experience using specific situations.",
            "Questions will be shared among the panel members.",
            "Panel members will take notes throughout the interview to ensure an objective and accurate assessment.",
            "The candidate will have an opportunity to ask questions at the conclusion of the interview.",
          ].map((t, i) => (
            <View key={`sub-${i}`} style={s.guidelineSubItem}>
              <PDFText style={s.guidelineSubBullet}>o</PDFText>
              <PDFText style={s.guidelineSubText}>{t}</PDFText>
            </View>
          ))}
        </View>
        <View wrap={false}>
          <PDFText
            style={[s.bodyText, { fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 4 }]}
          >
            Clarify information from the CV
          </PDFText>
          {[
            "Clarify any aspects of the candidate's CV that require additional information or explanation.",
            "Information obtained during this discussion may provide context but should not be scored, as it does not constitute behavioural evidence of competency.",
          ].map((t, i) => (
            <View key={`cv-${i}`} style={s.guidelineSubItem}>
              <PDFText style={s.guidelineSubBullet}>o</PDFText>
              <PDFText style={s.guidelineSubText}>{t}</PDFText>
            </View>
          ))}
        </View>
        <View wrap={false}>
          <PDFText
            style={[s.bodyText, { fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 4 }]}
          >
            Commence the competency-based interview
          </PDFText>
          {[
            "Proceed with the planned competency-based questions.",
            "Use appropriate probing questions to obtain complete STAR (Situation/Task, Action and Result) examples before evaluating the candidate's responses.",
          ].map((t, i) => (
            <View key={`start-${i}`} style={s.guidelineSubItem}>
              <PDFText style={s.guidelineSubBullet}>o</PDFText>
              <PDFText style={s.guidelineSubText}>{t}</PDFText>
            </View>
          ))}
        </View>

        <PageFooter />
      </Page>

      {/* ── Question pages: one question per page for handwritten notes ── */}
      <Page size="A4" style={s.page}>
        <PageHeader
          candidateName={data.candidateName}
          templateName={data.templateName}
          clientLogo={clientLogo}
        />

        {groups.map((group, gi) =>
          group.questions.map((q, qi) => {
            globalIdx += 1;
            return (
              <View key={q.question_id} break={gi > 0 || qi > 0}>
                <PDFText style={s.competencyBar}>
                  Competency {gi + 1}: {group.competency_name}
                </PDFText>
                <View style={s.competencyInfo}>
                  <PDFText style={s.competencyInfoLine}>Definition</PDFText>
                  <PDFText style={s.competencyInfoLine}>
                    Behavioral Descriptors
                  </PDFText>
                </View>

                <PDFText style={s.questionText}>
                  {globalIdx}. {q.question_text}
                </PDFText>
                <View style={s.notesBox}>
                  <PDFText style={s.notesTitle}>
                    Notes on Candidate response:
                  </PDFText>
                  <View style={s.starHeaderRow}>
                    <PDFText style={s.starHeaderCell}>Situation/Task</PDFText>
                    <PDFText style={s.starHeaderCell}>Action</PDFText>
                    <PDFText style={s.starHeaderCellLast}>Results</PDFText>
                  </View>
                  <View style={s.starBodyRow}>
                    <View style={s.starBodyCell} />
                    <View style={s.starBodyCell} />
                    <View style={s.starBodyCellLast} />
                  </View>
                  <View style={s.ratingRow}>
                    <PDFText style={s.ratingLabel}>Rating</PDFText>
                    <View style={s.ratingSlot} />
                  </View>
                </View>
              </View>
            );
          }),
        )}

        <PageFooter />
      </Page>

      {/* ── Overall Rating + Strengths + Recommendation ── */}
      <Page size="A4" style={s.page}>
        <PageHeader
          candidateName={data.candidateName}
          templateName={data.templateName}
          clientLogo={clientLogo}
        />

        <PDFText style={s.sectionHeader}>Overall Rating per Competency:</PDFText>
        <View style={s.ratingsTable}>
          <View style={s.ratingsRow}>
            <PDFText style={s.ratingsHeaderCell}>Competency Name</PDFText>
            <PDFText style={s.ratingsHeaderScore}>Rating</PDFText>
          </View>
          {groups.map((g) => (
            <View key={g.competency_name} style={s.ratingsRow}>
              <PDFText style={s.ratingsCell}>{g.competency_name}</PDFText>
              <PDFText style={s.ratingsCellScore}> </PDFText>
            </View>
          ))}
          <View style={s.ratingsRowLast}>
            <PDFText style={[s.ratingsCell, { fontFamily: "Helvetica-Bold" }]}>
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
          If yes, key reasons for the recommendation?
        </PDFText>
        <View style={s.recommendBox} />

        <PDFText style={s.recommendNote}>
          If no, key reasons for the recommendation and any suggestions on
          alternative placement?
        </PDFText>
        <View style={s.recommendBox} />

        <PageFooter />
      </Page>

      {/* ── Final Sign-Off ── */}
      <Page size="A4" style={s.page}>
        <PageHeader
          candidateName={data.candidateName}
          templateName={data.templateName}
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

        <PDFText style={s.signOffLabel}>Signatures of HR Partner:</PDFText>
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
  // `BRAND_ACCENT`/`TEXT_DIM` are part of the palette but not directly
  // referenced inside rendered styles — reference them here so the palette
  // constants aren't flagged as unused by eslint/tsc.
  void BRAND_ACCENT;
  void TEXT_DIM;

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

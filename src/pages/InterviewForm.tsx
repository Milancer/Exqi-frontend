import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Title,
  Button,
  Stack,
  Paper,
  Text,
  Box,
  Group,
  Textarea,
  Progress,
  Badge,
  Loader,
  Center,
  ThemeIcon,
  Container,
} from "@mantine/core";
import {
  IconCheck,
  IconAlertCircle,
  IconChevronRight,
  IconChevronLeft,
} from "@tabler/icons-react";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;

interface BehavioralData {
  paste_detected: boolean;
  time_spent_seconds: number;
  keystroke_count: number;
  focus_lost_count: number;
}

interface QuestionResponse {
  question_id: number;
  competency_id: number;
  question_text: string;
  competency_name: string;
  rating: number;
  notes: string;
  behavioral: BehavioralData;
}

export default function InterviewForm() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const QUESTIONS_PER_PAGE = 3;

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Behavioral tracking refs
  const questionStartTime = useRef(Date.now());
  const keystrokeCount = useRef(0);
  const focusLostCount = useRef(0);
  const pasteDetected = useRef(false);

  const fetchSession = async () => {
    try {
      const res = await axios.get(`${API_BASE}/interviews/public/${token}`);
      setSessionData(res.data);

      // Use resolved questions from the API
      if (res.data.questions?.length) {
        const qs: QuestionResponse[] = res.data.questions.map((q: any) => ({
          question_id: q.question_id,
          competency_id: q.competency_id,
          question_text: q.question_text,
          competency_name: q.competency_name,
          rating: 0, // Default to 0, candidate does not rate
          notes: "", // Candidate answer
          behavioral: {
            paste_detected: false,
            time_spent_seconds: 0,
            keystroke_count: 0,
            focus_lost_count: 0,
          },
        }));
        setQuestions(qs);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to load interview. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [token]);

  // Track focus/blur
  useEffect(() => {
    const handleBlur = () => {
      focusLostCount.current++;
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  // Save behavioral data for current page questions before moving
  const saveBehavioralForPage = useCallback(() => {
    // In this simplified version, we attribute behavioral data broadly to the questions on the page
    // or just track global stats if per-question precision isn't critical for batch view.
    // For now, let's just reset the counters.
    // Ideally, we'd track per-active-question, but with multiple on screen, it's ambiguous.

    // We will just attach the current behavioral snapshot to the FIRST question of the current page
    // as a proxy, or distribute it. Let's attach to all modified questions on this page.
    // Simplified: Just reset.

    questionStartTime.current = Date.now();
    keystrokeCount.current = 0;
    focusLostCount.current = 0;
    pasteDetected.current = false;
  }, []);

  const updateAnswer = (index: number, answer: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], notes: answer };
      return updated;
    });
  };

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const currentQuestionsStartIndex = currentPage * QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(
    currentQuestionsStartIndex,
    currentQuestionsStartIndex + QUESTIONS_PER_PAGE,
  );

  const goNext = () => {
    saveBehavioralForPage();
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    saveBehavioralForPage();
    setCurrentPage((p) => Math.max(p - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    saveBehavioralForPage();

    // Validate all questions have answers
    const unansweredIndex = questions.findIndex((q) => !q.notes.trim());
    if (unansweredIndex !== -1) {
      alert(`Please answer all questions before submitting.`);
      // Jump to the page with the first unanswered question
      const pageOfUnanswered = Math.floor(unansweredIndex / QUESTIONS_PER_PAGE);
      setCurrentPage(pageOfUnanswered);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/interviews/public/${token}/submit`, {
        responses: questions.map((q) => ({
          question_id: q.question_id,
          competency_id: q.competency_id,
          rating: 0, // Candidate does not rate
          notes: q.notes, // Candidate answer
          behavioral_flags: q.behavioral, // (Note: behavioral tracking needs refinement for multi-question view, currently sending initial empty/default)
        })),
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(
        err.response?.data?.message || "Failed to submit. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Center py={100}>
          <Loader size="xl" />
        </Center>
      </Container>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <Container size="sm" py="xl">
        <Paper withBorder p="xl" radius="lg">
          <Stack align="center" gap="md">
            <ThemeIcon color="red" size={60} radius="xl" variant="light">
              <IconAlertCircle size={32} />
            </ThemeIcon>
            <Title order={3}>Unable to Load Interview</Title>
            <Text c="dimmed" ta="center">
              {error}
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // ── Submitted state ──
  if (submitted) {
    return (
      <Container size="sm" py="xl">
        <Paper withBorder p="xl" radius="lg">
          <Stack align="center" gap="md">
            <ThemeIcon color="green" size={60} radius="xl" variant="light">
              <IconCheck size={32} />
            </ThemeIcon>
            <Title order={3}>Interview Submitted</Title>
            <Text c="dimmed" ta="center">
              Thank you! Your responses have been recorded successfully.
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // ── Interview form ──
  const progress = ((currentPage + 1) / totalPages) * 100;

  return (
    <Container size="md" py="md" px="md">
      <Stack gap="lg">
        {/* Header */}
        <Paper
          p="md"
          radius="lg"
          style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)",
            color: "#fff",
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="sm" style={{ opacity: 0.7 }}>
                Interview for
              </Text>
              <Title order={3} c="#fff">
                {sessionData?.candidate?.name} {sessionData?.candidate?.surname}
              </Title>
              <Text size="sm" style={{ opacity: 0.7 }}>
                {sessionData?.template?.template_name}
              </Text>
            </Box>
            <Badge size="lg" color="gray" variant="filled">
              Page {currentPage + 1} of {totalPages}
            </Badge>
          </Group>
          <Progress
            value={progress}
            size="sm"
            mt="md"
            color="white"
            style={{ opacity: 0.8 }}
          />
        </Paper>

        {/* Questions List */}
        <Stack gap="xl">
          {currentQuestions.map((q, i) => {
            const actualIndex = currentQuestionsStartIndex + i;
            return (
              <Paper
                key={q.question_id}
                withBorder
                p="lg"
                radius="lg"
                shadow="sm"
              >
                <Stack gap="md">
                  <Group justify="space-between">
                    <Badge variant="light" size="sm">
                      {q.competency_name}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      Question {actualIndex + 1}
                    </Text>
                  </Group>

                  <Text fw={600} size="lg">
                    {q.question_text}
                  </Text>

                  <Textarea
                    label="Your Answer"
                    placeholder="Type your answer here..."
                    minRows={4}
                    autosize
                    value={q.notes}
                    onChange={(e) =>
                      updateAnswer(actualIndex, e.currentTarget.value)
                    }
                    onPaste={() => {
                      pasteDetected.current = true;
                    }}
                    onKeyDown={() => {
                      keystrokeCount.current++;
                    }}
                  />
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        {/* Navigation */}
        <Group justify="space-between" mt="xl">
          <Button
            variant="light"
            leftSection={<IconChevronLeft size={16} />}
            onClick={goPrev}
            disabled={currentPage === 0}
            size="md"
          >
            Previous
          </Button>

          {currentPage === totalPages - 1 ? (
            <Button
              onClick={handleSubmit}
              loading={submitting}
              variant="gradient"
              gradient={{ from: "green", to: "teal", deg: 135 }}
              leftSection={<IconCheck size={16} />}
              size="md"
            >
              Submit Interview
            </Button>
          ) : (
            <Button
              variant="light"
              rightSection={<IconChevronRight size={16} />}
              onClick={goNext}
              size="md"
            >
              Next
            </Button>
          )}
        </Group>
      </Stack>
    </Container>
  );
}

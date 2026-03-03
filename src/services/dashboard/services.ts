import api from "../api";

export async function getDashboardStats() {
  const [competencies, questions, templates, jobProfiles, interviews] =
    await Promise.all([
      api.get("/competencies"),
      api.get("/cbi/questions"),
      api.get("/cbi/templates"),
      api.get("/job-profiles"),
      api.get("/interviews"),
    ]);

  return {
    competencies: competencies.data,
    questions: questions.data,
    templates: templates.data,
    jobProfiles: jobProfiles.data,
    interviews: interviews.data,
  };
}

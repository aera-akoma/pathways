export function scorePercent(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(Math.max(0, Math.min(100, number))) : null;
}
export function buildScoreSummary(student = {}) {
  const data = student.scoreBreakdown || {};
  const metric = (label, value) => ({ label, value: scorePercent(value) });
  return {
    overall: scorePercent(student.score) ?? 0,
    rank: Number.isInteger(Number(student.departmentRank)) && Number(student.departmentRank) > 0 ? Number(student.departmentRank) : null,
    groups: [
      { title: 'Skills', value: scorePercent(data.skills), metrics: [metric('Technical skills', data.technicalSkills), metric('Soft skills', data.softSkills), metric('Communication', data.communication)] },
      { title: 'Experience', value: scorePercent(data.experience), metrics: [metric('Projects', data.projects), metric('Internships', data.internships), metric('Mock interviews', data.mockInterviews)] },
      { title: 'Career assets', value: scorePercent(data.careerAssets), metrics: [metric('Certifications', data.certifications), metric('Assessments', data.assessments), metric('Profile', student.completion)] }
    ]
  };
}

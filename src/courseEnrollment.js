export function selectEnrolledCourses(courses, query = '') {
  const search = query.trim().toLowerCase();
  return courses.filter(course => course.studentClicked === true && (!search || (course.title || '').toLowerCase().includes(search)))
    .sort((a, b) => (Date.parse(b.studentClickedAt) || 0) - (Date.parse(a.studentClickedAt) || 0));
}

export async function recordCourseVisit({ course, studentId, studentName, studentPhone, apiBase = '', openWindow, fetcher = fetch }) {
  const destination = course.url || course.link;
  if (!studentId || !destination) throw new Error('This course cannot be opened right now.');
  const parsed = new URL(destination);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('This course link is unavailable.');
  openWindow(destination, '_blank', 'noopener,noreferrer');
  const response = await fetcher(`${apiBase}/api/programs/${encodeURIComponent(course.id)}/click`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, studentName, studentPhone, courseTitle: course.title, url: destination })
  });
  if (!response.ok) throw new Error('Your course opened, but enrollment could not be saved. Please try Visit again.');
  const data = await response.json();
  if (data.success !== true) throw new Error('Enrollment could not be saved. Please try Visit again.');
  return data;
}

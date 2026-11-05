export const ACADEMIC_COURSES = ['BCA', 'MCA', 'BBA', 'MBA', 'OTHER'];

export function academicCourseOption(course) {
  const value = String(course ?? '').trim().toUpperCase();
  return ACADEMIC_COURSES.includes(value) ? value : 'OTHER';
}

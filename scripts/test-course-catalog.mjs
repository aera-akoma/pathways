import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { recordCourseVisit } from '../src/courseEnrollment.js';
const source = fs.readFileSync('src/CourseCatalog.jsx', 'utf8');
const fetchCode = source.slice(source.indexOf('  const fetchPrograms = async'), source.indexOf('\n  const saveCertificates')) + '\nglobalThis.refresh = fetchPrograms;';
const visitCode = source.slice(source.indexOf('  const handleOpenCourse = async'), source.indexOf('  // Open upload modal')) + '\nglobalThis.visit = handleOpenCourse;';
function context(fetcher) {
  const c = { apiBase: '', currentStudentId: 'student-a', ownerRef: { current: 'student-a' }, session: {}, student: {}, visitInFlight: { current: false }, state: { courses: [{ id: 'deleted-sample' }] }, enrollment: {}, errors: [], fetch: fetcher, recordCourseVisit: args => recordCourseVisit({ ...args, fetcher }), window: { open: () => {} }, setOpeningCourseId: () => {} };
  c.setState = fn => c.state = fn(c.state);
  c.setEnrollment = value => c.enrollment = typeof value === 'function' ? value(c.enrollment) : value;
  c.notify = error => c.errors.push(error);
  vm.createContext(c); vm.runInContext(fetchCode + visitCode, c); return c;
}
const serverCourse = { id: 'a', title: 'Course', link: 'https://example.com', studentClicked: true, studentClickedAt: '2026-10-01' };
for (const data of [[], [serverCourse]]) {
  const c = context(async () => ({ ok: true, json: async () => data })); await c.refresh();
  assert.equal(c.state.courses.length, data.length);
  assert.equal(c.enrollment.owner, 'student-a');
  if (data.length) { assert.equal(c.state.courses[0].studentClicked, true); assert.equal(c.state.courses[0].studentClickedAt, serverCourse.studentClickedAt); }
}
let complete;
const stale = context(() => new Promise(resolve => complete = resolve));
const loading = stale.refresh(); stale.ownerRef.current = 'student-b'; complete({ ok: true, json: async () => [serverCourse] }); await loading;
assert.equal(stale.state.courses[0].id, 'deleted-sample');
for (const ok of [true, false]) {
  const c = context(async () => ({ ok, json: async () => ({ success: true, clickedAt: '2026-11-02' }) }));
  c.enrollment = { owner: 'student-a', courses: [{ ...serverCourse, studentClicked: false }], loading: false, error: '' };
  await c.visit(serverCourse);
  assert.equal(c.enrollment.courses[0].studentClicked, ok);
  assert.equal(c.errors.length, ok ? 0 : 1);
}
console.log('PASS: actual catalog refresh restores scoped enrollment metadata, removes cached courses, ignores previous student responses, and Visit enrolls only after persistence succeeds');

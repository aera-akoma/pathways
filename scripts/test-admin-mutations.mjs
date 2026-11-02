import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../src/AdminManageViews.jsx', import.meta.url), 'utf8');
const helper = fs.readFileSync(new URL('../src/api.js', import.meta.url), 'utf8').replaceAll('export ', '');
function handler(component, name) {
  const start = source.indexOf('  const ' + name + ' = ', source.indexOf('export function ' + component));
  assert.ok(start >= 0);
  const end = source.indexOf('\n  };', start) + 5;
  return source.slice(start, end) + '\n globalThis.run = ' + name + ';';
}
const record = { id: 'server-42', name: 'Admin', title: 'Course', phone: '9876543210', permissions: [] };
function harness(component, name, mode, extra = {}) {
  let state = { courses: [record], admins: [record], students: [record] };
  let changes = 0, closes = 0, certWrites = 0;
  const messages = [], calls = [];
  const ctx = {
    title: 'Course', url: 'https://example.com', provider: 'Provider', targetCourse: 'All', validTill: '2026-12-31', description: '', bannerImg: '',
    name: 'Admin', email: 'admin@example.com', phone: '9876543210', department: '', role: 'Admin', permissions: ['manage_courses'], password: 'StrongPassword1!',
    modalMode: 'add', activeCourse: record, activeAdmin: record, admins: [record], deleteTarget: record,
    isCurrentUserMainAdmin: true, currentEmail: 'root@example.com', isMainAdminAccount: () => false, passwordError: () => null, PASSWORD_HINT: 'hint',
    certificates: [record], session: {}, rejectModalCert: record, rejectRemarks: '', selectedCert: null,
    newStudent: { ...record, fathersName: '', email: 'student@example.com', course: 'BCA', semester: 'V', goal: '', score: 0 }, editStudent: record,
    setState: fn => { state = fn(state); changes++; }, notify: msg => messages.push(msg), closeModal: () => closes++, setDeleteTarget: () => closes++,
    setRejectModalCert: () => closes++, setRejectRemarks: () => {}, saveCertificates: () => certWrites++, setSelectedCert: () => {}, setShowAddModal: () => closes++, setNewStudent: () => {}, setEditStudent: () => closes++,
    fetch: async (...args) => {
      calls.push(args);
      if (mode === 'network') throw new Error('Network unavailable');
      return { ok: mode === 'success' || mode === 'invalid' || mode === 'html', status: mode === 'success' ? 200 : 403, json: async () => { if (mode === 'html') throw new Error('Unexpected token <'); return mode === 'success' ? record : mode === 'invalid' ? {} : { error: 'Access denied' }; } };
    }, ...extra
  };
  vm.createContext(ctx); vm.runInContext(helper + '\n' + handler(component, name), ctx);
  return { ctx, messages, calls, result: () => ({ state, changes, closes, certWrites }) };
}
const cases = [
  ['AdminCoursesView', 'handleSave', { modalMode: 'add' }],
  ['AdminCoursesView', 'handleSave', { modalMode: 'edit' }],
  ['AdminCoursesView', 'confirmDelete'],
  ['AdminUserManagementView', 'handleSave', { modalMode: 'add' }],
  ['AdminUserManagementView', 'handleSave', { modalMode: 'edit' }],
  ['AdminUserManagementView', 'togglePermission'],
  ['AdminUserManagementView', 'confirmDelete'],
  ['AdminCertificatesView', 'handleApprove'],
  ['AdminCertificatesView', 'handleConfirmReject'],
  ['AdminCertificatesView', 'confirmDelete'],
  ['AdminStudentDirectoryView', 'handleCreateStudent'],
  ['AdminStudentDirectoryView', 'handleSaveEdit'],
  ['AdminStudentDirectoryView', 'handleDeleteStudent']
];
let count = 0;
for (const [component, name, extra] of cases) {
  for (const mode of ['http', 'network', 'html', 'success']) {
    const h = harness(component, name, mode, extra);
    await h.ctx.run(name === 'togglePermission' ? record.id : name === 'handleApprove' ? record : { preventDefault() {} }, 'manage_courses');
    assert.equal(h.calls.length, 1, component + '/' + name);
    const r = h.result();
    if (mode !== 'success') {
      assert.equal(r.changes + r.closes + r.certWrites, 0, component + '/' + name + ' must retain UI on failure');
      assert.match(h.messages[0], mode === 'http' ? /Access denied/ : mode === 'html' ? /invalid response/ : /Network unavailable/);
    } else {
      assert.ok(r.changes + r.certWrites > 0, component + '/' + name + ' commits success');
      if (name === 'handleSave' && extra.modalMode === 'add') assert.equal((component === 'AdminCoursesView' ? r.state.courses[0] : r.state.admins.at(-1)).id, record.id);
      if (name === 'handleCreateStudent') assert.equal(r.state.students[0].id, record.id);
    }
    count++;
  }
}
for (const component of ['AdminCoursesView', 'AdminUserManagementView']) {
  const h = harness(component, 'handleSave', 'invalid');
  await h.ctx.run({ preventDefault() {} });
  assert.equal(h.result().changes + h.result().closes, 0);
  assert.match(h.messages[0], /did not return the saved record/); count++;
}
console.log(`Passed ${count} admin mutation handler checks (HTTP errors, network failures, success, authoritative IDs, malformed create responses).`);

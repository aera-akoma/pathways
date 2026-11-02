import test from 'node:test';
import assert from 'node:assert/strict';
import { recordCourseVisit, selectEnrolledCourses } from './courseEnrollment.js';

test('enrolled courses require server-confirmed current-student clicks', () => {
  assert.deepEqual(selectEnrolledCourses([{ id: 'old', enrolled: true }, { id: 'yes', title: 'Science', studentClicked: true }], 'sci').map(c => c.id), ['yes']);
});

test('opens synchronously and waits for successful enrollment persistence', async () => {
  const events = [];
  let finish;
  const request = recordCourseVisit({ course: { id: 'a', url: 'https://example.com' }, studentId: 's', openWindow: () => events.push('open'), fetcher: () => { events.push('save'); return new Promise(resolve => { finish = resolve; }); } });
  assert.deepEqual(events, ['open', 'save']);
  finish({ ok: true, json: async () => ({ success: true, clickedAt: 'today' }) });
  assert.equal((await request).clickedAt, 'today');
});

test('failed persistence rejects instead of reporting enrollment', async () => {
  await assert.rejects(recordCourseVisit({ course: { id: 'a', url: 'https://example.com' }, studentId: 's', openWindow: () => {}, fetcher: async () => ({ ok: false }) }), /could not be saved/);
});

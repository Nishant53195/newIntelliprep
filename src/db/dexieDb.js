import Dexie from 'dexie';

export const db = new Dexie('IntelliPrepDB');

db.version(3).stores({
  users: 'uid, displayName, email, configuredAt',
  master_gs_subjects: 'id, name, paper, type',
  prelims_pyq: '++id, year, subjectId, topicId, subtopicId, createdAt'
});
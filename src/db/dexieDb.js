import Dexie from 'dexie';

export const db = new Dexie('IntelliPrepDB');

db.version(1).stores({
  users: 'uid, displayName, email, configuredAt',
});
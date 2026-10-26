import { promises as fs } from 'fs';
import path from 'path';
import { START } from '@/economy/rules';

// User records live in MongoDB when MONGODB_URI is set, otherwise in a JSON
// file under ./data. The file is fine for local development; hosts without a
// writable disk (Vercel and friends) need MongoDB.
//
// A user: { id, email, name, picture, wallet, seen, createdAt, updatedAt }
// `seen` remembers recent event ids so a retried sync is never applied twice.

// Next.js may load this module once per route, so shared things hang off globalThis.
const shared = (globalThis.__buttonHatesYouDb ??= { queue: Promise.resolve(), mongo: null });

export function newUser(profile) {
  const now = Date.now();
  return { ...profile, wallet: START, seen: [], createdAt: now, updatedAt: now };
}

export const getUser = (id) => (process.env.MONGODB_URI ? mongoGet(id) : fileGet(id));

// fn(user or null) -> user. Runs as one atomic read-modify-write.
export const updateUser = (id, fn) => (process.env.MONGODB_URI ? mongoUpdate(id, fn) : fileUpdate(id, fn));

/* ---------- JSON file ---------- */
const FILE = path.join(process.cwd(), 'data', 'users.json');

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}

async function fileGet(id) {
  await shared.queue;
  return (await readAll())[id] ?? null;
}

function fileUpdate(id, fn) {
  const run = shared.queue.then(async () => {
    const all = await readAll();
    const user = fn(all[id] ?? null);
    all[id] = user;
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(all, null, 2));
    return user;
  });
  shared.queue = run.catch(() => {});
  return run;
}

/* ---------- MongoDB ---------- */
function users() {
  shared.mongo ??= import('mongodb').then(async ({ MongoClient }) => {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    return client.db(process.env.MONGODB_DB || 'buttonHatesYou').collection('users');
  });
  return shared.mongo;
}

const fromDoc = ({ _id, rev, ...user }) => user;

async function mongoGet(id) {
  const doc = await (await users()).findOne({ _id: id });
  return doc && fromDoc(doc);
}

// Optimistic locking on `rev`: if two requests race, the loser re-reads and
// tries again, so no event is lost or applied twice.
async function mongoUpdate(id, fn) {
  const col = await users();
  for (let i = 0; i < 5; i++) {
    const doc = await col.findOne({ _id: id });
    const user = fn(doc && fromDoc(doc));
    try {
      if (!doc) {
        await col.insertOne({ _id: id, rev: 1, ...user });
        return user;
      }
      const { matchedCount } = await col.replaceOne({ _id: id, rev: doc.rev }, { rev: doc.rev + 1, ...user });
      if (matchedCount) return user;
    } catch (e) {
      if (e.code !== 11000) throw e; // someone else created it first: retry
    }
  }
  throw new Error('Too many concurrent updates');
}

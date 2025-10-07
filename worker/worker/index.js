import { webPush } from 'web-push-lite';

const PUBLIC_VAPID_KEY = 'BDPy7...'; // Replace with your public VAPID key
const PRIVATE_VAPID_KEY = 'uG9c...'; // Replace with your private VAPID key

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers: corsHeaders });

    const now = new Date();

    // ===================== Your Original Tips Functions =====================
    function getTableName(year) {
      const y = Number.parseInt(year, 10);
      return `data_${Number.isFinite(y) ? y : new Date().getFullYear()}`;
    }

    async function createTableIfNotExists(db, year) {
      const table = getTableName(year);
      const sql = `CREATE TABLE IF NOT EXISTS "${table}" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month INTEGER NOT NULL,
        points INTEGER NOT NULL DEFAULT 5767,
        total REAL NOT NULL DEFAULT 0.0,
        day1 REAL DEFAULT 0.0, day2 REAL DEFAULT 0.0, day3 REAL DEFAULT 0.0, day4 REAL DEFAULT 0.0, day5 REAL DEFAULT 0.0,
        day6 REAL DEFAULT 0.0, day7 REAL DEFAULT 0.0, day8 REAL DEFAULT 0.0, day9 REAL DEFAULT 0.0, day10 REAL DEFAULT 0.0,
        day11 REAL DEFAULT 0.0, day12 REAL DEFAULT 0.0, day13 REAL DEFAULT 0.0, day14 REAL DEFAULT 0.0, day15 REAL DEFAULT 0.0,
        day16 REAL DEFAULT 0.0, day17 REAL DEFAULT 0.0, day18 REAL DEFAULT 0.0, day19 REAL DEFAULT 0.0, day20 REAL DEFAULT 0.0,
        day21 REAL DEFAULT 0.0, day22 REAL DEFAULT 0.0, day23 REAL DEFAULT 0.0, day24 REAL DEFAULT 0.0, day25 REAL DEFAULT 0.0,
        day26 REAL DEFAULT 0.0, day27 REAL DEFAULT 0.0, day28 REAL DEFAULT 0.0, day29 REAL DEFAULT 0.0, day30 REAL DEFAULT 0.0,
        day31 REAL DEFAULT 0.0,
        UNIQUE(month)
      )`;
      await db.prepare(sql).run();
      return table;
    }

    async function tableExists(db, table) {
      const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").bind(table).all();
      return results && results.length > 0;
    }

    function calculateMonthTotal(row) {
      let total = 0;
      for (let i = 1; i <= 31; i++) {
        const v = Number.parseFloat(row[`day${i}`] ?? 0);
        total += Number.isFinite(v) ? v : 0;
      }
      return Math.round(total * 100) / 100;
    }

    async function getPreviousMonthPoints(db, year, month) {
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth <= 0) { prevMonth = 12; prevYear = year - 1; }
      const prevTable = getTableName(prevYear);
      if (!(await tableExists(db, prevTable))) return 5767;
      const { results } = await db
        .prepare(`SELECT points FROM "${prevTable}" WHERE month = ? ORDER BY id DESC LIMIT 1`)
        .bind(prevMonth)
        .all();
      return results && results[0] ? Number.parseInt(results[0].points, 10) : 5767;
    }

    async function parseBody(request) {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) return await request.json();
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const fd = await request.formData();
        const obj = {};
        for (const [k, v] of fd.entries()) obj[k] = v;
        return obj;
      }
      return Object.fromEntries(new URL(request.url).searchParams.entries());
    }

    function requirePassword(method, bodyOrQuery) {
      if (method !== 'POST') return;
      const provided = bodyOrQuery.password || bodyOrQuery.p || '';
      const expected = env.API_PASSWORD || '';
      if (!expected) return;
      if (!provided || provided !== expected) throw { status: 401, message: 'Invalid password', details: { hint: 'Check API_PASSWORD secret' } };
    }

    // ===================== Push Notification Functions =====================
    async function saveSubscription(db, sub) {
      const id = crypto.randomUUID();
      const nowSec = Math.floor(Date.now() / 1000);
      await db.prepare(`INSERT INTO subscriptions (id, endpoint, keys, created_at) VALUES (?, ?, ?, ?)`)
        .bind(id, sub.endpoint, JSON.stringify(sub.keys), nowSec).run();
    }

    async function sendNotification(db, message) {
      const { results } = await db.prepare('SELECT * FROM subscriptions').all();
      const sends = results.map(row => {
        const sub = { endpoint: row.endpoint, keys: JSON.parse(row.keys) };
        return webPush.sendNotification(sub, JSON.stringify({ title: 'Tips', message }), {
          vapid: { subject: 'mailto:you@yourdomain.com', publicKey: PUBLIC_VAPID_KEY, privateKey: PRIVATE_VAPID_KEY }
        });
      });
      await Promise.all(sends);
    }

    // ===================== Main Request Handling =====================
    try {
      const method = request.method.toUpperCase();
      const action = url.searchParams.get('action') || '';
      const year = Number.parseInt(url.searchParams.get('year') || String(now.getFullYear()), 10);
      const month = Number.parseInt(url.searchParams.get('month') || String(now.getMonth() + 1), 10);

      // Ensure table exists
      await createTableIfNotExists(env.DB, year);
      const table = getTableName(year);

      if (method === 'GET') {
        if (action === 'get_year') {
          const { results } = await env.DB.prepare(`SELECT month, points, total FROM "${table}" ORDER BY month ASC`).all();
          return json({ year, months: results || [] });
        }
        if (action === 'get_month') {
          const { results } = await env.DB.prepare(`SELECT * FROM "${table}" WHERE month = ?`).bind(month).all();
          const row = results && results[0];
          const days = {};
          if (row) for (let i = 1; i <= 31; i++) days[i] = Number.parseFloat(row[`day${i}`] ?? 0) || 0;
          return json({ year, month, points: row?.points || 5767, total: row?.total || 0, days });
        }
        return json({ error: 'Unknown GET action' }, 400);
      }

      if (method === 'POST') {
        const body = await parseBody(request);
        requirePassword(method, body);

        // ========== Push endpoints ==========
        if (action === 'subscribe_push') {
          if (!body.subscription) return json({ error: 'Missing subscription object' }, 400);
          await saveSubscription(env.DB, body.subscription);
          return json({ success: true });
        }

        if (action === 'send_push') {
          const msg = body.message || 'Test notification';
          await sendNotification(env.DB, msg);
          return json({ success: true });
        }

        // ========== Original Tips POST actions ==========
        if (action === 'update_day') {
          const day = Number.parseInt(body.day || '0', 10);
          const value = Number.parseFloat(body.value || '0');
          const { results } = await env.DB.prepare(`SELECT * FROM "${table}" WHERE month=?`).bind(month).all();
          if (results && results[0]) {
            await env.DB.prepare(`UPDATE "${table}" SET "day${day}"=? WHERE month=?`).bind(value, month).run();
            const { results: again } = await env.DB.prepare(`SELECT * FROM "${table}" WHERE month=?`).bind(month).all();
            const total = calculateMonthTotal(again[0]);
            await env.DB.prepare(`UPDATE "${table}" SET total=? WHERE month=?`).bind(total, month).run();
          } else {
            const points = await getPreviousMonthPoints(env.DB, year, month);
            await env.DB.prepare(`INSERT INTO "${table}" (month, points, "day${day}", total) VALUES (?, ?, ?, ?)`)
              .bind(month, points, value, value).run();
          }
          return json({ success: true, year, month, day, value });
        }

        if (action === 'update_points') {
          const points = Number.parseInt(body.points || '0', 10);
          const { results } = await env.DB.prepare(`SELECT id FROM "${table}" WHERE month=?`).bind(month).all();
          if (results && results[0]) {
            await env.DB.prepare(`UPDATE "${table}" SET points=? WHERE month=?`).bind(points, month).run();
          } else {
            await env.DB.prepare(`INSERT INTO "${table}" (month, points, total) VALUES (?, ?, 0)`).bind(month, points).run();
          }
          return json({ success: true, year, month, points });
        }

        return json({ error: 'Unknown POST action' }, 400);
      }

      return json({ error: 'Method not allowed' }, 405);

    } catch (err) {
      const status = err?.status || 500;
      return json({ error: 'Internal server error', details: err?.details || err?.message || String(err) }, status);
    }
  }
};
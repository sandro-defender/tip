export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const allowedOrigins = [
			"https://tips.you.ge",
			"https://staff.you.ge"
		];
		function buildCorsHeaders(origin) {
			const allowOrigin = allowedOrigins.includes(origin || "") ? origin : allowedOrigins[0];
			return {
				"Access-Control-Allow-Origin": allowOrigin,
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization, If-None-Match, If-Modified-Since, X-Request-ID, Cache-Control, Pragma, Expires, X-Requested-With, Accept, Accept-Language, Origin",
				"Access-Control-Allow-Credentials": "true",
				"Vary": "Origin",
				"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
				"Pragma": "no-cache",
				"Expires": "0",
				"Content-Type": "application/json; charset=utf-8"
			};
		}
		const corsHeaders = buildCorsHeaders(request.headers.get('Origin'));
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders });
		}
		function json(data, status = 200) {
			return new Response(JSON.stringify(data, null, 2), { status, headers: corsHeaders });
		}
		function getTableName(year) {
			const y = Number.parseInt(year, 10);
			return `data_${Number.isFinite(y) ? y : new Date().getFullYear()}`;
		}
		async function createPushTableIfNotExists(db) {
			const sql = `CREATE TABLE IF NOT EXISTS "push_subscriptions" (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				endpoint TEXT NOT NULL UNIQUE,
				p256dh TEXT NOT NULL,
				auth TEXT NOT NULL,
				created_at TEXT NOT NULL
			)`;
			await db.prepare(sql).run();
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
		function b64urlToUint8Array(b64url) {
			const pad = '='.repeat((4 - (b64url.length % 4)) % 4);
			const b64 = (b64url + pad).replace(/-/g, '+').replace(/_/g, '/');
			const raw = atob(b64);
			const arr = new Uint8Array(raw.length);
			for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
			return arr;
		}
		function uint8ArrayToB64url(arr) {
			let str = '';
			for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
			const b64 = btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
			return b64;
		}
		async function importVapidPrivateKey(privateKeyB64Url) {
			const keyData = b64urlToUint8Array(privateKeyB64Url);
			return await crypto.subtle.importKey(
				'pkcs8',
				keyData,
				{ name: 'ECDSA', namedCurve: 'P-256' },
				false,
				['sign']
			);
		}
		async function generateVapidJWT(audience, subject, vapidPrivateKeyB64Url) {
			const header = { alg: 'ES256', typ: 'JWT' };
			const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h
			const payload = { aud: audience, exp, sub: subject };
			const encoder = new TextEncoder();
			const b64url = (obj) => {
				const json = JSON.stringify(obj);
				const bytes = encoder.encode(json);
				return uint8ArrayToB64url(bytes);
			};
			const input = `${b64url(header)}.${b64url(payload)}`;
			const key = await importVapidPrivateKey(vapidPrivateKeyB64Url);
			const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(input)));
			const jwt = `${input}.${uint8ArrayToB64url(signature)}$`;
			return jwt.replace(/\$$/, '');
		}
		function getAudienceFromEndpoint(endpoint) {
			try {
				const u = new URL(endpoint);
				return `${u.protocol}//${u.host}`;
			} catch {
				return '';
			}
		}
		async function sendWebPushToEndpoint(endpoint, vapidPublicKeyB64Url, vapidPrivateKeyB64Url, subject) {
			const audience = getAudienceFromEndpoint(endpoint);
			if (!audience) throw new Error('Invalid endpoint URL');
			const jwt = await generateVapidJWT(audience, subject, vapidPrivateKeyB64Url);
			const headers = new Headers();
			headers.set('TTL', '2419200');
			headers.set('Authorization', `WebPush ${jwt}`);
			headers.set('Crypto-Key', `p256ecdsa=${vapidPublicKeyB64Url}`);
			const res = await fetch(endpoint, { method: 'POST', headers });
			return res;
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
			if (contentType.includes('application/json')) {
				return await request.json();
			}
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
			if (!provided || provided !== expected) {
				throw { status: 401, message: 'Invalid password', details: { hint: 'Check API_PASSWORD secret' } };
			}
		}
		try {
			const action = url.searchParams.get('action') || '';
			const method = request.method.toUpperCase();
			const now = new Date();
			if (method === 'GET' && !action) {
				return json({ error: "Missing 'action' parameter", available_actions: ['get_year','get_month'] }, 400);
			}
			if (method === 'GET') {
				const year = Number.parseInt(url.searchParams.get('year') || String(now.getFullYear()), 10);
				const month = Number.parseInt(url.searchParams.get('month') || String(now.getMonth() + 1), 10);
				if (year < 2000 || year > 2100) return json({ error: 'Invalid year parameter' }, 400);
				if (month < 1 || month > 12) return json({ error: 'Invalid month parameter' }, 400);
				await createTableIfNotExists(env.DB, year);
				const table = getTableName(year);
				if (action === 'get_year') {
					const { results } = await env.DB
						.prepare(`SELECT month, points, total FROM "${table}" ORDER BY month ASC`)
						.all();
					return json({ year, months: results || [] });
				}
				if (action === 'get_month') {
					const { results } = await env.DB
						.prepare(`SELECT * FROM "${table}" WHERE month = ?`)
						.bind(month)
						.all();
					const row = results && results[0];
					if (!row) {
						const points = await getPreviousMonthPoints(env.DB, year, month);
						return json({ year, month, points, total: 0.0, days: Object.fromEntries(Array.from({ length: 31 }, (_, i) => [i + 1, 0.0])) });
					}
					const days = {};
					for (let i = 1; i <= 31; i++) days[i] = Number.parseFloat(row[`day${i}`] ?? 0) || 0.0;
					return json({ year, month, points: Number.parseInt(row.points, 10) || 0, total: Number.parseFloat(row.total) || 0.0, days });
				}
				return json({ error: 'Unknown GET action' }, 400);
			}
			if (method === 'POST') {
				const body = await parseBody(request);
				// Skip password for public endpoints: subscribe and notify
				{
					const act = (body.action || action);
					if (act !== 'subscribe' && act !== 'notify') requirePassword(method, body);
				}
				const actionPost = body.action || action;
				if (!actionPost) return json({ error: "Missing 'action' parameter" }, 400);
				const year = Number.parseInt(body.year || String(now.getFullYear()), 10);
				const month = Number.parseInt(body.month || String(now.getMonth() + 1), 10);
				await createTableIfNotExists(env.DB, year);
				const table = getTableName(year);
				// Push subscription storage
				if (actionPost === 'subscribe') {
					await createPushTableIfNotExists(env.DB);
					const endpoint = String(body.endpoint || '').trim();
					const p256dh = String(body.p256dh || body["keys[p256dh]"] || (body.keys && body.keys.p256dh) || '').trim();
					const auth = String(body.auth || body["keys[auth]"] || (body.keys && body.keys.auth) || '').trim();
					if (!endpoint || !/^https?:\/\//i.test(endpoint)) return json({ error: 'Invalid endpoint' }, 400);
					if (!p256dh || !auth) return json({ error: 'Missing keys' }, 400);
					const { results } = await env.DB.prepare('SELECT id FROM "push_subscriptions" WHERE endpoint = ?').bind(endpoint).all();
					if (results && results[0]) {
						await env.DB.prepare('UPDATE "push_subscriptions" SET p256dh = ?, auth = ? WHERE endpoint = ?').bind(p256dh, auth, endpoint).run();
					} else {
						await env.DB.prepare('INSERT INTO "push_subscriptions" (endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?)').bind(endpoint, p256dh, auth, new Date().toISOString()).run();
					}
					return json({ success: true });
				}
				if (actionPost === 'notify') {
					await createPushTableIfNotExists(env.DB);
					const vapidPublic = (env.VAPID_PUBLIC_KEY || '').trim();
					const vapidPrivate = (env.VAPID_PRIVATE_KEY || '').trim();
					const subject = (env.VAPID_SUBJECT || 'mailto:admin@tips.you.ge').trim();
					if (!vapidPublic || !vapidPrivate) return json({ error: 'VAPID keys not configured' }, 500);
					const { results } = await env.DB.prepare('SELECT id, endpoint FROM "push_subscriptions"').all();
					const subs = results || [];
					if (subs.length === 0) return json({ success: true, sent: 0, removed: 0 });
					let sent = 0, removed = 0;
					const outcomes = await Promise.allSettled(subs.map(async (s) => {
						try {
							const res = await sendWebPushToEndpoint(s.endpoint, vapidPublic, vapidPrivate, subject);
							if (res.status === 404 || res.status === 410) {
								await env.DB.prepare('DELETE FROM "push_subscriptions" WHERE id = ?').bind(s.id).run();
								removed++;
								return 'removed';
							}
							if (res.ok) sent++;
							return 'ok';
						} catch (e) {
							return 'error';
						}
					}));
					return json({ success: true, sent, removed, total: subs.length });
				}
				if (actionPost === 'update_day') {
					const day = Number.parseInt(body.day || '0', 10);
					const value = Number.parseFloat(body.value || '0');
					if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return json({ error: 'Invalid date parameters' }, 400);
					const { results } = await env.DB.prepare(`SELECT * FROM "${table}" WHERE month = ?`).bind(month).all();
					if (results && results[0]) {
						await env.DB.prepare(`UPDATE "${table}" SET "day${day}" = ? WHERE month = ?`).bind(value, month).run();
						const { results: again } = await env.DB.prepare(`SELECT * FROM "${table}" WHERE month = ?`).bind(month).all();
						const total = calculateMonthTotal(again[0]);
						await env.DB.prepare(`UPDATE "${table}" SET total = ? WHERE month = ?`).bind(total, month).run();
					} else {
						const points = await getPreviousMonthPoints(env.DB, year, month);
						await env.DB.prepare(`INSERT INTO "${table}" (month, points, "day${day}", total) VALUES (?, ?, ?, ?)`).bind(month, points, value, value).run();
					}
					return json({ success: true, message: 'Day updated successfully', year, month, day, value });
				}
				if (actionPost === 'update_points') {
					const points = Number.parseInt(body.points || '0', 10);
					if (year < 2000 || year > 2100 || month < 1 || month > 12 || points < 0) return json({ error: 'Invalid parameters' }, 400);
					const { results } = await env.DB.prepare(`SELECT id FROM "${table}" WHERE month = ?`).bind(month).all();
					if (results && results[0]) {
						await env.DB.prepare(`UPDATE "${table}" SET points = ? WHERE month = ?`).bind(points, month).run();
					} else {
						await env.DB.prepare(`INSERT INTO "${table}" (month, points, total) VALUES (?, ?, 0.0)`).bind(month, points).run();
					}
					return json({ success: true, message: 'Points updated successfully', year, month, points });
				}
				return json({ error: 'Unknown POST action' }, 400);
			}
			return json({ error: 'Method not allowed' }, 405);
		} catch (err) {
			const status = err?.status || 500;
			return json({ error: 'Internal server error', details: err?.details || String(err?.message || err) }, status);
		}
	}
};

// Changelog:
// 2025-09-30 - Initial Worker migration from PHP+MySQL to D1 (GPT-5)
// 2025-10-07 - Added push subscription storage and notify endpoint using VAPID (GPT-5)

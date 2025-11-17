export default {
	async fetch(request, env) {
	  const url = new URL(request.url);
	  const method = request.method;
	  const cors = {
		"Access-Control-Allow-Origin": "https://tips.you.ge",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization, If-None-Match, If-Modified-Since, X-Request-ID, Cache-Control, Pragma, Expires, X-Requested-With, Accept, Accept-Language, Origin",
		"Access-Control-Allow-Credentials": "true",
		"Vary": "Origin",
		"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
		"Pragma": "no-cache",
		"Expires": "0",
		"Content-Type": "application/json; charset=utf-8"
	  };
  
	  if (method === "OPTIONS") {
		return new Response(null, { status: 204, headers: cors });
	  }
  
	  // --- CREATE TABLE IF NOT EXISTS ---
	  async function ensureTable() {
		if (!env.DB) {
		  throw new Error("D1 database binding 'DB' is not configured");
		}
  
		await env.DB.prepare(`
		  CREATE TABLE IF NOT EXISTS stock_data (
			Timestamp TEXT PRIMARY KEY,
			Date TEXT,
			Time TEXT,
			InitialStock REAL,
			Received REAL,
			Sold REAL,
			FinalStock REAL,
			ExpectedStock REAL,
			Difference REAL,
			Status TEXT
		  );
		`).run();
	  }
  
	  // --- HELPERS ---
	  const json = (obj, status = 200) =>
		new Response(JSON.stringify(obj, null, 2), {
		  status,
		  headers: { ...cors, "Content-Type": "application/json" }
		});
  
	  // --- POST: Insert row ---
	  if (method === "POST") {
		try {
		  await ensureTable();
		} catch (err) {
		  return json({ result: "error", error: `DB init failed: ${err.message}` }, 500);
		}

		let body = {};
		try {
		  body = await request.json();
		} catch (e) {
		  return json({ result: "error", error: "Invalid JSON" }, 400);
		}

		try {
		  await env.DB.prepare(
			`INSERT OR REPLACE INTO stock_data 
			(Timestamp, Date, Time, InitialStock, Received, Sold, FinalStock, ExpectedStock, Difference, Status)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		  )
			.bind(
			  body.timestamp,
			  body.date,
			  body.time,
			  body.initialStock,
			  body.received,
			  body.sold,
			  body.finalStock,
			  body.expectedStock,
			  body.difference,
			  body.status
			)
			.run();

		  return json({ result: "success" });
		} catch (err) {
		  return json({ result: "error", error: `DB insert failed: ${err.message}` }, 500);
		}
	  }
  
	  // --- GET: getHistory ---
	  if (method === "GET") {
		const action = url.searchParams.get("action");
  
		if (action === "getHistory") {
		  try {
			await ensureTable();

			const { results } = await env.DB
			  .prepare(`SELECT * FROM stock_data ORDER BY Timestamp ASC`)
			  .all();

			return json({
			  result: "success",
			  history: results.map(row => ({
				timestamp: row.Timestamp,
				date: row.Date,
				time: row.Time,
				initialStock: row.InitialStock,
				received: row.Received,
				sold: row.Sold,
				finalStock: row.FinalStock,
				expectedStock: row.ExpectedStock,
				difference: row.Difference,
				status: row.Status
			  }))
			});
		  } catch (err) {
			return json({ result: "error", error: `DB query failed: ${err.message}` }, 500);
		  }
		}
  
		return json({ result: "error", error: "Invalid action" }, 400);
	  }
  
	  return json({ result: "error", error: "Method not allowed" }, 405);
	}
  }

// --- Changelog ---
// 2025-11-17: Hardened D1 worker error handling and binding checks. (auto)
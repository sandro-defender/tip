/*
Project: staff.you.ge memo webapp
File: functions/memo.js
Version: 1.0.0
Author: Cursor AI
Model: GPT-5
Last Modified: 2025-10-17
Purpose: Cloudflare Pages Function proxy to Google Apps Script with CORS handling
*/

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://tips.you.ge',
  'https://www.tips.you.ge',
  'http://localhost:8788',
  'http://127.0.0.1:8788'
];

// Target Apps Script Web App endpoint (fallback if ENV not provided)
const DEFAULT_TARGET = 'https://script.google.com/macros/s/AKfycbx71cnfKl4WZxb2hYd-lD1xur5kc8BIXoqQkxMxZlQq_55mNj0xwxt7YOectkU-gWke/exec';

/**
 * Build CORS headers based on request origin
 */
function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

/**
 * Copy headers, skipping hop-by-hop and forbidden ones
 */
function filterRequestHeaders(headers) {
  const out = new Headers();
  for (const [k, v] of headers.entries()) {
    const key = k.toLowerCase();
    if (['host', 'origin'].includes(key)) continue;
    if (key.startsWith('cf-')) continue;
    out.set(k, v);
  }
  return out;
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '';
  const method = request.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  // Resolve target base from ENV or default
  const targetBase = (env && env.APPS_SCRIPT_URL) || DEFAULT_TARGET;

  // Preserve query string when proxying
  const targetUrl = new URL(targetBase);
  // Merge current query into target
  for (const [k, v] of url.searchParams.entries()) {
    targetUrl.searchParams.set(k, v);
  }

  // Prepare proxied request
  const init = {
    method,
    headers: filterRequestHeaders(request.headers),
    body: ['GET', 'HEAD'].includes(method) ? undefined : request.body,
    redirect: 'follow'
  };

  try {
    const upstream = await fetch(targetUrl.toString(), init);

    // Stream response through with CORS headers
    const respHeaders = new Headers(upstream.headers);
    const baseCors = corsHeaders(origin);
    Object.entries(baseCors).forEach(([k, v]) => respHeaders.set(k, v));

    // Some Apps Script responses use text/plain; allow JSON if present
    const status = upstream.status;
    return new Response(upstream.body, { status, headers: respHeaders });
  } catch (err) {
    const headers = corsHeaders(origin);
    headers['Content-Type'] = 'application/json';
    const body = JSON.stringify({ status: 'error', message: 'Proxy request failed', error: (err && err.message) || 'unknown' });
    return new Response(body, { status: 502, headers });
  }
}

/*
CHANGELOG
[2025-10-17] v1.0.0 – Added Cloudflare Pages proxy with CORS to Apps Script.
Reason: Avoid browser CORS blocks from tips.you.ge to Google Apps Script.
Impact: Frontend can call /memo endpoint; backend URL hidden; CORS resolved.
Model: GPT-5
*/

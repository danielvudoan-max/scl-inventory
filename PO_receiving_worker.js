// ════════════════════════════════════════════════════════════════════════
//  scl-po-proxy  —  SCL PO Receiving Worker  (STANDALONE)
//
//  Deliberately separate from the barcode app's worker.js so that neither
//  ever touches the other. This Worker only owns PO-receiving data.
//
//  Bindings required (set in the Cloudflare dashboard for THIS Worker):
//    SCL_DATA     - KV namespace  → bind the SAME namespace the barcode
//                                   Worker uses (a namespace can bind to
//                                   many Workers). This Worker only ever
//                                   reads/writes keys prefixed "rcv:".
//    ADMIN_TOKEN  - Secret        → can be the same value as the barcode
//                                   Worker's token, or a new one.
//
//  (No ANTHROPIC_API_KEY needed yet. The BOL vision-scan step — the next
//   build — will add a POST /scan route and its own key, still here, still
//   separate from the barcode Worker.)
//
//  Routes:
//    POST /admin/upload-po   → store the daily open-PO snapshot (overwrite)
//    GET  /po/open           → read snapshot  (?meta=1 summary, ?vendor=156 filter)
//    GET  /  or  /health     → health check
//
//  KV keys (all "rcv:" — cannot collide with barcode inventory:/count: keys):
//    rcv:po:open   → full snapshot
//    rcv:po:meta   → summary { uploaded_at, run_date, counts, vendors }
// ════════════════════════════════════════════════════════════════════════

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-token",
  "Access-Control-Max-Age": "86400",
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
}

function textErr(msg, status = 400) {
  return new Response(msg, { status, headers: CORS_HEADERS });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ─────────────────────────────────────────────────────────────
      // POST /admin/upload-po   (x-admin-token gated)
      // Body: { run_date, line_count, vendors, pos: [ {po,vendor,wh,lines[]}, ...] }
      // Full-snapshot replace: last write wins. No merge, no archive.
      // ─────────────────────────────────────────────────────────────
      if (path === "/admin/upload-po" && request.method === "POST") {
        const token = request.headers.get("x-admin-token");
        if (!token || token !== env.ADMIN_TOKEN) {
          return json({ error: "Unauthorized" }, 401);
        }

        const payload = await request.json();
        if (!Array.isArray(payload.pos)) {
          return json({ error: "Missing required field: pos (array)" }, 400);
        }
        if (payload.pos.length === 0) {
          return json({ error: "Refusing to store an empty PO snapshot" }, 400);
        }

        const uploadedAt = new Date().toISOString();
        const lineCount =
          payload.line_count ??
          payload.pos.reduce((n, p) => n + ((p.lines && p.lines.length) || 0), 0);

        const snapshot = {
          uploaded_at: uploadedAt,
          run_date: payload.run_date || "",
          po_count: payload.pos.length,
          line_count: lineCount,
          pos: payload.pos,
        };
        const meta = {
          uploaded_at: uploadedAt,
          run_date: payload.run_date || "",
          po_count: payload.pos.length,
          line_count: lineCount,
          vendors: payload.vendors || {},
        };

        await env.SCL_DATA.put("rcv:po:open", JSON.stringify(snapshot));
        await env.SCL_DATA.put("rcv:po:meta", JSON.stringify(meta));

        return json({ ok: true, ...meta });
      }

      // ─────────────────────────────────────────────────────────────
      // GET /po/open           → full snapshot
      // GET /po/open?meta=1     → summary only (fast freshness check)
      // GET /po/open?vendor=156 → only that vendor's POs
      // ─────────────────────────────────────────────────────────────
      if (path === "/po/open" && request.method === "GET") {
        if (url.searchParams.get("meta") === "1") {
          const meta = await env.SCL_DATA.get("rcv:po:meta");
          if (!meta) return json({ error: "No PO snapshot uploaded yet" }, 404);
          return new Response(meta, {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
          });
        }

        const data = await env.SCL_DATA.get("rcv:po:open");
        if (!data) return json({ error: "No PO snapshot uploaded yet" }, 404);

        const vendor = url.searchParams.get("vendor");
        if (vendor) {
          const snap = JSON.parse(data);
          snap.pos = snap.pos.filter((p) => String(p.vendor) === String(vendor));
          snap.po_count = snap.pos.length;
          snap.line_count = snap.pos.reduce(
            (n, p) => n + ((p.lines && p.lines.length) || 0), 0);
          snap.filtered_vendor = vendor;
          return json(snap);
        }

        return new Response(data, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60",
            ...CORS_HEADERS,
          },
        });
      }

      // Health check
      if ((path === "/" || path === "/health") && request.method === "GET") {
        return json({ ok: true, service: "scl-po-proxy", time: new Date().toISOString() });
      }

      return textErr("Not found", 404);
    } catch (err) {
      return json({ error: String((err && err.message) || err) }, 500);
    }
  },
};

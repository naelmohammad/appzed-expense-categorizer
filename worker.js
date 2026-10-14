/**
 * AppZed expense-categorizer (managed=true). Categorize receipt line items
 * for bookkeeping, flagging uncertain ones. Schema self-initializes.
 * Bindings: AI, DB (d1).
 */
const SCHEMA = "CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, merchant TEXT, amount REAL, category TEXT, confidence TEXT DEFAULT 'unreviewed', created_at TEXT DEFAULT (datetime('now')))";
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, solution: "expense-categorizer" });
    }
    if (request.method === "POST" && url.pathname === "/expenses") {
      const body = await request.json().catch(() => null);
      if (!body || !body.merchant || body.amount === undefined) {
        return bad("merchant and amount are required.");
      }
      await env.DB.exec(SCHEMA);
      let category = "uncategorized";
      let confidence = "low";
      try {
        const out = await env.AI.run(MODEL, {
          messages: [
            { role: "system", content: "Categorize this business expense. Reply with exactly one category word from: travel, meals, software, office, marketing, utilities, professional-services, other. Then a space and HIGH or LOW confidence." },
            { role: "user", content: `Merchant: ${body.merchant}. Amount: ${body.amount}. Note: ${body.note || "none"}.` },
          ],
          max_tokens: 64,
        });
        const parts = String(out.response || "").trim().split(/\s+/);
        if (parts[0]) category = parts[0].toLowerCase().replace(/[^a-z-]/g, "") || "uncategorized";
        confidence = /high/i.test(parts[1] || "") ? "high" : "low";
      } catch (err) {
        return Response.json({ error: String((err && err.message) || err) }, { status: 502 });
      }
      const id = crypto.randomUUID();
      await env.DB.prepare(
        "INSERT INTO expenses (id, merchant, amount, category, confidence) VALUES (?, ?, ?, ?, ?)"
      ).bind(id, body.merchant, Number(body.amount), category, confidence).run();
      return Response.json({ id, merchant: body.merchant, amount: Number(body.amount), category, confidence }, { status: 201 });
    }
    if (request.method === "GET" && url.pathname === "/uncertain") {
      await env.DB.exec(SCHEMA);
      const rows = await env.DB.prepare(
        "SELECT * FROM expenses WHERE confidence = 'low' ORDER BY created_at DESC LIMIT 50"
      ).all();
      return Response.json({ uncertain: rows.results || [] });
    }
    return new Response("Not found", { status: 404 });
  },
};

function bad(message) {
  return Response.json({ error: message }, { status: 400 });
}

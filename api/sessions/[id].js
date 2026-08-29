const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const supabaseFetch = (path, options = {}) => fetch(`${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1${path}`, {
  ...options,
  headers: {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...(options.headers || {})
  }
});

const toSessionRow = (session) => ({
  task_id: session.taskId || null,
  status: session.status || "opened",
  opened_at: session.openedAt || null,
  started_at: session.startedAt || session.taskStartedAt || null,
  completed_at: session.completedAt || null,
  last_seen_at: session.lastSeenAt || null,
  total_items: Number(session.totalItems || 0),
  attempted_items: Number(session.attemptedItems || 0),
  correct_items: Number(session.correctItems || 0),
  task_accuracy: Number.isFinite(Number(session.taskAccuracy)) ? Number(session.taskAccuracy) : null,
  completion_time_ms: Number.isFinite(Number(session.completionTimeMs)) ? Number(session.completionTimeMs) : null,
  payload: session,
  updated_at: new Date().toISOString()
});

module.exports = async (req, res) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase environment variables are required.");
    if (!["PATCH", "POST"].includes(req.method)) return json(res, 405, { error: "Method not allowed." });
    const sessionId = req.query?.id;
    const session = req.body?.session || req.body;
    if (!sessionId || !session?.sessionId || session.sessionId !== sessionId) {
      return json(res, 400, { error: "A matching sessionId is required." });
    }
    const response = await supabaseFetch(`/sessions?session_id=eq.${encodeURIComponent(sessionId)}`, {
      method: "PATCH",
      body: JSON.stringify(toSessionRow(session))
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Failed to update session.");
    return json(res, 200, { ok: true, session });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};


const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const requireSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.");
  }
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
  session_id: session.sessionId,
  task_id: session.taskId || null,
  status: session.status || "opened",
  opened_at: session.openedAt || null,
  started_at: session.startedAt || session.taskStartedAt || null,
  completed_at: session.completedAt || null,
  last_seen_at: session.lastSeenAt || session.openedAt || null,
  total_items: Number(session.totalItems || 0),
  attempted_items: Number(session.attemptedItems || 0),
  correct_items: Number(session.correctItems || 0),
  task_accuracy: Number.isFinite(Number(session.taskAccuracy)) ? Number(session.taskAccuracy) : null,
  completion_time_ms: Number.isFinite(Number(session.completionTimeMs)) ? Number(session.completionTimeMs) : null,
  payload: session,
  updated_at: new Date().toISOString()
});

const fromSessionRow = (row) => ({
  ...(row.payload || {}),
  sessionId: row.payload?.sessionId || row.session_id,
  taskId: row.payload?.taskId || row.task_id,
  status: row.payload?.status || row.status,
  openedAt: row.payload?.openedAt || row.opened_at,
  startedAt: row.payload?.startedAt || row.started_at,
  completedAt: row.payload?.completedAt || row.completed_at,
  lastSeenAt: row.payload?.lastSeenAt || row.last_seen_at,
  totalItems: row.payload?.totalItems ?? row.total_items,
  attemptedItems: row.payload?.attemptedItems ?? row.attempted_items,
  correctItems: row.payload?.correctItems ?? row.correct_items,
  taskAccuracy: row.payload?.taskAccuracy ?? row.task_accuracy,
  completionTimeMs: row.payload?.completionTimeMs ?? row.completion_time_ms
});

const calculateMetrics = (sessions) => {
  const startedSessions = sessions.filter(session => session.startedAt || session.taskStartedAt || ["started", "completed", "abandoned"].includes(session.status));
  const completedSessions = startedSessions.filter(session => session.status === "completed");
  const attemptedItems = startedSessions.reduce((sum, session) => sum + Number(session.attemptedItems || 0), 0);
  const scoredItems = startedSessions.reduce((sum, session) => sum + Number(session.scoredItems ?? session.attemptedItems ?? 0), 0);
  const correctItems = startedSessions.reduce((sum, session) => sum + Number(session.correctItems || 0), 0);
  const completionTimes = completedSessions.map(session => Number(session.completionTimeMs)).filter(Number.isFinite);
  const dropoutSessions = startedSessions.length - completedSessions.length;
  return {
    startedSessions: startedSessions.length,
    completedSessions: completedSessions.length,
    dropoutSessions,
    dropoutRate: startedSessions.length ? dropoutSessions / startedSessions.length : null,
    correctItems,
    attemptedItems,
    scoredItems,
    taskAccuracy: scoredItems ? correctItems / scoredItems : null,
    averageCompletionTimeMs: completionTimes.length ? completionTimes.reduce((sum, value) => sum + value, 0) / completionTimes.length : null
  };
};

module.exports = async (req, res) => {
  try {
    requireSupabase();
    if (req.method === "GET") {
      const taskId = typeof req.query?.taskId === "string" ? req.query.taskId : "";
      const filter = taskId ? `&task_id=eq.${encodeURIComponent(taskId)}` : "";
      const response = await supabaseFetch(`/sessions?select=*&order=created_at.desc${filter}`, { method: "GET" });
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data.message || "Failed to load sessions.");
      const sessions = data.map(fromSessionRow);
      return json(res, 200, { sessions, metrics: calculateMetrics(sessions) });
    }

    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
    const session = req.body?.session || req.body;
    if (!session?.sessionId) return json(res, 400, { error: "sessionId is required." });
    const response = await supabaseFetch("/sessions?on_conflict=session_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(toSessionRow(session))
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Failed to save session.");
    return json(res, 200, { ok: true, session });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};

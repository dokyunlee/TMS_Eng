const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
};

module.exports = async (req, res) => {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed." });

  const provider = String(process.env.AI_PROVIDER || "").trim().toLowerCase()
    || (process.env.OPENAI_API_KEY ? "openai" : process.env.UPSTAGE_API_KEY ? "upstage" : "local-fallback");

  return json(res, 200, {
    ok: true,
    provider,
    model: provider === "openai"
      ? process.env.OPENAI_MODEL || "gpt-5.6-luna"
      : provider === "upstage" ? process.env.UPSTAGE_MODEL || "solar-pro2" : null,
    openAIConfigured: Boolean(process.env.OPENAI_API_KEY),
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  });
};

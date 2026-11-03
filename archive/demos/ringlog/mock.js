// Stands in for Ringlog's local Python server so the real app page can run on
// the web. Every call here is made up; exports are files the real exporter
// produced from that same made-up history.
(() => {
  const PATH = "/Users/demo/Library/Application Support/MobileSync/Backup/demo";
  const prefs = { last_backup: PATH, view: "list", sort: null };
  const realFetch = window.fetch.bind(window);
  const calls = realFetch("calls.json").then((r) => r.json());
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
  const files = {
    csv: ["sample.csv", "text/csv; charset=utf-8"],
    xlsx: ["sample.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    html: ["sample-report.html", "text/html; charset=utf-8"],
  };

  window.fetch = async (path, opts = {}) => {
    if (typeof path !== "string" || !path.startsWith("/api/")) return realFetch(path, opts);
    const body = opts.body ? JSON.parse(opts.body) : {};
    switch (path) {
      case "/api/prefs":
        if (body.set) Object.assign(prefs, body.set);
        return json(prefs);
      case "/api/backups":
        return json({
          backups: [{ path: PATH, id: "demo", name: "Demo iPhone", product: "iPhone 15", ios: "18.1", date: "2026-10-30T21:05:00+03:00", encrypted: false, remembered: false }],
          blocked: [], keychain: false,
        });
      case "/api/open":
        await new Promise((r) => setTimeout(r, 600));
        return json({ device: "Demo iPhone", path: PATH, id: "demo", remembered: false, calls: await calls });
      case "/api/export": {
        const [file, type] = files[body.format] || [];
        if (!file) return json({ error: "Unknown format" }, 400);
        const blob = await (await realFetch(file)).blob();
        return new Response(blob, { headers: { "Content-Type": type, "X-Filename": JSON.stringify(`Call history – Demo iPhone.${body.format}`) } });
      }
      case "/api/quit":
        return json({ ok: true });
      default:
        return json({ error: "That needs the desktop app. This web demo only reads a made-up backup." }, 400);
    }
  };
})();

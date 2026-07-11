# MetService CAP MCP Server

A lightweight edge‑compatible MCP server built with **Hono**, **TypeScript**, and **Zod** that consumes the MetService CAP Atom feed.

## Endpoints

- `GET /get_all_alerts` – Returns all active CAP alerts in JSON.
- `GET /get_active_road_warnings` – Returns road‑specific snowfall or weather warnings for **SH1 (Desert Road)**. If none are active, a clear status message is returned.

## Architecture

- **Hono** provides the ultra‑fast Edge runtime server.
- **fast-xml-parser** parses the Atom XML feed in an edge‑compatible way (no Node‑only APIs).
- **mcp‑handler** (placeholder) would expose these routes as MCP tools when deployed on Vercel.

## Deploy

```bash
# Install dependencies
yarn install
# Deploy to Vercel (requires Vercel CLI and login)
vercel deploy --prod
```

The `vercel.json` forces the function to run on the Edge runtime.

## Development

```bash
vercel dev   # Local Edge‑compatible dev server
```

---

*Built using the `vercel/examples/starter/hono-mcp` structure as a reference.*
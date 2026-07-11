# MetService CAP MCP Server

An edge-compatible Model Context Protocol (MCP) server built with **Hono**,
**mcp-handler**, **TypeScript**, and **Zod**. It fetches the public MetService
CAP Atom feed at <https://alerts.metservice.com/cap/atom>, parses it with
`fast-xml-parser`, and exposes the current alerts as MCP tools.

This project follows the structure of Vercel's
`examples/starter/hono-mcp` template and is configured for Vercel Edge
deployment.

## MCP endpoint

- `POST /mcp` - Streamable HTTP MCP endpoint.
- `GET /` - Basic server discovery response.

## Tools

### `get_active_road_warnings`

Fetches the live MetService CAP Atom feed and returns active warnings targeting
**SH1 Desert Road**. If none are active, the tool returns a `clear` status.

### `get_all_alerts`

Fetches the live MetService CAP Atom feed and returns all active alert entries
with normalized Atom/CAP fields and the raw parsed entry.

## Development

```bash
npm install
npm run typecheck
npm run dev
```

Point MCP clients at:

```text
http://localhost:3000/mcp
```

## Deploy

```bash
npm install
npm run build
vercel deploy --prod
```

`vercel.json` configures the Hono entrypoint for Vercel Edge runtime.
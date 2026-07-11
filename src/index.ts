import { Hono } from 'hono'
import { createMcpHandler } from 'mcp-handler'

import { METSERVICE_CAP_ATOM_URL } from './cap-feed.js'
import { registerMetServiceTools } from './tools.js'

export const config = {
  runtime: 'edge',
}

const app = new Hono()

const handler = createMcpHandler(
  (server) => {
    registerMetServiceTools(server)
  },
  {
    serverInfo: {
      name: 'metservice-cap-mcp',
      version: '0.1.0',
    },
  },
  {
    basePath: '/',
    disableSse: true,
    maxDuration: 60,
  },
)

app.all('/mcp', async (c) => handler(c.req.raw))
app.all('/mcp/*', async (c) => handler(c.req.raw))

app.get('/', (c) =>
  c.json({
    name: 'metservice-cap-mcp',
    description:
      'MCP server exposing active MetService CAP alerts from the public Atom feed.',
    endpoints: {
      mcp: '/mcp',
      feed: METSERVICE_CAP_ATOM_URL,
    },
    tools: ['get_active_road_warnings', 'get_all_alerts'],
  }),
)

export default app
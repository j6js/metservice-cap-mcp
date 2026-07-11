import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import {
  filterSh1DesertRoadWarnings,
  fetchActiveCapAlerts,
} from './cap-feed.js'

const emptyInputSchema = z.object({}).describe('No input parameters')

export function registerMetServiceTools(server: McpServer): void {
  server.registerTool(
    'get_active_road_warnings',
    {
      title: 'Get active SH1 Desert Road warnings',
      description:
        'Fetch the MetService CAP Atom feed and return active warnings targeting SH1 Desert Road.',
      inputSchema: emptyInputSchema,
    },
    async () => {
      try {
        const result = await fetchActiveCapAlerts()
        const alerts = filterSh1DesertRoadWarnings(result.alerts)

        return jsonToolResult({
          target: 'SH1 Desert Road',
          status: alerts.length > 0 ? 'warning' : 'clear',
          count: alerts.length,
          feedUpdated: result.feed.updated,
          fetchedAt: result.fetchedAt,
          sourceUrl: result.sourceUrl,
          alerts,
        })
      } catch (error) {
        return errorToolResult(error)
      }
    },
  )

  server.registerTool(
    'get_all_alerts',
    {
      title: 'Get all active MetService CAP alerts',
      description:
        'Fetch the MetService CAP Atom feed and return all currently active CAP alerts.',
      inputSchema: emptyInputSchema,
    },
    async () => {
      try {
        const result = await fetchActiveCapAlerts()

        return jsonToolResult({
          count: result.alerts.length,
          feed: result.feed,
          fetchedAt: result.fetchedAt,
          sourceUrl: result.sourceUrl,
          alerts: result.alerts,
        })
      } catch (error) {
        return errorToolResult(error)
      }
    },
  )
}

function jsonToolResult(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  }
}

function errorToolResult(error: unknown) {
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text:
          error instanceof Error
            ? error.message
            : 'Unexpected error while fetching MetService CAP alerts',
      },
    ],
  }
}

import { Hono } from 'hono';
import { json } from 'hono/json';
import { XMLParser } from 'fast-xml-parser';

// Edge‑compatible fetch is available globally
const parser = new XMLParser({ ignoreAttributes: false });

type AtomEntry = any; // Simplified – we just pass through raw JSON

async function fetchAlerts(): Promise<AtomEntry[]> {
  const response = await fetch('https://alerts.metservice.com/cap/atom');
  const xml = await response.text();
  const json = parser.parse(xml);
  const entries = json?.feed?.entry ?? [];
  // Ensure we always return an array
  return Array.isArray(entries) ? entries : [entries];
}

const app = new Hono();

// Return every active CAP alert in a clean JSON format
app.get('/get_all_alerts', async c => {
  const alerts = await fetchAlerts();
  return c.json({ alerts });
});

// Return road‑specific warnings for SH1 (Desert Road) or a clear status
app.get('/get_active_road_warnings', async c => {
  const alerts = await fetchAlerts();
  const roadAlerts = alerts.filter((a: any) => {
    const title = (a.title ?? '').toString().toLowerCase();
    const description = (a.summary ?? '').toString().toLowerCase();
    // Look for road‑related keywords and the specific SH1 identifier
    const isRoad = title.includes('road') || description.includes('road');
    const isSh1 = title.includes('sh1') || description.includes('sh1');
    return isRoad && isSh1;
  });

  if (roadAlerts.length === 0) {
    return c.json({ status: 'clear', message: 'No active road snowfall or weather warnings for SH1' });
  }
  return c.json({ status: 'warning', alerts: roadAlerts });
});

export default app;
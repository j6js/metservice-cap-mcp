import { XMLParser } from 'fast-xml-parser'

export const METSERVICE_CAP_ATOM_URL = 'https://alerts.metservice.com/cap/atom'

type XmlPrimitive = string | number | boolean | null | undefined
type XmlValue = XmlPrimitive | XmlObject | XmlArray

interface XmlArray extends Array<XmlValue> {}

interface XmlObject {
  [key: string]: XmlValue
}

export interface AtomLink {
  href: string
  rel?: string
  type?: string
  title?: string
}

export interface AtomCategory {
  term: string
  scheme?: string
  label?: string
}

export interface AtomAuthor {
  name?: string
  email?: string
  uri?: string
}

export interface CapAlert {
  id?: string
  title?: string
  summary?: string
  published?: string
  updated?: string
  effective?: string
  onset?: string
  expires?: string
  event?: string
  urgency?: string
  severity?: string
  certainty?: string
  areaDescription?: string
  categories: AtomCategory[]
  links: AtomLink[]
  authors: AtomAuthor[]
  raw: XmlObject
}

export interface CapFeed {
  id?: string
  title?: string
  updated?: string
  rights?: string
  links: AtomLink[]
}

export interface ActiveAlertsResult {
  feed: CapFeed
  alerts: CapAlert[]
  fetchedAt: string
  sourceUrl: string
}

const parser = new XMLParser({
  attributeNamePrefix: '',
  ignoreAttributes: false,
  parseAttributeValue: false,
  parseTagValue: false,
  removeNSPrefix: true,
  textNodeName: 'text',
  trimValues: true,
})

export async function fetchActiveCapAlerts(): Promise<ActiveAlertsResult> {
  const response = await fetch(METSERVICE_CAP_ATOM_URL, {
    headers: {
      accept: 'application/atom+xml, application/xml, text/xml;q=0.9',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(
      `MetService CAP feed request failed with ${response.status} ${response.statusText}`,
    )
  }

  const xml = await response.text()
  const parsed = parser.parse(xml) as XmlObject
  const feed = asObject(parsed.feed)

  if (!feed) {
    throw new Error('MetService CAP feed response did not contain an Atom feed')
  }

  return {
    feed: normalizeFeed(feed),
    alerts: asArray(feed.entry).flatMap((entry) => {
      const entryObject = asObject(entry)
      return entryObject ? [normalizeAlert(entryObject)] : []
    }),
    fetchedAt: new Date().toISOString(),
    sourceUrl: METSERVICE_CAP_ATOM_URL,
  }
}

export function filterSh1DesertRoadWarnings(alerts: CapAlert[]): CapAlert[] {
  return alerts.filter((alert) => {
    const searchableText = [
      alert.title,
      alert.summary,
      alert.event,
      alert.areaDescription,
      alert.raw,
    ]
      .map((value) =>
        typeof value === 'string' ? value : JSON.stringify(value),
      )
      .join(' ')
      .toLowerCase()

    const mentionsDesertRoad = searchableText.includes('desert road')
    const mentionsSh1 =
      searchableText.includes('sh1') ||
      searchableText.includes('state highway 1')

    return mentionsDesertRoad && mentionsSh1
  })
}

function normalizeFeed(feed: XmlObject): CapFeed {
  return {
    id: textValue(feed.id),
    title: textValue(feed.title),
    updated: textValue(feed.updated),
    rights: textValue(feed.rights),
    links: normalizeLinks(feed.link),
  }
}

function normalizeAlert(entry: XmlObject): CapAlert {
  return {
    id: textValue(entry.id),
    title: textValue(entry.title),
    summary: textValue(entry.summary),
    published: textValue(entry.published),
    updated: textValue(entry.updated),
    effective: textValue(entry.effective),
    onset: textValue(entry.onset),
    expires: textValue(entry.expires),
    event: textValue(entry.event),
    urgency: textValue(entry.urgency),
    severity: textValue(entry.severity),
    certainty: textValue(entry.certainty),
    areaDescription: textValue(entry.areaDesc),
    categories: normalizeCategories(entry.category),
    links: normalizeLinks(entry.link),
    authors: normalizeAuthors(entry.author),
    raw: entry,
  }
}

function normalizeLinks(value: XmlValue): AtomLink[] {
  return asArray(value).flatMap((link) => {
    if (typeof link === 'string') {
      return [{ href: link }]
    }

    const linkObject = asObject(link)
    const href = textValue(linkObject?.href)

    if (!href) {
      return []
    }

    return [
      {
        href,
        rel: textValue(linkObject?.rel),
        type: textValue(linkObject?.type),
        title: textValue(linkObject?.title),
      },
    ]
  })
}

function normalizeCategories(value: XmlValue): AtomCategory[] {
  return asArray(value).flatMap((category) => {
    if (typeof category === 'string') {
      return [{ term: category }]
    }

    const categoryObject = asObject(category)
    const term = textValue(categoryObject?.term)

    if (!term) {
      return []
    }

    return [
      {
        term,
        scheme: textValue(categoryObject?.scheme),
        label: textValue(categoryObject?.label),
      },
    ]
  })
}

function normalizeAuthors(value: XmlValue): AtomAuthor[] {
  return asArray(value).flatMap((author) => {
    const authorObject = asObject(author)

    if (!authorObject) {
      return []
    }

    return [
      {
        name: textValue(authorObject.name),
        email: textValue(authorObject.email),
        uri: textValue(authorObject.uri),
      },
    ]
  })
}

function textValue(value: XmlValue): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.map(textValue).filter(Boolean).join(' ') || undefined
  }

  return textValue(value.text)
}

function asArray(value: XmlValue): XmlValue[] {
  if (value === null || value === undefined) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function asObject(value: XmlValue): XmlObject | undefined {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return undefined
  }

  return value
}

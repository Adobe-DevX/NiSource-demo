import { toCamelCase } from './aem.js';

/*
 * -----------------------------------------------------------------------------
 * EDS / Ref-Demo–aligned helpers — placeholders & metadata
 * -----------------------------------------------------------------------------
 * Placeholders live at /placeholders.json (Key → Text). Keys are normalized to
 * camelCase (e.g. "CF Wrapper URL" → cfWrapperUrl) via toCamelCase().
 *
 * Optional keys (placeholders.json → camelCase) for ported Ref Demo flows:
 *
 * - hostname — content-fragment, DM template CF; publish host (author→publish).
 * - dmurl — dynamicmedia-image (Scene7 base URL).
 * - cfWrapperUrl — content-fragment POST gateway on publish.
 * - cfGraphqlPath — persisted GraphQL path after host (e.g. …/CTAByPath).
 * - cfGraphqlItemKey — JSON path under data.* for CF item (default ctaByPath).
 * - dmVideoViewerUrl — dynamic-media-video script URL.
 * - dmTemplateWrapperUrl / dmTemplateGraphqlPath — dynamicmedia-template CF mode.
 *
 * Meta overrides (getMetadata, kebab-case): cf-wrapper-url, cf-graphql-path,
 * authorurl, dm-video-viewer-url, dm-template-wrapper-url, dm-template-graphql-path,
 * experiment-prod-host.
 *
 * CF CTA path mapping: /paths.json (getPathMappings). See docs/ref-demo-eds.md.
 * -----------------------------------------------------------------------------
 */

/**
 * True when running against an AEM author origin (Universal Editor / preview).
 */
export function isAuthorEnvironment() {
  return Boolean(window?.location?.origin?.includes('author'));
}

let cachedPathMappings;

/**
 * Load and cache path mappings from paths.json.
 */
export async function getPathMappings() {
  if (cachedPathMappings) return cachedPathMappings;
  try {
    const resp = await fetch('/paths.json', { headers: { Accept: 'application/json' } });
    if (!resp.ok) return { mappings: [], includes: [] };
    const json = await resp.json();
    cachedPathMappings = {
      mappings: Array.isArray(json.mappings) ? json.mappings.slice() : [],
      includes: Array.isArray(json.includes) ? json.includes.slice() : [],
    };
    return cachedPathMappings;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load /paths.json', e);
    return { mappings: [], includes: [] };
  }
}

/**
 * Map an AEM repository path to a site path using paths.json (longest prefix wins).
 * @param {string} aemPath
 * @returns {Promise<string>}
 */
export async function mapAemPathToSitePath(aemPath) {
  try {
    if (!aemPath || typeof aemPath !== 'string') return aemPath || '/';
    const url = new URL(aemPath, window.location.origin);
    let pathname = url.pathname || aemPath;
    pathname = pathname.replace(/\.html$/i, '');
    const { mappings } = await getPathMappings();
    if (!mappings || !mappings.length) return pathname;
    let best = null;
    mappings.forEach((entry) => {
      if (typeof entry !== 'string' || !entry.includes(':')) return;
      const [srcRaw, destRaw] = entry.split(':');
      const src = srcRaw.trim();
      const dest = (destRaw || '').trim();
      if (src && pathname.startsWith(src)) {
        if (!best || src.length > best.src.length) {
          best = { src, dest };
        }
      }
    });
    if (!best) return pathname;
    const suffix = pathname.substring(best.src.length);
    const join = (a, b) => {
      if (!a) return b || '/';
      if (!b) return a || '/';
      const left = a.endsWith('/') ? a.slice(0, -1) : a;
      const right = b.startsWith('/') ? b.slice(1) : b;
      return `/${[left, right].filter(Boolean).join('/')}`.replace(/\/{2,}/g, '/');
    };
    let mapped = join(best.dest, suffix);
    if (!mapped.startsWith('/')) mapped = `/${mapped}`;
    mapped = mapped.replace(/\/{2,}/g, '/');
    return mapped;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to map AEM path to site path', e);
    return aemPath;
  }
}

const placeholderPromises = {};

/**
 * @param {string} [prefix]
 * @returns {Promise<Record<string, string>>}
 */
export async function fetchPlaceholders(prefix = 'default') {
  const cacheKey = prefix === 'default' ? 'default' : prefix;
  if (!placeholderPromises[cacheKey]) {
    placeholderPromises[cacheKey] = (async () => {
      try {
        const path = prefix === 'default'
          ? '/placeholders.json'
          : `/${String(prefix).replace(/^\//, '')}/placeholders.json`;
        const resp = await fetch(path);
        if (!resp.ok) return {};
        const json = await resp.json();
        const placeholders = {};
        json.data
          ?.filter((row) => row.Key)
          .forEach((row) => {
            placeholders[toCamelCase(row.Key)] = row.Text;
          });
        return placeholders;
      } catch {
        return {};
      }
    })();
  }
  return placeholderPromises[cacheKey];
}

/**
 * @returns {Promise<string|undefined>}
 */
export async function getHostname() {
  try {
    const ph = await fetchPlaceholders();
    return ph?.hostname;
  } catch {
    return undefined;
  }
}

/**
 * Dynamic Media / Scene7 base URL from placeholders (Key: dmurl).
 * @returns {Promise<string|undefined>}
 */
export async function getDynamicMediaServerURL() {
  try {
    const ph = await fetchPlaceholders();
    let dmurl = ph?.dmurl;
    if (!dmurl) return undefined;
    if (!dmurl.startsWith('http://') && !dmurl.startsWith('https://')) {
      dmurl = `https://${dmurl}`;
    }
    if (!dmurl.endsWith('/')) {
      dmurl = `${dmurl}/`;
    }
    return dmurl;
  } catch {
    return undefined;
  }
}

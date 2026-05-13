/*
 * Fragment Block
 * - Default: EDS page fragment (.plain.html). https://www.aem.live/developer/block-collection/fragment
 * - DAM CF: persisted GraphQL REST (SampleFragmentByPath) → compact news card.
 *   Path / variation from picker link, optional row 2 / config, or ?variation= on the link.
 */

import { getRootPath } from '@dropins/tools/lib/aem/configs.js';
import { getMetadata, loadSections, readBlockConfig } from '../../scripts/aem.js';
import { fetchPlaceholders, isAuthorEnvironment } from '../../scripts/eds-support.js';
import { decorateMain } from '../../scripts/scripts.js';

const CF_AUTHOR_ORIGIN_DEFAULT = 'https://author-p199216-e2062199.adobeaemcloud.com';
const CF_GRAPHQL_PATH_DEFAULT = '/graphql/execute.json/nisource-demo/SampleFragmentByPath';
const CF_ITEM_KEY_DEFAULT = 'sampleFragmentByPath';
const CF_JSON_HEADERS = { 'Content-Type': 'application/json' };

/** Mirrors `getHostname()` without a second `fetchPlaceholders` round-trip. */
function hostnameFromPlaceholders(ph) {
  const raw = ph?.hostname != null ? String(ph.hostname).trim() : '';
  if (raw) return raw.replace(/\/$/, '');
  return CF_AUTHOR_ORIGIN_DEFAULT.replace(/\/$/, '');
}

function normalizeVariation(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * @param {string} raw
 * @returns {{ path: string, variation: string }}
 */
function parseCfPathAndVariation(raw) {
  let path = '';
  let variation = 'master';
  if (!raw || typeof raw !== 'string') return { path, variation };
  const t = raw.trim();
  try {
    const u = new URL(t, window.location.href);
    path = u.pathname.replace(/\.html$/i, '');
    const v = u.searchParams.get('variation');
    if (v) variation = normalizeVariation(v);
  } catch {
    path = t.split('?')[0].split('#')[0].replace(/\.html$/i, '');
    if (path && !path.startsWith('/')) path = `/${path}`;
  }
  return { path, variation };
}

function isDamCfGraphqlPath(path) {
  if (!path || typeof path !== 'string') return false;
  return path.includes('/content/dam/')
    && (/\/fragments\//i.test(path) || /content-fragments/i.test(path));
}

/**
 * @param {Element} block
 * @returns {{ path: string, variation: string }}
 */
function readFragmentCfInput(block) {
  const cfg = readBlockConfig(block);
  const link = block.querySelector(':scope > div:nth-child(1) a')
    || block.querySelector('a[href*="content/dam"]')
    || block.querySelector('a');
  const hrefAttr = link?.getAttribute('href')?.trim() || '';
  const hrefResolved = link?.href?.trim() || '';
  const rawForParse = hrefAttr
    || hrefResolved
    || cfg.reference
    || cfg['content-fragment']
    || cfg['content-fragment-picker']
    || block.textContent.trim();

  const parsed = parseCfPathAndVariation(rawForParse);

  const row2El = block.querySelector(':scope > div:nth-child(2) > div p')
    || block.querySelector(':scope > div:nth-child(2) > div');
  const fromRow2 = row2El?.textContent?.trim() ?? '';
  const fromCfg = (
    (cfg['selected-variation'] && String(cfg['selected-variation']).trim())
    || (cfg.contentfragmentvariation && String(cfg.contentfragmentvariation).trim())
    || ''
  );
  const authorVariation = fromRow2 || fromCfg;

  let { path, variation } = parsed;
  if (authorVariation) variation = normalizeVariation(authorVariation);
  if (!path && rawForParse) {
    try {
      path = new URL(rawForParse, window.location.href).pathname.replace(/\.html$/i, '');
    } catch {
      /* keep path */
    }
  }
  return { path, variation };
}

/** @param {unknown} para */
function paragraphPlaintext(para) {
  if (typeof para === 'string') return para;
  if (para && typeof para === 'object' && 'plaintext' in para) {
    return String(/** @type {{ plaintext?: string }} */ (para).plaintext ?? '');
  }
  return '';
}

/** @param {Record<string, string>} ph */
function resolveCfPersistedQueryConfig(ph) {
  const t = (v) => (v != null ? String(v).trim() : '');
  const first = (...candidates) => t(candidates.find((c) => t(c)) ?? '');

  return {
    graphqlPath: first(ph.cfGraphqlPath, getMetadata('cf-graphql-path'), CF_GRAPHQL_PATH_DEFAULT),
    itemKey: first(ph.cfGraphqlItemKey, getMetadata('cf-graphql-item-key'), CF_ITEM_KEY_DEFAULT),
    wrapperUrl: first(ph.cfWrapperUrl, getMetadata('cf-wrapper-url')),
    aemAuthorUrl: first(getMetadata('authorurl'), CF_AUTHOR_ORIGIN_DEFAULT).replace(/\/$/, ''),
    publishUrlFromMeta: first(
      ph.publishUrl,
      getMetadata('publishurl'),
      getMetadata('publish-url'),
    ).replace(/\/$/, ''),
  };
}

function persistedQueryParamValue(value) {
  return String(value).replace(/;/g, '%3B');
}

function persistedQueryExecutePath(graphqlPath, cfPath, variation) {
  const base = graphqlPath.startsWith('/') ? graphqlPath : `/${graphqlPath}`;
  return `${base};path=${persistedQueryParamValue(cfPath)};variation=${persistedQueryParamValue(variation)}`;
}

/**
 * @returns {{ url: string, method: string, headers: Record<string, string>, body?: string,
 *   credentials?: RequestCredentials } | null}
 */
function buildCfPersistedQueryRequest(p) {
  const executePath = persistedQueryExecutePath(p.graphqlPath, p.cfPath, p.variation);
  const cacheBust = `?ts=${Date.now()}`;
  const getReq = (origin) => ({
    url: `${origin}${executePath}${cacheBust}`,
    method: 'GET',
    headers: CF_JSON_HEADERS,
    credentials: /** @type {RequestCredentials} */ ('include'),
  });

  if (p.isAuthor) return getReq(p.aemAuthorUrl);
  if (p.usePublishWrapper) {
    const basePath = p.graphqlPath.startsWith('/') ? p.graphqlPath : `/${p.graphqlPath}`;
    return {
      url: p.wrapperUrl,
      method: 'POST',
      headers: CF_JSON_HEADERS,
      body: JSON.stringify({
        graphQLPath: `${p.aemPublishUrl}${basePath}`,
        cfPath: p.cfPath,
        variation: p.variation,
      }),
    };
  }
  if (p.publishGetOrigin) return getReq(p.publishGetOrigin);
  return null;
}

/**
 * @param {Record<string, unknown>} item
 * @param {string} cfPath
 */
function buildCfNewsCardElement(item, cfPath) {
  const headline = item.headline != null ? String(item.headline) : '';
  const bodyPlain = paragraphPlaintext(item.paragraph);

  const article = document.createElement('article');
  article.className = 'fragment-cf-news';
  article.dataset.cfPath = cfPath;

  const h3 = document.createElement('h3');
  h3.className = 'fragment-cf-news__headline';
  h3.textContent = headline;

  const body = document.createElement('div');
  body.className = 'fragment-cf-news__body';
  const p = document.createElement('p');
  p.className = 'fragment-cf-news__lede';
  p.textContent = bodyPlain;
  body.append(p);

  article.append(h3, body);
  return article;
}

/** @param {Element} root */
function stripCfBlockInstrumentation(root) {
  const stripAttrs = (el) => {
    [...el.attributes].forEach(({ name }) => {
      if (name.startsWith('data-aue-') || name.startsWith('data-richtext-')) {
        el.removeAttribute(name);
      }
    });
  };
  stripAttrs(root);
  root.querySelectorAll('*').forEach(stripAttrs);
}

/**
 * @param {string} cfPath
 * @param {string} variation
 * @returns {Promise<HTMLElement | null>}
 */
async function loadCfNewsCard(cfPath, variation) {
  const ph = await fetchPlaceholders();
  const {
    graphqlPath,
    itemKey,
    wrapperUrl,
    aemAuthorUrl,
    publishUrlFromMeta,
  } = resolveCfPersistedQueryConfig(ph);

  const hostnameResolved = hostnameFromPlaceholders(ph);
  const aemPublishUrl = hostnameResolved.replace('author', 'publish').replace(/\/$/, '');
  const isAemAuthorCloudHostname = hostnameResolved.includes('author-')
    && hostnameResolved.includes('adobeaemcloud.com');
  const usePublishWrapper = Boolean(wrapperUrl && aemPublishUrl);
  let publishGetOrigin = '';
  if (!usePublishWrapper) {
    publishGetOrigin = publishUrlFromMeta || (isAemAuthorCloudHostname ? aemPublishUrl : '');
  }

  const isAuthor = isAuthorEnvironment();
  if (!isAuthor && !usePublishWrapper && !publishGetOrigin) {
    // eslint-disable-next-line no-console
    console.warn(
      'fragment (CF): on publish set meta/placeholder publishurl (or placeholders hostname '
      + 'to an AEM Cloud author URL so publish can be derived), or cfWrapperUrl + hostname '
      + 'for the POST wrapper.',
    );
    return null;
  }

  const req = buildCfPersistedQueryRequest({
    isAuthor,
    usePublishWrapper,
    publishGetOrigin,
    aemAuthorUrl,
    aemPublishUrl,
    wrapperUrl,
    graphqlPath,
    cfPath,
    variation,
  });
  if (!req) return null;

  const response = await fetch(req.url, {
    method: req.method,
    headers: req.headers,
    ...(req.body && { body: req.body }),
    ...(req.credentials && { credentials: req.credentials }),
  });
  if (!response.ok) return null;

  let json;
  try {
    json = await response.json();
  } catch {
    return null;
  }

  const item = json?.data?.[itemKey]?.item;
  if (!item) return null;
  return buildCfNewsCardElement(item, cfPath);
}

/**
 * @param {string} path
 * @returns {Promise<HTMLElement | null>}
 */
export async function loadFragment(path) {
  if (!path || !path.startsWith('/')) return null;

  const root = getRootPath().replace(/\/$/, '');
  const normalized = path.replace(/(\.plain)?\.html/, '');
  const resp = await fetch(`${root}${normalized}.plain.html`);
  if (!resp.ok) return null;

  const main = document.createElement('main');
  main.innerHTML = await resp.text();

  const base = new URL(normalized, window.location);
  const fixMedia = (tag, attr) => {
    main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((el) => {
      el[attr] = new URL(el.getAttribute(attr), base).href;
    });
  };
  fixMedia('img', 'src');
  fixMedia('source', 'srcset');

  decorateMain(main);
  await loadSections(main);
  return main;
}

export default async function decorate(block) {
  const { path: cfPath, variation } = readFragmentCfInput(block);

  if (isDamCfGraphqlPath(cfPath)) {
    try {
      const card = await loadCfNewsCard(cfPath, variation);
      if (card) {
        block.classList.add('fragment', 'fragment--cf');
        block.replaceChildren(card);
        if (!isAuthorEnvironment()) stripCfBlockInstrumentation(block);
        return;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('fragment (CF): failed to load content fragment', e);
    }
    block.replaceChildren();
    return;
  }

  const fragment = await loadFragment(cfPath);
  if (!fragment) return;

  const fragmentSection = fragment.querySelector(':scope .section');
  if (fragmentSection) {
    block.classList.add(...fragmentSection.classList);
    block.classList.remove('section');
    block.replaceChildren(...fragmentSection.childNodes);
  }
}

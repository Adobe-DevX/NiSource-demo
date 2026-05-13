/*
 * Fragment Block
 * - Default: include EDS page fragment (.plain.html).
 *   https://www.aem.live/developer/block-collection/fragment
 * - DAM CF path: REST GET to persisted GraphQL execute.json (SampleFragmentByPath), e.g.
 *   {author}/graphql/execute.json/nisource-demo/SampleFragmentByPath;
 *   path=/content/dam/...;variation=master
 *   → compact news card.
 * - Path and variation come from the authored block (content fragment picker + persisted
 *   variation); `?variation=` on the link is used when the variation row is empty.
 */

import { getRootPath } from '@dropins/tools/lib/aem/configs.js';
import { getMetadata, loadSections, readBlockConfig } from '../../scripts/aem.js';
import {
  fetchPlaceholders,
  getHostname,
  isAuthorEnvironment,
} from '../../scripts/eds-support.js';
import { decorateMain } from '../../scripts/scripts.js';

/** AEM author origin default for persisted-query GET when `authorurl` meta is absent. */
const CF_AUTHOR_ORIGIN_DEFAULT = 'https://author-p199216-e2062199.adobeaemcloud.com';
const CF_GRAPHQL_PATH_DEFAULT = '/graphql/execute.json/nisource-demo/SampleFragmentByPath';
const CF_ITEM_KEY_DEFAULT = 'sampleFragmentByPath';

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
    if (v) variation = v.trim().toLowerCase().replace(/\s+/g, '_');
  } catch {
    path = t.split('?')[0].split('#')[0].replace(/\.html$/i, '');
    if (path && !path.startsWith('/')) path = `/${path}`;
  }
  return { path, variation };
}

/**
 * DAM paths that should use persisted-query CF JSON instead of .plain.html.
 * @param {string} path
 */
function isDamCfGraphqlPath(path) {
  if (!path || typeof path !== 'string') return false;
  return path.includes('/content/dam/')
    && (/\/fragments\//i.test(path) || /content-fragments/i.test(path));
}

/**
 * Repository path + variation from Universal Editor output (picker link + optional row 2).
 * Author-selected variation overrides `?variation=` on the link when row 2 / config has text.
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
  const row2Text = row2El?.textContent?.trim() ?? '';
  const fromCfg = (
    (cfg['selected-variation'] && String(cfg['selected-variation']).trim())
    || (cfg.contentfragmentvariation && String(cfg.contentfragmentvariation).trim())
    || ''
  );

  const authorVariation = row2Text || fromCfg;
  let { variation } = parsed;
  if (authorVariation) {
    variation = authorVariation.toLowerCase().replace(/\s+/g, '_');
  }

  let { path } = parsed;
  if (!path && rawForParse) {
    try {
      path = new URL(rawForParse, window.location.href).pathname.replace(/\.html$/i, '');
    } catch {
      /* keep parsed.path */
    }
  }

  return { path, variation };
}

/**
 * @param {unknown} para
 * @returns {string}
 */
function paragraphPlaintext(para) {
  if (typeof para === 'string') return para;
  if (para && typeof para === 'object' && 'plaintext' in para) {
    return String(/** @type {{ plaintext?: string }} */ (para).plaintext ?? '');
  }
  return '';
}

/**
 * @param {Record<string, string>} ph
 */
function resolveCfPersistedQueryConfig(ph) {
  const graphqlPath = (
    ph.cfGraphqlPath
    || getMetadata('cf-graphql-path')
    || CF_GRAPHQL_PATH_DEFAULT
  ).trim();
  const itemKey = (
    ph.cfGraphqlItemKey
    || getMetadata('cf-graphql-item-key')
    || CF_ITEM_KEY_DEFAULT
  ).trim();
  const wrapperUrl = (ph.cfWrapperUrl || getMetadata('cf-wrapper-url') || '').trim();
  const aemAuthorUrl = (
    getMetadata('authorurl')
    || CF_AUTHOR_ORIGIN_DEFAULT
  ).replace(/\/$/, '');
  /** Direct publish origin for persisted-query GET (citisignal-style `publishurl` meta). */
  const aemPublishUrlDirect = (
    ph.publishUrl
    || getMetadata('publishurl')
    || getMetadata('publish-url')
    || ''
  ).trim().replace(/\/$/, '');
  return {
    graphqlPath,
    itemKey,
    wrapperUrl,
    aemAuthorUrl,
    aemPublishUrlDirect,
  };
}

/**
 * Persisted-query REST shape (semicolon parameters after the query name). Slashes stay
 * unencoded like AEM samples; only `;` in values is escaped so delimiters stay intact.
 * @param {string} value
 */
function persistedQueryParamValue(value) {
  return String(value).replace(/;/g, '%3B');
}

/**
 * Path + query name segment only (no host), e.g.
 * `/graphql/execute.json/nisource-demo/SampleFragmentByPath`.
 * @param {string} graphqlPath
 */
function persistedQueryBasePath(graphqlPath) {
  return graphqlPath.startsWith('/') ? graphqlPath : `/${graphqlPath}`;
}

/**
 * @param {object} p
 * @param {boolean} p.isAuthor
 * @param {boolean} p.usePublishWrapper
 * @param {string} p.publishGetOrigin publish tier origin for direct persisted-query GET
 * @param {string} p.aemAuthorUrl
 * @param {string} p.aemPublishUrl publish origin for wrapper POST body (`graphQLPath` prefix)
 * @param {string} p.wrapperUrl
 * @param {string} p.graphqlPath
 * @param {string} p.cfPath
 * @param {string} p.variation
 */
function buildCfPersistedQueryRequest(p) {
  const basePath = persistedQueryBasePath(p.graphqlPath);
  const pathPart = `;path=${persistedQueryParamValue(p.cfPath)};variation=${persistedQueryParamValue(p.variation)}`;
  const executePath = `${basePath}${pathPart}`;
  /** Query-string cache buster (not a persisted-query variable). */
  const cacheBust = `?ts=${Date.now()}`;

  if (p.isAuthor) {
    return {
      url: `${p.aemAuthorUrl}${executePath}${cacheBust}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: /** @type {RequestCredentials} */ ('include'),
    };
  }
  if (p.usePublishWrapper) {
    return {
      url: p.wrapperUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graphQLPath: `${p.aemPublishUrl || ''}${basePath}`,
        cfPath: p.cfPath,
        variation: p.variation,
      }),
    };
  }
  if (p.publishGetOrigin) {
    return {
      url: `${p.publishGetOrigin}${executePath}${cacheBust}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: /** @type {RequestCredentials} */ ('include'),
    };
  }
  throw new Error('fragment (CF): no persisted-query transport (loadCfNewsCard guard failed)');
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
    aemPublishUrlDirect: publishUrlFromMeta,
  } = resolveCfPersistedQueryConfig(ph);

  const hostnameResolved = (
    (await getHostname())
    || getMetadata('hostname')
    || ''
  ).trim().replace(/\/$/, '');
  const aemPublishUrl = hostnameResolved.replace('author', 'publish').replace(/\/$/, '');
  /** Default NiSource AEM Cloud author host → same-program publish tier for persisted GET. */
  const isAemAuthorCloudHostname = hostnameResolved.includes('author-')
    && hostnameResolved.includes('adobeaemcloud.com');
  const usePublishWrapper = Boolean(wrapperUrl && aemPublishUrl);
  const publishGetOrigin = (() => {
    if (usePublishWrapper) return '';
    const fromMeta = publishUrlFromMeta.trim().replace(/\/$/, '');
    if (fromMeta) return fromMeta;
    if (isAemAuthorCloudHostname && aemPublishUrl) return aemPublishUrl;
    return '';
  })();

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

  const headline = item.headline != null ? String(item.headline) : '';
  const bodyPlain = paragraphPlaintext(item.paragraph);
  const cfLabelPath = item._path != null ? String(item._path) : cfPath;
  const cfVariation = item._variation != null ? String(item._variation) : variation;

  const article = document.createElement('article');
  article.className = 'fragment-cf-news';
  article.dataset.cfPath = cfPath;

  const meta = document.createElement('header');
  meta.className = 'fragment-cf-news__meta';

  const badge = document.createElement('span');
  badge.className = 'fragment-cf-news__badge';
  badge.textContent = 'News';

  const metaAside = document.createElement('span');
  metaAside.className = 'fragment-cf-news__meta-aside';
  metaAside.textContent = cfVariation;

  meta.append(badge, metaAside);

  const h3 = document.createElement('h3');
  h3.className = 'fragment-cf-news__headline';
  h3.textContent = headline;

  const body = document.createElement('div');
  body.className = 'fragment-cf-news__body';
  const p = document.createElement('p');
  p.className = 'fragment-cf-news__lede';
  p.textContent = bodyPlain;
  body.append(p);

  /** Use `div`, not `footer`, so page `querySelector('footer')` stays unambiguous. */
  const foot = document.createElement('div');
  foot.className = 'fragment-cf-news__footer';
  const cite = document.createElement('cite');
  cite.className = 'fragment-cf-news__cite';
  cite.textContent = cfLabelPath;
  foot.append(cite);

  article.append(meta, h3, body, foot);
  return article;
}

/**
 * Remove Universal Editor instrumentation from the block tree on publish.
 * @param {Element} root
 */
function stripCfBlockInstrumentation(root) {
  const strip = (el) => {
    [...el.attributes].forEach(({ name }) => {
      if (name.startsWith('data-aue-') || name.startsWith('data-richtext-')) {
        el.removeAttribute(name);
      }
    });
  };
  strip(root);
  root.querySelectorAll('*').forEach(strip);
}

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {Promise<HTMLElement>} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    const root = getRootPath().replace(/\/$/, '');
    // eslint-disable-next-line no-param-reassign
    path = path.replace(/(\.plain)?\.html/, '');
    const resp = await fetch(`${root}${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

      // reset base path for media to fragment base
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          elem[attr] = new URL(elem.getAttribute(attr), new URL(path, window.location)).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      decorateMain(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const { path: cfPath, variation } = readFragmentCfInput(block);

  if (isDamCfGraphqlPath(cfPath)) {
    try {
      const card = await loadCfNewsCard(cfPath, variation);
      if (card) {
        block.textContent = '';
        block.classList.add('fragment', 'fragment--cf');
        block.append(card);
        if (!isAuthorEnvironment()) {
          stripCfBlockInstrumentation(block);
        }
        return;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('fragment (CF): failed to load content fragment', e);
    }
    block.innerHTML = '';
    return;
  }

  const fragment = await loadFragment(cfPath);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      block.classList.add(...fragmentSection.classList);
      block.classList.remove('section');
      block.replaceChildren(...fragmentSection.childNodes);
    }
  }
}

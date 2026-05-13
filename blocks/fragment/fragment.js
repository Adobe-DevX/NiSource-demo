/*
 * Fragment Block
 * - Default: include EDS page fragment (.plain.html).
 *   https://www.aem.live/developer/block-collection/fragment
 * - DAM CF path: AEM persisted GraphQL (SampleFragmentByPath) → compact news card.
 */

import { getRootPath } from '@dropins/tools/lib/aem/configs.js';
import { getMetadata, loadSections } from '../../scripts/aem.js';
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
  return {
    graphqlPath,
    itemKey,
    wrapperUrl,
    aemAuthorUrl,
  };
}

/**
 * @param {object} p
 */
function buildCfPersistedQueryRequest(p) {
  const suffix = p.graphqlPath.startsWith('/') ? p.graphqlPath : `/${p.graphqlPath}`;
  if (p.isAuthor) {
    return {
      url: `${p.aemAuthorUrl}${suffix};path=${encodeURIComponent(p.cfPath)};variation=${encodeURIComponent(p.variation)};ts=${Date.now()}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
  }
  return {
    url: p.wrapperUrl,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      graphQLPath: `${p.aemPublishUrl || ''}${suffix}`,
      cfPath: p.cfPath,
      variation: `${p.variation};ts=${Date.now()}`,
    }),
  };
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
  } = resolveCfPersistedQueryConfig(ph);

  const hostname = (await getHostname()) || getMetadata('hostname');
  const aemPublishUrl = hostname?.replace('author', 'publish')?.replace(/\/$/, '');
  const isAuthor = isAuthorEnvironment();

  if (!isAuthor && (!wrapperUrl || !aemPublishUrl)) {
    // eslint-disable-next-line no-console
    console.warn(
      'fragment (CF): publish needs CF Wrapper URL + hostname placeholders or meta.',
    );
    return null;
  }

  const req = buildCfPersistedQueryRequest({
    isAuthor,
    aemAuthorUrl,
    aemPublishUrl,
    graphqlPath,
    cfPath,
    variation,
  });

  const response = await fetch(req.url, {
    method: req.method,
    headers: req.headers,
    ...(req.body && { body: req.body }),
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

  const foot = document.createElement('footer');
  foot.className = 'fragment-cf-news__footer';
  const cite = document.createElement('cite');
  cite.className = 'fragment-cf-news__cite';
  cite.textContent = cfLabelPath;
  foot.append(cite);

  article.append(meta, h3, body, foot);
  return article;
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
  const link = block.querySelector('a');
  const rawRef = link ? link.getAttribute('href') : block.textContent.trim();
  const { path: cfPath, variation } = parseCfPathAndVariation(rawRef || '');

  if (isDamCfGraphqlPath(cfPath)) {
    try {
      const card = await loadCfNewsCard(cfPath, variation);
      if (card) {
        block.textContent = '';
        block.classList.add('fragment', 'fragment--cf');
        block.append(card);
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

import { getMetadata } from '../../scripts/aem.js';
import {
  fetchPlaceholders,
  getHostname,
  isAuthorEnvironment,
  mapAemPathToSitePath,
} from '../../scripts/eds-support.js';
import {
  CF_DEFAULT_AUTHOR_ORIGIN,
  CF_DEFAULT_GRAPHQL_ITEM_KEY,
  CF_DEFAULT_GRAPHQL_PATH,
} from './cf-config.js';
import { normalizeCfBannerItem } from './cf-normalize.js';

/**
 * GraphQL execute JSON: `data[itemKey].item` (e.g. `sampleFragmentByPath`).
 * @param {object} offer
 * @param {string} itemKey
 */
function getPersistedQueryItem(offer, itemKey) {
  return offer?.data?.[itemKey]?.item;
}

/**
 * @param {string} href
 * @returns {string}
 */
function safeHref(href) {
  if (!href || typeof href !== 'string') return '#';
  const t = href.trim();
  if (/^javascript:/i.test(t)) return '#';
  return t;
}

/**
 * Merge placeholders + metadata over NiSource persisted-query defaults.
 * @param {Record<string, string>} ph
 */
function resolvePersistedQueryConfig(ph) {
  const graphqlPath = (
    ph.cfGraphqlPath
    || getMetadata('cf-graphql-path')
    || CF_DEFAULT_GRAPHQL_PATH
  ).trim();

  const itemKey = (
    ph.cfGraphqlItemKey
    || getMetadata('cf-graphql-item-key')
    || CF_DEFAULT_GRAPHQL_ITEM_KEY
  ).trim();

  const wrapperUrl = (ph.cfWrapperUrl || getMetadata('cf-wrapper-url') || '').trim();

  const aemAuthorUrl = (
    getMetadata('authorurl')
    || CF_DEFAULT_AUTHOR_ORIGIN
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
 * @param {boolean} p.isAuthor
 * @param {string} p.aemAuthorUrl
 * @param {string} p.aemPublishUrl
 * @param {string} p.graphqlPath
 * @param {string} p.contentPath
 * @param {string} p.variationname
 * @param {string} p.wrapperUrl
 */
function buildPersistedQueryFetchConfig(p) {
  const suffix = p.graphqlPath.startsWith('/') ? p.graphqlPath : `/${p.graphqlPath}`;
  if (p.isAuthor) {
    return {
      url: `${p.aemAuthorUrl}${suffix};path=${encodeURIComponent(p.contentPath)};variation=${encodeURIComponent(p.variationname)};ts=${Date.now()}`,
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
      cfPath: p.contentPath,
      variation: `${p.variationname};ts=${Date.now()}`,
    }),
  };
}

/**
 * @param {object} p
 * @param {ReturnType<typeof normalizeCfBannerItem>} p.view
 * @param {string} p.displayStyle
 * @param {boolean} p.isAuthor
 * @param {string} p.aemAuthorUrl
 * @param {string} p.aemPublishUrl
 */
function computeBannerPresentation(p) {
  const {
    view,
    displayStyle,
    isAuthor,
    aemAuthorUrl,
    aemPublishUrl,
  } = p;

  const imgUrl = isAuthor ? view.bannerimage?._authorUrl : view.bannerimage?._publishUrl;
  const isImageLeft = displayStyle === 'image-left';
  const isImageRight = displayStyle === 'image-right';
  const isImageTop = displayStyle === 'image-top';
  const isImageBottom = displayStyle === 'image-bottom';

  let bannerContentStyle = '';
  let bannerDetailStyle = '';
  if (isImageLeft || isImageRight || isImageTop || isImageBottom) {
    bannerContentStyle = imgUrl ? `background-image: url(${imgUrl});` : '';
  } else {
    bannerDetailStyle = imgUrl
      ? `background-image: linear-gradient(90deg,rgba(0,0,0,0.6), rgba(0,0,0,0.1) 80%) ,url(${imgUrl});`
      : '';
  }

  let ctaHref = '#';
  const { cta } = view;
  if (cta) {
    if (typeof cta === 'string') {
      ctaHref = /^https?:\/\//i.test(cta) ? cta : `${isAuthor ? (aemAuthorUrl || '') : (aemPublishUrl || '')}${cta}`;
    } else if (typeof cta === 'object') {
      const authorUrl = cta._authorUrl;
      const publishUrl = cta._publishUrl || cta._url;
      const pathOnly = cta._path;
      if (isAuthor) {
        ctaHref = authorUrl || (pathOnly ? `${aemAuthorUrl || ''}${pathOnly}` : '#');
      } else {
        ctaHref = publishUrl || pathOnly || '#';
      }
    }
  }
  ctaHref = safeHref(ctaHref);

  return { bannerContentStyle, bannerDetailStyle, ctaHref };
}

/**
 * Content Fragment: CF data via AEM persisted GraphQL (`SampleFragmentByPath` by default).
 * Rows: (1) fragment path, (2) variation, (3) display style, (4) alignment, (5) CTA style.
 * @param {Element} block
 */
export default async function decorate(block) {
  const ph = await fetchPlaceholders();
  const {
    graphqlPath,
    itemKey,
    wrapperUrl,
    aemAuthorUrl,
  } = resolvePersistedQueryConfig(ph);

  const hostnameFromPlaceholders = await getHostname();
  const hostname = hostnameFromPlaceholders || getMetadata('hostname');
  const aemPublishUrl = hostname?.replace('author', 'publish')?.replace(/\/$/, '');

  const contentPath = block.querySelector(':scope div:nth-child(1) > div a')?.textContent?.trim();
  const variationname = block.querySelector(':scope div:nth-child(2) > div')?.textContent?.trim()?.toLowerCase()?.replace(/\s+/g, '_') || 'master';
  const displayStyle = block.querySelector(':scope div:nth-child(3) > div')?.textContent?.trim() || '';
  const alignment = block.querySelector(':scope div:nth-child(4) > div')?.textContent?.trim() || '';
  const ctaStyle = block.querySelector(':scope div:nth-child(5) > div')?.textContent?.trim() || 'button';

  if (!contentPath) {
    block.innerHTML = '';
    return;
  }

  block.textContent = '';
  const isAuthor = isAuthorEnvironment();

  const requestConfig = buildPersistedQueryFetchConfig({
    isAuthor,
    aemAuthorUrl,
    aemPublishUrl,
    graphqlPath,
    contentPath,
    variationname,
    wrapperUrl,
  });

  if (!isAuthor && (!wrapperUrl || !aemPublishUrl)) {
    // eslint-disable-next-line no-console
    console.warn(
      'content-fragment: publish needs CF Wrapper URL (placeholders / cf-wrapper-url meta) '
      + 'and hostname (placeholders / hostname meta).',
    );
    block.innerHTML = '';
    return;
  }

  try {
    const response = await fetch(requestConfig.url, {
      method: requestConfig.method,
      headers: requestConfig.headers,
      ...(requestConfig.body && { body: requestConfig.body }),
    });

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`content-fragment: persisted query failed HTTP ${response.status}`);
      block.innerHTML = '';
      return;
    }

    let offer;
    try {
      offer = await response.json();
    } catch (parseError) {
      // eslint-disable-next-line no-console
      console.error('content-fragment: invalid JSON', parseError);
      block.innerHTML = '';
      return;
    }

    const cfItem = getPersistedQueryItem(offer, itemKey);
    if (!cfItem) {
      // eslint-disable-next-line no-console
      console.error('content-fragment: no `item` for persisted query', { itemKey, offer });
      block.innerHTML = '';
      return;
    }

    const view = normalizeCfBannerItem(cfItem);
    const titleProp = view.variant === 'sample' ? 'headline' : 'title';
    const descProp = view.variant === 'sample' ? 'paragraph' : 'description';
    const itemId = `urn:aemconnection:${contentPath}/jcr:content/data/${variationname}`;

    block.setAttribute('data-aue-type', 'container');

    const { bannerContentStyle, bannerDetailStyle, ctaHref } = computeBannerPresentation({
      view,
      displayStyle,
      isAuthor,
      aemAuthorUrl,
      aemPublishUrl,
    });

    let resolvedCtaHref = ctaHref;
    if (!isAuthor) {
      try {
        let candidate = resolvedCtaHref;
        if (/^https?:\/\//i.test(candidate)) {
          const u = new URL(candidate);
          candidate = u.pathname;
        }
        if (candidate && candidate.startsWith('/content/')) {
          const mapped = await mapAemPathToSitePath(candidate);
          if (mapped) resolvedCtaHref = safeHref(mapped);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('content-fragment: CTA path mapping failed', e);
      }
    }

    const root = document.createElement('div');
    root.className = `banner-content block ${displayStyle}`.trim();
    root.dataset.aueResource = itemId;
    root.dataset.aueLabel = variationname || 'Elements';
    root.dataset.aueType = 'reference';
    root.dataset.aueFilter = 'contentfragment';
    root.dataset.cfPersistedQuery = graphqlPath;
    if (bannerContentStyle) root.setAttribute('style', bannerContentStyle);

    const detail = document.createElement('div');
    detail.className = `banner-detail ${alignment}`.trim();
    if (bannerDetailStyle) detail.setAttribute('style', bannerDetailStyle);
    if (view.bannerimage) {
      detail.dataset.aueProp = 'bannerimage';
      detail.dataset.aueLabel = 'Main Image';
      detail.dataset.aueType = 'media';
    }

    const h2 = document.createElement('h2');
    h2.className = 'cftitle';
    h2.dataset.aueProp = titleProp;
    h2.dataset.aueLabel = titleProp === 'headline' ? 'Headline' : 'Title';
    h2.dataset.aueType = 'text';
    h2.textContent = view.title;

    const fragment = document.createDocumentFragment();
    fragment.append(h2);

    if (view.subtitle) {
      const h3 = document.createElement('h3');
      h3.className = 'cfsubtitle';
      h3.dataset.aueProp = 'subtitle';
      h3.dataset.aueLabel = 'SubTitle';
      h3.dataset.aueType = 'text';
      h3.textContent = view.subtitle;
      fragment.append(h3);
    }

    const descWrap = document.createElement('div');
    descWrap.className = 'cfdescription';
    descWrap.dataset.aueProp = descProp;
    descWrap.dataset.aueLabel = descProp === 'paragraph' ? 'Paragraph' : 'Description';
    descWrap.dataset.aueType = 'richtext';
    const descP = document.createElement('p');
    descP.textContent = view.descriptionPlain;
    descWrap.append(descP);
    fragment.append(descWrap);

    if (view.cta || view.ctalabel) {
      const btnP = document.createElement('p');
      btnP.className = `button-container ${ctaStyle}`.trim();
      const a = document.createElement('a');
      a.href = resolvedCtaHref;
      a.dataset.aueProp = 'ctaurl';
      a.dataset.aueLabel = 'Button Link/URL';
      a.dataset.aueType = 'reference';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.dataset.aueFilter = 'page';
      a.className = 'button';
      const span = document.createElement('span');
      span.dataset.aueProp = 'ctalabel';
      span.dataset.aueLabel = 'Button Label';
      span.dataset.aueType = 'text';
      span.textContent = view.ctalabel;
      a.append(span);
      btnP.append(a);
      fragment.append(btnP);
    }

    const logo = document.createElement('div');
    logo.className = 'banner-logo';

    detail.append(fragment);
    root.append(detail, logo);
    block.append(root);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('content-fragment: render error', error);
    block.innerHTML = '';
  }
}

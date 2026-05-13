import { getMetadata } from '../../scripts/aem.js';
import {
  fetchPlaceholders,
  getHostname,
  isAuthorEnvironment,
  mapAemPathToSitePath,
} from '../../scripts/eds-support.js';

/**
 * Resolve persisted-query item from GraphQL JSON (shape varies by query name).
 * @param {object} offer
 * @param {string} itemKey e.g. ctaByPath
 */
function getCfItem(offer, itemKey) {
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
 * Path-only content fragment block: default promo layout (same GraphQL as Content Fragment).
 * @param {Element} block
 */
export default async function decorate(block) {
  const ph = await fetchPlaceholders();
  const wrapperUrl = (ph.cfWrapperUrl || getMetadata('cf-wrapper-url') || '').trim();
  const graphqlPath = (ph.cfGraphqlPath || getMetadata('cf-graphql-path') || '').trim();
  const itemKey = (ph.cfGraphqlItemKey || getMetadata('cf-graphql-item-key') || 'ctaByPath').trim();

  if (!graphqlPath) {
    // eslint-disable-next-line no-console
    console.warn('content-fragment-2: set cfGraphqlPath in placeholders.json or cf-graphql-path metadata.');
    block.innerHTML = '';
    return;
  }

  const hostnameFromPlaceholders = await getHostname();
  const hostname = hostnameFromPlaceholders || getMetadata('hostname');
  const aemAuthorUrl = (getMetadata('authorurl') || '').replace(/\/$/, '');
  const aemPublishUrl = hostname?.replace('author', 'publish')?.replace(/\/$/, '');

  const contentPath = block.querySelector(':scope div:nth-child(1) > div a')?.textContent?.trim();
  const variationname = block.querySelector(':scope div:nth-child(2) > div')?.textContent?.trim()?.toLowerCase()?.replace(/\s+/g, '_') || 'master';
  const displayStyle = '';
  const alignment = '';
  const ctaStyle = 'button';

  if (!contentPath) {
    block.innerHTML = '';
    return;
  }

  block.textContent = '';
  const isAuthor = isAuthorEnvironment();

  const graphqlSuffix = graphqlPath.startsWith('/') ? graphqlPath : `/${graphqlPath}`;
  const requestConfig = isAuthor
    ? {
      url: `${aemAuthorUrl}${graphqlSuffix};path=${encodeURIComponent(contentPath)};variation=${encodeURIComponent(variationname)};ts=${Date.now()}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
    : {
      url: wrapperUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graphQLPath: `${aemPublishUrl || ''}${graphqlSuffix}`,
        cfPath: contentPath,
        variation: `${variationname};ts=${Date.now()}`,
      }),
    };

  if (!isAuthor && (!wrapperUrl || !aemPublishUrl)) {
    // eslint-disable-next-line no-console
    console.warn('content-fragment-2: publish mode needs cfWrapperUrl placeholder and hostname for publish host.');
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
      console.error(`content-fragment-2: GraphQL request failed ${response.status}`);
      block.innerHTML = '';
      return;
    }

    let offer;
    try {
      offer = await response.json();
    } catch (parseError) {
      // eslint-disable-next-line no-console
      console.error('content-fragment-2: invalid JSON', parseError);
      block.innerHTML = '';
      return;
    }

    const cfReq = getCfItem(offer, itemKey);
    if (!cfReq) {
      // eslint-disable-next-line no-console
      console.error('content-fragment-2: no item in GraphQL response', { itemKey, offer });
      block.innerHTML = '';
      return;
    }

    const itemId = `urn:aemconnection:${contentPath}/jcr:content/data/${variationname}`;
    block.setAttribute('data-aue-type', 'container');

    const imgUrl = isAuthor ? cfReq.bannerimage?._authorUrl : cfReq.bannerimage?._publishUrl;

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
    const cta = cfReq?.ctaurl;
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

    if (!isAuthor) {
      try {
        let candidate = ctaHref;
        if (/^https?:\/\//i.test(candidate)) {
          const u = new URL(candidate);
          candidate = u.pathname;
        }
        if (candidate && candidate.startsWith('/content/')) {
          const mapped = await mapAemPathToSitePath(candidate);
          if (mapped) ctaHref = safeHref(mapped);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('content-fragment-2: path mapping failed', e);
      }
    }

    const root = document.createElement('div');
    root.className = `banner-content block ${displayStyle}`.trim();
    root.dataset.aueResource = itemId;
    root.dataset.aueLabel = variationname || 'Elements';
    root.dataset.aueType = 'reference';
    root.dataset.aueFilter = 'contentfragment';
    if (bannerContentStyle) root.setAttribute('style', bannerContentStyle);

    const detail = document.createElement('div');
    detail.className = `banner-detail ${alignment}`.trim();
    if (bannerDetailStyle) detail.setAttribute('style', bannerDetailStyle);
    detail.dataset.aueProp = 'bannerimage';
    detail.dataset.aueLabel = 'Main Image';
    detail.dataset.aueType = 'media';

    const h2 = document.createElement('h2');
    h2.className = 'cftitle';
    h2.dataset.aueProp = 'title';
    h2.dataset.aueLabel = 'Title';
    h2.dataset.aueType = 'text';
    h2.textContent = cfReq?.title ?? '';

    const h3 = document.createElement('h3');
    h3.className = 'cfsubtitle';
    h3.dataset.aueProp = 'subtitle';
    h3.dataset.aueLabel = 'SubTitle';
    h3.dataset.aueType = 'text';
    h3.textContent = cfReq?.subtitle ?? '';

    const descWrap = document.createElement('div');
    descWrap.className = 'cfdescription';
    descWrap.dataset.aueProp = 'description';
    descWrap.dataset.aueLabel = 'Description';
    descWrap.dataset.aueType = 'richtext';
    const descP = document.createElement('p');
    descP.textContent = cfReq?.description?.plaintext || '';
    descWrap.append(descP);

    const btnP = document.createElement('p');
    btnP.className = `button-container ${ctaStyle}`.trim();
    const a = document.createElement('a');
    a.href = ctaHref;
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
    span.textContent = cfReq?.ctalabel ?? '';
    a.append(span);
    btnP.append(a);

    const logo = document.createElement('div');
    logo.className = 'banner-logo';

    detail.append(h2, h3, descWrap, btnP);
    root.append(detail, logo);
    block.append(root);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('content-fragment-2: render error', error);
    block.innerHTML = '';
  }
}

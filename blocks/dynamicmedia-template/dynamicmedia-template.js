import { getMetadata } from '../../scripts/aem.js';
import {
  fetchPlaceholders,
  getHostname,
  isAuthorEnvironment,
} from '../../scripts/eds-support.js';

/**
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const inputs = block.querySelectorAll('.dynamicmedia-template > div');
  const configSrc = Array.from(block.children)[0]?.textContent?.trim();

  if (configSrc === 'inline' || !configSrc) {
    const templateURL = inputs[1]?.textContent?.trim();
    const variablemapping = inputs[2]?.textContent?.trim() || '';

    if (!templateURL) {
      // eslint-disable-next-line no-console
      console.error('dynamicmedia-template: missing template URL');
      block.innerHTML = '';
      return;
    }

    const paramPairs = variablemapping.split(',');
    const paramObject = {};
    if (paramPairs) {
      paramPairs.forEach((pair) => {
        const indexOfEqual = pair.indexOf('=');
        if (indexOfEqual !== -1) {
          const key = pair.slice(0, indexOfEqual).trim();
          let value = pair.slice(indexOfEqual + 1).trim();
          if (value.endsWith(',')) {
            value = value.slice(0, -1);
          }
          if (key) {
            paramObject[key] = value;
          }
        }
      });
    }

    const queryString = Object.entries(paramObject)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const finalUrl = templateURL.includes('?')
      ? `${templateURL}&${queryString}`
      : `${templateURL}?${queryString}`;

    const finalImg = document.createElement('img');
    finalImg.className = 'dm-template-image';
    finalImg.src = finalUrl;
    finalImg.alt = 'dynamic media template';
    finalImg.loading = 'lazy';
    finalImg.onerror = () => {
      // eslint-disable-next-line no-console
      console.warn('dynamicmedia-template: image failed to load', finalUrl);
    };
    block.innerHTML = '';
    block.append(finalImg);
    return;
  }

  if (configSrc === 'cf') {
    const ph = await fetchPlaceholders();
    const wrapperUrl = (ph.dmTemplateWrapperUrl || getMetadata('dm-template-wrapper-url') || '').trim();
    const graphqlPath = (ph.dmTemplateGraphqlPath || getMetadata('dm-template-graphql-path') || '').trim();
    if (!graphqlPath) {
      // eslint-disable-next-line no-console
      console.warn('dynamicmedia-template: set dmTemplateGraphqlPath in placeholders or dm-template-graphql-path metadata.');
      block.innerHTML = '';
      return;
    }

    const hostnameFromPlaceholders = await getHostname();
    const hostname = hostnameFromPlaceholders || getMetadata('hostname');
    const aemAuthorUrl = (getMetadata('authorurl') || '').replace(/\/$/, '');
    const aemPublishUrl = hostname?.replace('author', 'publish')?.replace(/\/$/, '');
    const graphqlSuffix = graphqlPath.startsWith('/') ? graphqlPath : `/${graphqlPath}`;

    const contentPath = block.querySelector('p.button-container > a')?.textContent?.trim();
    if (!contentPath) {
      block.innerHTML = '';
      return;
    }

    const isAuthor = isAuthorEnvironment();
    const requestConfig = isAuthor
      ? {
        url: `${aemAuthorUrl}${graphqlSuffix};path=${encodeURIComponent(contentPath)};ts=${Date.now()}`,
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
          variation: `master;ts=${Date.now()}`,
        }),
      };

    if (!isAuthor && (!wrapperUrl || !aemPublishUrl)) {
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
        block.innerHTML = '';
        return;
      }
      const offer = await response.json();
      const templateURL = offer?.data?.dynamicMediaTemplateByPath?.item?.dm_template;
      const paramPairsList = offer?.data?.dynamicMediaTemplateByPath?.item?.var_mapping;
      if (!templateURL || !Array.isArray(paramPairsList)) {
        block.innerHTML = '';
        return;
      }

      const paramObject = {};
      paramPairsList.forEach((pair) => {
        const indexOfEqual = pair.indexOf('=');
        if (indexOfEqual === -1) return;
        const key = pair.slice(0, indexOfEqual).trim();
        let value = pair.slice(indexOfEqual + 1).trim();
        if (value.endsWith(',')) {
          value = value.slice(0, -1);
        }
        paramObject[key] = value;
      });

      const queryString = Object.entries(paramObject)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      const finalUrl = templateURL.includes('?')
        ? `${templateURL}&${queryString}`
        : `${templateURL}?${queryString}`;

      const finalImg = document.createElement('img');
      finalImg.className = 'dm-template-image';
      finalImg.src = finalUrl;
      finalImg.alt = 'dynamic media template';
      finalImg.loading = 'lazy';
      block.innerHTML = '';
      block.append(finalImg);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('dynamicmedia-template: CF fetch failed', e);
      block.innerHTML = '';
    }
  }
}

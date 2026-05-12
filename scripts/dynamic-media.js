/**
 * Dynamic Media Open API image decoration (ported from RefDemoEDS).
 * Enhances links to /adobe/assets/urn:… inside DM blocks with responsive <picture> output.
 */

function isDMOpenAPIUrl(src) {
  return /^(https?:\/\/(.*)\/adobe\/assets\/urn:aaid:aem:(.*))/m.test(src);
}

export function getMetadataUrl(url) {
  try {
    const urnPattern = /(\/adobe\/assets\/urn:aaid:aem:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
    const match = url.match(urnPattern);
    if (!match) return null;
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
    return `${baseUrl}${match[1]}/metadata`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating metadata URL:', error);
    return null;
  }
}

function whatBlockIsThis(element) {
  let currentElement = element;
  while (currentElement.parentElement) {
    if (currentElement.parentElement.classList.contains('block')) {
      return currentElement.parentElement;
    }
    currentElement = currentElement.parentElement;
    if (currentElement.classList.length > 0) return currentElement.classList[0];
  }
  return null;
}

function isDmImageBlockName(name) {
  return name === 'dm-openapi'
    || name === 'dynamic-media-image'
    || name === 'dynamicmedia-image';
}

/**
 * @param {HTMLElement} main
 */
export async function decorateDMImages(main) {
  if (!main) return;

  /* Open API fetches are sequential per link to avoid stampedes on metadata */
  /* eslint-disable no-await-in-loop */

  const allBlocks = Array.from(main.querySelectorAll('.dm-openapi, .dynamic-media-image, .dynamicmedia-image'));
  allBlocks.forEach((block) => {
    const links = block.querySelectorAll('a[href]');
    if (links.length === 0) {
      Array.from(block.children).forEach((child) => {
        // eslint-disable-next-line no-param-reassign
        child.style.display = 'none';
      });
    }
  });

  const links = Array.from(main.querySelectorAll('a[href]'));

  // eslint-disable-next-line no-restricted-syntax, prefer-destructuring
  for (const a of links) {
    const { href } = a;
    const hrefLower = href.toLowerCase();
    if (!isDMOpenAPIUrl(href)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const isGifFile = hrefLower.endsWith('.gif');
    const containsOriginal = href.includes('/original/');
    const dmOpenApiDiv = a.closest('.dm-openapi')
      || a.closest('.dynamic-media-image')
      || a.closest('.dynamicmedia-image');
    if (!dmOpenApiDiv) {
      // eslint-disable-next-line no-continue
      continue;
    }
    if (containsOriginal && !isGifFile) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const blockBeingDecorated = whatBlockIsThis(a);
    let blockName = '';
    let rotate = '';
    let flip = '';
    let cropValue = '';
    let preset = '';
    let extend = '';
    let backgroundcolor = '';
    let enableSmartCrop = '';

    if (blockBeingDecorated) {
      blockName = Array.from(blockBeingDecorated.classList).find(
        (className) => className !== 'block',
      ) || '';
    }

    const videoExtensions = ['.mp4', '.mov', '.webm', '.ogg', '.m4v', '.mkv'];
    const isVideoAsset = videoExtensions.some((ext) => hrefLower.includes(ext));
    if (isVideoAsset || blockName === 'video') {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (isDmImageBlockName(blockName)) {
      const parentDiv = a.closest('div');
      if (parentDiv && parentDiv.parentElement) {
        const container = parentDiv.parentElement;
        const siblings = [];
        let current = container.nextElementSibling;
        while (current && siblings.length < 7) {
          siblings.push(current);
          current = current.nextElementSibling;
        }
        const consumeSiblingText = (el) => {
          if (!el) return '';
          const text = el.textContent?.trim() || '';
          if (text) el.remove();
          return text;
        };
        if (siblings.length > 0) {
          enableSmartCrop = consumeSiblingText(siblings.shift()) || false;
          preset = consumeSiblingText(siblings.shift());
          extend = consumeSiblingText(siblings.shift());
          backgroundcolor = consumeSiblingText(siblings.shift());
          rotate = consumeSiblingText(siblings.shift());
          flip = consumeSiblingText(siblings.shift());
          cropValue = consumeSiblingText(siblings.shift());
        }
      }
      dmOpenApiDiv.querySelectorAll(':scope > div').forEach((div) => div.remove());
    }

    const buildAdvanceModifierParams = () => {
      const params = [];
      if (rotate) params.push(`rotate=${encodeURIComponent(rotate)}`);
      if (flip) params.push(`flip=${encodeURIComponent(flip.toLowerCase())}`);
      if (cropValue) params.push(`crop=${encodeURIComponent(cropValue.toLowerCase())}`);
      if (preset) {
        const presetLower = preset.toLowerCase();
        if (presetLower === 'border') {
          if (extend && backgroundcolor) {
            const bgColor = backgroundcolor.replace('#', '');
            params.push(`extend=${encodeURIComponent(extend)}`);
            params.push(`background-color=rgb,${encodeURIComponent(bgColor)}`);
          } else if (extend) {
            params.push(`extend=${encodeURIComponent(extend)}`);
          }
        } else if (presetLower === 'grayscale') {
          params.push('saturation=-100');
        } else {
          params.push(`preset=${encodeURIComponent(preset)}`);
        }
      }
      return params.length > 0 ? `&${params.join('&')}` : '';
    };

    const advanceModifierParams = buildAdvanceModifierParams();
    const originalUrl = new URL(href);
    const hasQueryParams = originalUrl.toString().includes('?');
    const paramSeparator = hasQueryParams ? '&' : '?';
    const baseParams = `${paramSeparator}quality=85&preferwebp=true${advanceModifierParams}`;
    const pic = document.createElement('picture');

    if (enableSmartCrop === true || enableSmartCrop === 'true') {
      const metadataUrl = getMetadataUrl(href);
      if (!metadataUrl) {
        // eslint-disable-next-line no-continue
        continue;
      }
      let metadata;
      try {
        const response = await fetch(metadataUrl);
        if (!response.ok) {
          // eslint-disable-next-line no-console
          console.error(`Failed to fetch metadata: ${response.status}`);
          // eslint-disable-next-line no-continue
          continue;
        }
        metadata = await response.json();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching or processing metadata:', error);
        // eslint-disable-next-line no-continue
        continue;
      }

      const smartcrops = metadata?.repositoryMetadata?.smartcrops;
      const mimeType = metadata?.repositoryMetadata?.['dc:format'];
      if (smartcrops) {
        pic.style.textAlign = 'center';
        const cropKeys = Object.keys(smartcrops);
        if (!cropKeys.length) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const cropOrder = cropKeys.sort((x, y) => {
          const widthA = parseInt(smartcrops[x].width, 10) || 0;
          const widthB = parseInt(smartcrops[y].width, 10) || 0;
          return widthB - widthA;
        });
        const largestCropWidth = Math.max(
          ...cropOrder.map((cropName) => parseInt(smartcrops[cropName].width, 10) || 0),
        );
        const extraLargeBreakpoint = Math.max(largestCropWidth + 1, 1300);
        const sourceWebpExtraLarge = document.createElement('source');
        sourceWebpExtraLarge.type = 'image/webp';
        sourceWebpExtraLarge.srcset = `${originalUrl}${baseParams}`;
        sourceWebpExtraLarge.media = `(min-width: ${extraLargeBreakpoint}px)`;
        pic.appendChild(sourceWebpExtraLarge);
        cropOrder.forEach((cropName) => {
          const crop = smartcrops[cropName];
          if (!crop) return;
          const minWidth = parseInt(crop.width, 10) || 0;
          const smartcropParam = `${paramSeparator}smartcrop=${encodeURIComponent(cropName)}`;
          const sourceWebp = document.createElement('source');
          sourceWebp.type = mimeType || 'image/webp';
          sourceWebp.srcset = `${originalUrl}${smartcropParam}&quality=85&preferwebp=true${advanceModifierParams}`;
          if (minWidth > 0) sourceWebp.media = `(min-width: ${minWidth}px)`;
          pic.appendChild(sourceWebp);
        });
      }
    }

    const fallbackUrl = `${originalUrl}${baseParams}`;
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = fallbackUrl;
    pic.appendChild(img);
    dmOpenApiDiv.appendChild(pic);
  }

  /* eslint-enable no-await-in-loop */
}

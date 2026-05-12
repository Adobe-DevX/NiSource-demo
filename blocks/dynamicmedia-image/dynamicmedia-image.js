import { getDynamicMediaServerURL } from '../../scripts/eds-support.js';

/**
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const { hostname } = window.location;
  const shouldHide = hostname.includes('aem.live') || hostname.includes('aem.page');

  const [deliveryCell] = Array.from(block.children);
  const deliveryType = deliveryCell?.textContent?.trim();
  const inputs = block.querySelectorAll('.dynamicmedia-image > div');
  const inputsArray = Array.from(inputs);
  if (inputsArray.length < 2) {
    return;
  }

  const [imgFromRow] = inputs[1]?.getElementsByTagName('img') || [];
  const imageEl = imgFromRow;
  const altText = inputs[5]?.textContent?.trim();

  if (deliveryType === 'na' || !deliveryType) {
    block.innerHTML = '';
    return;
  }

  if (deliveryType === 'dm') {
    const dmUrlEl = await getDynamicMediaServerURL();

    if (typeof window.s7responsiveImage !== 'function') {
      // eslint-disable-next-line no-console
      console.error('dynamicmedia-image: s7responsiveImage is not defined. Add Scene7 responsive_image.js to head when using Classic DM delivery.');
      return;
    }

    if (!imageEl) {
      // eslint-disable-next-line no-console
      console.error('dynamicmedia-image: missing image element');
      return;
    }

    const imageSrc = imageEl.getAttribute('src');
    if (!imageSrc) {
      // eslint-disable-next-line no-console
      console.error('dynamicmedia-image: missing image src');
      return;
    }

    const imageName = imageSrc.split('/').pop().split('.')[0];
    const dmUrl = dmUrlEl || 'https://smartimaging.scene7.com/is/image/DynamicMediaNA/';

    imageEl.setAttribute('data-src', dmUrl + (dmUrl.endsWith('/') ? '' : '/') + imageName);
    imageEl.setAttribute('src', dmUrl + (dmUrl.endsWith('/') ? '' : '/') + imageName);
    imageEl.setAttribute('alt', altText || 'dynamic media image');
    imageEl.setAttribute('data-mode', 'smartcrop');
    block.innerHTML = '';
    block.appendChild(imageEl);
    if (!shouldHide) {
      window.s7responsiveImage(imageEl);
    }
    return;
  }

  if (deliveryType === 'dm-openapi') {
    block.children[6]?.remove();
    block.children[5]?.remove();
    block.children[4]?.remove();
    block.children[3]?.remove();
    block.children[2]?.remove();
    block.children[0]?.remove();

    const assetLink = inputs[1]?.querySelector('a[href]');
    let baseUrl = assetLink?.href?.split('?')[0];
    if (!baseUrl) {
      const sourceEl = inputs[1]?.querySelector('picture source[srcset]');
      const srcset = sourceEl?.getAttribute('srcset') || '';
      if (srcset) {
        const [firstPart] = srcset.split(',');
        const firstSrc = firstPart?.trim().split(/\s+/)[0] || '';
        if (firstSrc) {
          const [pathNoQuery] = firstSrc.split('?');
          baseUrl = pathNoQuery || '';
        }
      }
    }
    if (!baseUrl) {
      const imgEl2 = inputs[1]?.querySelector('picture img[src], img[src]');
      const imgSrc = imgEl2?.getAttribute('src') || '';
      if (imgSrc) {
        const [pathNoQuery] = imgSrc.split('?');
        baseUrl = pathNoQuery || '';
      }
    }

    const rotationVal = inputs[2]?.textContent?.trim();
    const flipVal = inputs[3]?.textContent?.trim();
    const cropVal = inputs[4]?.textContent?.trim();
    const altFromAuthor = inputs[5]?.textContent?.trim();

    if (!baseUrl) {
      // eslint-disable-next-line no-console
      console.error('dynamicmedia-image: OpenAPI delivery URL not found');
      return;
    }

    const params = new URLSearchParams();
    params.set('width', '1400');
    params.set('quality', '85');
    if (rotationVal && rotationVal.toLowerCase() !== 'none') params.set('rotate', rotationVal);
    if (flipVal) params.set('flip', flipVal.toLowerCase());
    if (cropVal) params.set('crop', cropVal.toLowerCase());

    const finalUrl = `${baseUrl}?${params.toString()}`;

    const img = document.createElement('img');
    img.setAttribute('src', finalUrl);
    img.setAttribute('alt', altFromAuthor || 'dynamic media image');
    img.setAttribute('loading', 'lazy');

    block.innerHTML = '';
    block.appendChild(img);
  }
}

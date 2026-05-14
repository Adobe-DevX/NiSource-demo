import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

function joinText(value) {
  if (Array.isArray(value)) {
    return value.join(' ').trim();
  }
  return String(value ?? '').trim();
}

/** Plain text for optional fields; treats empty/whitespace and empty richtext as un-authored. */
function plainFromAuthor(value) {
  const raw = joinText(value);
  if (!raw) return '';
  if (raw.includes('<')) {
    try {
      const doc = new DOMParser().parseFromString(raw, 'text/html');
      return (doc.body.textContent || '').trim();
    } catch {
      return raw;
    }
  }
  return raw;
}

function createCta(label, link) {
  const cta = document.createElement('a');
  cta.className = 'button';
  cta.href = link || '#';
  cta.textContent = label;

  if (!link) {
    cta.classList.add('disabled');
    cta.setAttribute('aria-disabled', 'true');
    cta.addEventListener('click', (event) => event.preventDefault());
  }

  return cta;
}

export default function decorate(block) {
  const {
    image,
    headline,
    description,
    'image-alt': imageAltRaw,
    'cta-label': ctaLabelRaw,
    'cta-link': ctaLink,
  } = readBlockConfig(block);

  const imageAlt = joinText(imageAltRaw);
  const headlineText = plainFromAuthor(headline);
  const descriptionText = plainFromAuthor(description);
  const ctaLabel = joinText(ctaLabelRaw);

  const wrapper = document.createElement('div');
  wrapper.className = 'teaser__wrapper';

  if (image) {
    const media = document.createElement('div');
    media.className = 'teaser__media';
    media.append(createOptimizedPicture(image, imageAlt, false, [{ width: '1600' }, { width: '900' }]));
    wrapper.append(media);
  }

  const hasContent = headlineText || descriptionText || ctaLabel;
  if (hasContent) {
    const content = document.createElement('div');
    content.className = 'teaser__content';

    if (headlineText) {
      const heading = document.createElement('h2');
      heading.textContent = headlineText;
      content.append(heading);
    }

    if (descriptionText) {
      const body = document.createElement('p');
      body.textContent = descriptionText;
      content.append(body);
    }

    if (ctaLabel) {
      const ctaContainer = document.createElement('p');
      ctaContainer.className = 'teaser__cta';
      ctaContainer.append(createCta(ctaLabel, ctaLink));
      content.append(ctaContainer);
    }

    wrapper.append(content);
  }

  block.replaceChildren(wrapper);
}

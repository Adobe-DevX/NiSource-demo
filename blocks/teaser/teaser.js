import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

const DEFAULTS = {
  headline: 'Shop our Marketplace',
  description: 'Browse our Marketplace to find smart thermostats, energy-saving devices, and home solutions designed to improve comfort and lower your energy costs.',
  'cta-label': 'Take control',
};

function toText(value, fallback = '') {
  if (Array.isArray(value)) {
    return value.join(' ').trim() || fallback;
  }

  return value || fallback;
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
  const config = readBlockConfig(block);

  const image = config.image;
  const imageAlt = toText(config['image-alt'], '');
  const headline = toText(config.headline, DEFAULTS.headline);
  const description = toText(config.description, DEFAULTS.description);
  const ctaLabel = toText(config['cta-label'], DEFAULTS['cta-label']);
  const ctaLink = config['cta-link'];

  const wrapper = document.createElement('div');
  wrapper.className = 'teaser__wrapper';

  if (image) {
    const media = document.createElement('div');
    media.className = 'teaser__media';
    media.append(createOptimizedPicture(image, imageAlt, false, [{ width: '1600' }, { width: '900' }]));
    wrapper.append(media);
  }

  const content = document.createElement('div');
  content.className = 'teaser__content';

  const heading = document.createElement('h2');
  heading.textContent = headline;

  const body = document.createElement('p');
  body.textContent = description;

  const ctaContainer = document.createElement('p');
  ctaContainer.className = 'teaser__cta';
  ctaContainer.append(createCta(ctaLabel, ctaLink));

  content.append(heading, body, ctaContainer);
  wrapper.append(content);

  block.replaceChildren(wrapper);
}

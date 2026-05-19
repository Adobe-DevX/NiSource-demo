import { createOptimizedPicture, loadCSS, toClassName } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const FONT_AWESOME_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';

const METADATA_KEYS = new Set([
  'heading',
  'heading-icon',
  'footer-text',
  'footer-link-text',
  'footer-link',
  'classes-placement',
  'column-placement-in-two-column-section',
]);

const DEFAULTS = {
  heading: 'My Insights',
  headingIcon: 'fa-solid fa-chart-pie',
  footerText: 'Check to see how your usage has changed month to month.',
  footerLinkText: 'View Detailed Usage',
  footerLink: '',
};

/** Hardcoded DAM image for the 3rd accordion when its panel has no authored content. */
const NEIGHBOR_COMPARISON_IMG_SRC = '/content/dam/nisource-demo/energy-comparison-neighbor.png';
const NEIGHBOR_COMPARISON_IMG_ALT = 'Comparison of your energy usage with neighbors';
const NEIGHBOR_ITEM_INDEX = 2;

const DEFAULT_ITEMS = [
  { title: 'Compare My Bill to a Previous Bill', body: '' },
  { title: 'View My Projected Bill', body: '' },
  {
    title: 'Compare My Usage to My Neighbors',
    body: `<img class="my-insights__dam-image" src="${NEIGHBOR_COMPARISON_IMG_SRC}" alt="${NEIGHBOR_COMPARISON_IMG_ALT}" loading="lazy" decoding="async" />`,
  },
];

function panelBodyIsEffectivelyEmpty(bodyHtml, mediaCol) {
  if (mediaCol?.querySelector?.('img')) return false;
  const html = String(bodyHtml || '');
  if (/<img\b/i.test(html)) return false;
  return html.replace(/<[^>]*>/g, '').trim().length === 0;
}

function extractColumnValue(col) {
  if (col.querySelector('a')) {
    const as = [...col.querySelectorAll('a')];
    if (as.length === 1) return as[0].href;
    return as.map((a) => a.href);
  }
  if (col.querySelector('img')) {
    const imgs = [...col.querySelectorAll('img')];
    if (imgs.length === 1) return imgs[0].src;
    return imgs.map((img) => img.src);
  }
  if (col.querySelector('p')) {
    const ps = [...col.querySelectorAll('p')];
    if (ps.length === 1) return ps[0].textContent.trim();
    return ps.map((p) => p.textContent.trim());
  }
  return col.textContent.trim();
}

function toText(value, fallback) {
  if (Array.isArray(value)) {
    return value.join(' ').trim() || fallback;
  }
  return (value || '').toString().trim() || fallback;
}

function createHeadingIcon(iconValue) {
  const normalized = (iconValue || '').trim();
  if (!normalized) return null;

  const wrap = document.createElement('span');
  wrap.className = 'my-insights__heading-icon';
  wrap.setAttribute('aria-hidden', 'true');
  const i = document.createElement('i');

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const hasStyleToken = tokens.some((token) => /^fa-(solid|regular|brands|light|thin|duotone)$/.test(token));
  const hasIconToken = tokens.some((token) => token.startsWith('fa-') && !/^fa-(solid|regular|brands|light|thin|duotone)$/.test(token));

  const classes = tokens.filter((token) => token.startsWith('fa-'));

  if (!hasStyleToken) {
    classes.unshift('fa-solid');
  }

  if (!hasIconToken) {
    classes.push(tokens[0].startsWith('fa-') ? tokens[0] : `fa-${tokens[0]}`);
  }

  i.className = classes.join(' ');
  wrap.append(i);
  return wrap;
}

function parseRows(block) {
  /** @type {Record<string, string>} */
  const metadata = {};
  /**
   * @type {Array<{
   *   labelCol: HTMLElement,
   *   bodyCol: HTMLElement,
   *   mediaCol?: HTMLElement,
   *   altTextCol?: HTMLElement
   * }>}
   */
  const items = [];

  [...block.children].forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const key = toClassName(cols[0].textContent);
    if (METADATA_KEYS.has(key)) {
      metadata[key] = extractColumnValue(cols[1]);
      return;
    }

    const mediaCol = cols.length >= 3 ? cols[2] : undefined;
    const altTextCol = cols.length >= 4 ? cols[3] : undefined;
    items.push({
      labelCol: cols[0],
      bodyCol: cols[1],
      mediaCol,
      altTextCol,
    });
  });

  return { metadata, items };
}

function buildFooter(metadata) {
  const footer = document.createElement('div');
  footer.className = 'my-insights__footer';

  const footerText = toText(metadata['footer-text'], DEFAULTS.footerText);
  if (footerText) {
    const p = document.createElement('p');
    p.className = 'my-insights__footer-text';
    p.textContent = footerText;
    footer.append(p);
  }

  const linkText = toText(metadata['footer-link-text'], DEFAULTS.footerLinkText);
  const linkHref = toText(metadata['footer-link'], DEFAULTS.footerLink);
  const a = document.createElement('a');
  a.className = 'my-insights__footer-link';
  a.textContent = linkText;
  a.href = linkHref || '#';

  if (!linkHref) {
    a.setAttribute('aria-disabled', 'true');
    a.addEventListener('click', (event) => event.preventDefault());
  }

  footer.append(a);
  return footer;
}

/**
 * @param {HTMLElement} panel
 * @param {HTMLElement | undefined} mediaCol
 * @param {HTMLElement | undefined} altTextCol
 */
function appendOptimizedPanelImage(panel, mediaCol, altTextCol) {
  if (!mediaCol) return;
  const srcImg = mediaCol.querySelector('img');
  if (!srcImg?.src) return;

  let alt = (srcImg.alt || '').trim();
  if (!alt && altTextCol) {
    alt = altTextCol.textContent.trim();
  }

  const optimizedPic = createOptimizedPicture(
    srcImg.src,
    alt,
    false,
    [{ width: '550' }, { width: '750' }],
  );
  const newImg = optimizedPic.querySelector('img');
  if (newImg) {
    moveInstrumentation(srcImg, newImg);
  }
  const wrap = document.createElement('div');
  wrap.className = 'my-insights__panel-media';
  wrap.append(optimizedPic);
  panel.append(wrap);
}

export default async function decorate(block) {
  try {
    await loadCSS(FONT_AWESOME_CSS);
  } catch {
    /* Font Awesome CDN may be blocked or unavailable. */
  }

  const { metadata, items } = parseRows(block);

  const heading = toText(metadata.heading, DEFAULTS.heading);
  const headingIconRaw = toText(metadata['heading-icon'], '');
  const iconValue = headingIconRaw || DEFAULTS.headingIcon;

  let placement = toText(
    metadata['classes-placement'] || metadata['column-placement-in-two-column-section'],
    '',
  );
  if (!placement && block.classList.contains('place-right')) {
    placement = 'place-right';
  } else if (!placement && block.classList.contains('place-left')) {
    placement = 'place-left';
  }
  if (placement === 'place-left' || placement === 'place-right') {
    block.classList.add(placement);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'my-insights__wrapper';

  const header = document.createElement('div');
  header.className = 'my-insights__header';

  const headingIcon = createHeadingIcon(iconValue);
  if (!headingIcon) {
    header.classList.add('my-insights__header--without-icon');
  }

  const headingEl = document.createElement('h2');
  headingEl.className = 'my-insights__title';
  headingEl.textContent = heading;

  if (headingIcon) {
    header.append(headingIcon);
  }
  header.append(headingEl);

  const list = document.createElement('div');
  list.className = 'my-insights__list';

  const sourceItems = items.length > 0
    ? items.map(({
      labelCol, bodyCol, mediaCol, altTextCol,
    }) => ({
      title: labelCol.innerHTML.trim(),
      body: bodyCol.innerHTML.trim(),
      mediaCol,
      altTextCol,
    }))
    : DEFAULT_ITEMS.map(({ title, body }) => ({
      title,
      body,
      mediaCol: undefined,
      altTextCol: undefined,
    }));

  sourceItems.forEach((item, idx) => {
    if (idx !== NEIGHBOR_ITEM_INDEX) return;
    if (!panelBodyIsEffectivelyEmpty(item.body, item.mediaCol)) return;
    item.body = `<img class="my-insights__dam-image" src="${NEIGHBOR_COMPARISON_IMG_SRC}" alt="${NEIGHBOR_COMPARISON_IMG_ALT}" loading="lazy" decoding="async" />`;
  });

  sourceItems.forEach(({
    title: labelHtml, body: bodyHtml, mediaCol, altTextCol,
  }) => {
    const details = document.createElement('details');
    details.className = 'my-insights__item';

    const summary = document.createElement('summary');
    summary.className = 'my-insights__summary';
    summary.innerHTML = labelHtml || '&nbsp;';

    const panel = document.createElement('div');
    panel.className = 'my-insights__panel';
    appendOptimizedPanelImage(panel, mediaCol, altTextCol);
    if (bodyHtml) {
      const bodyWrap = document.createElement('div');
      bodyWrap.className = 'my-insights__panel-body';
      bodyWrap.innerHTML = bodyHtml;
      panel.append(bodyWrap);
    }

    details.append(summary, panel);
    list.append(details);
  });

  const footer = buildFooter(metadata);

  wrapper.append(header, list, footer);
  block.replaceChildren(wrapper);
}

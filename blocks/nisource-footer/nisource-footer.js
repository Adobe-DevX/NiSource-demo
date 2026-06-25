import { toClassName } from '../../scripts/aem.js';

const DEFAULT_BRAND = 'SEW AI Customs';

function defaultCopyright() {
  return `Copyright © ${new Date().getFullYear()} SEW AI | All rights reserved.`;
}

const DEFAULT_LEGAL = `<p>
<a href="https://myaccount-utility.sewcx.ai/Portal/helpsupport">Contact Us</a>
<a href="#">Terms and Conditions</a>
<a href="#">Privacy Policy</a>
</p>`;

/**
 * Key-value rows like readBlockConfig, but preserves markup in richtext cells
 * (readBlockConfig uses paragraph textContent and drops list/link HTML).
 * @param {Element} block
 * @returns {Record<string, string>}
 */
function readFooterConfig(block) {
  const cfg = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;
    const name = toClassName(cols[0].textContent);
    if (!name) return;
    const col = cols[1];
    if (['brand', 'brand-line', 'company', 'copyright'].includes(name) || /-title$/.test(name)) {
      cfg[name] = col.textContent.trim();
    } else {
      cfg[name] = col.innerHTML.trim();
    }
  });
  return cfg;
}

function joinConfig(value) {
  if (Array.isArray(value)) {
    return value.join('').trim();
  }
  return String(value ?? '').trim();
}

function plainLength(value) {
  const raw = joinConfig(value);
  if (!raw) return 0;
  if (raw.includes('<')) {
    try {
      const doc = new DOMParser().parseFromString(raw, 'text/html');
      return (doc.body.textContent || '').trim().length;
    } catch {
      return raw.replace(/<[^>]*>/g, '').trim().length;
    }
  }
  return raw.length;
}

/**
 * loads and decorates the compact NiSource footer.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cfg = readFooterConfig(block);

  const brand = joinConfig(cfg.brand || cfg['brand-line'] || cfg.company) || DEFAULT_BRAND;
  const copyright = joinConfig(cfg.copyright) || defaultCopyright();
  const legal = plainLength(cfg.legal) > 0 ? joinConfig(cfg.legal) : DEFAULT_LEGAL;

  const inner = document.createElement('div');
  inner.className = 'nisource-footer__inner';

  const legalEl = document.createElement('nav');
  legalEl.className = 'nisource-footer__legal';
  legalEl.setAttribute('aria-label', 'Footer');
  legalEl.innerHTML = legal;
  inner.append(legalEl);

  const brandEl = document.createElement('p');
  brandEl.className = 'nisource-footer__brand';
  brandEl.textContent = brand;
  inner.append(brandEl);

  const copyrightEl = document.createElement('p');
  copyrightEl.className = 'nisource-footer__copyright';
  copyrightEl.textContent = copyright;
  inner.append(copyrightEl);

  block.textContent = '';
  block.append(inner);
}

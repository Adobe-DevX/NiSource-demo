import { toClassName } from '../../scripts/aem.js';

/** Wireframe defaults (NIPSCO-style IA); any authored column/subfooter field replaces its slot. */
const DEFAULT_COLUMNS = [
  {
    title: 'Our Company',
    body: `<ul>
<li><a href="#">About Us</a></li>
<li><a href="#">Your Energy, Your Future</a></li>
<li><a href="#">Giving Back</a></li>
<li><a href="#">Rates and Tariffs</a></li>
<li><a href="#">Our Environment</a></li>
<li><a href="#">News Room</a></li>
<li><a href="#">Careers</a></li>
</ul>`,
  },
  {
    title: 'Partner with Us',
    body: `<ul>
<li><a href="#">Builders and Developers</a></li>
<li><a href="#">Contractors and Plumbers</a></li>
<li><a href="#">Suppliers and Vendors</a></li>
<li><a href="#">Economic Development</a></li>
<li><a href="#">Emergency Responders</a></li>
<li><a href="#">Excavators</a></li>
</ul>`,
  },
  {
    title: 'Quick Links',
    body: `<ul>
<li><a href="#">Sign In</a></li>
<li><a href="#">Outages</a></li>
<li><a href="#">Ways to Pay</a></li>
<li><a href="#">Get Help Paying</a></li>
<li><a href="#">Mobile App</a></li>
<li><a href="#">Document Upload Form</a></li>
</ul>`,
  },
  {
    title: 'Need Help?',
    body: `<ul>
<li><a href="#">FAQs</a></li>
<li><a href="#">Cookie Preferences</a></li>
<li><a href="#">Contact Us</a></li>
<li><a href="tel:+18004647726">Call 1-800-464-7726</a></li>
</ul>`,
  },
  {
    title: 'Connect with Us',
    body: '',
  },
];

function defaultCopyright() {
  return `© ${new Date().getFullYear()} NIPSCO LLC`;
}

const DEFAULT_LEGAL = `<p>
<a href="#">Terms of Use</a>
<span aria-hidden="true"> · </span>
<a href="#">Privacy Notice</a>
<span aria-hidden="true"> · </span>
<a href="#">Accessibility Statement</a>
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
    if (name === 'copyright' || /-title$/.test(name)) {
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

function resolveColumn(index, cfg) {
  const slot = DEFAULT_COLUMNS[index];
  const authTitle = cfg[`column-${index + 1}-title`];
  const authBody = cfg[`column-${index + 1}-body`];
  const title = joinConfig(authTitle) || slot.title;
  const body = plainLength(authBody) > 0 ? joinConfig(authBody) : slot.body;
  return { title, body };
}

/**
 * loads and decorates the NiSource marketing footer (multi-column + subfooter).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cfg = readFooterConfig(block);

  const columns = DEFAULT_COLUMNS.map((_, i) => resolveColumn(i, cfg));

  const copyright = joinConfig(cfg.copyright) || defaultCopyright();
  const legal = plainLength(cfg.legal) > 0 ? joinConfig(cfg.legal) : DEFAULT_LEGAL;

  const inner = document.createElement('div');
  inner.className = 'nisource-footer__inner';

  const nav = document.createElement('nav');
  nav.className = 'nisource-footer__nav';
  nav.setAttribute('aria-label', 'Footer');

  columns.forEach(({ title, body }) => {
    const section = document.createElement('section');
    section.className = 'nisource-footer__column';

    const titleText = joinConfig(title);
    if (titleText) {
      const h = document.createElement('h3');
      h.className = 'nisource-footer__column-title';
      h.textContent = titleText;
      section.append(h);
    }

    const bodyHtml = joinConfig(body);
    if (bodyHtml) {
      const bodyEl = document.createElement('div');
      bodyEl.className = 'nisource-footer__column-body';
      bodyEl.innerHTML = bodyHtml;
      section.append(bodyEl);
    }

    nav.append(section);
  });

  inner.append(nav);

  const sub = document.createElement('div');
  sub.className = 'nisource-footer__subfooter';

  const p = document.createElement('p');
  p.className = 'nisource-footer__copyright';
  p.textContent = copyright;
  sub.append(p);

  const legalEl = document.createElement('div');
  legalEl.className = 'nisource-footer__legal';
  legalEl.innerHTML = legal;
  sub.append(legalEl);

  inner.append(sub);

  block.textContent = '';
  block.append(inner);
}

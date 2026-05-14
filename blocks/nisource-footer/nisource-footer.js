import { toClassName } from '../../scripts/aem.js';

/** Default "Connect" row: branded-color SVGs; authors replace hrefs in UE. */
const DEFAULT_SOCIAL_CONNECT_HTML = `<ul class="nisource-footer__social">
<li><a href="#" aria-label="Facebook"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="var(--nisource-social-facebook)" d="M9.101 23.691v-9.18H6.927v-3.947h2.174v-2.995c0-2.144 1.096-3.73 3.567-3.73h2.475v3.492H14.48c-.235 0-.564.117-.564.585v2.748h3.146l-.392 3.947h-2.754v9.18H9.101z"/></svg></a></li>
<li><a href="#" aria-label="Instagram"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><defs><linearGradient id="nisource-footer-ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="var(--nisource-social-instagram-a)"/><stop offset="50%" stop-color="var(--nisource-social-instagram-b)"/><stop offset="100%" stop-color="var(--nisource-social-instagram-c)"/></linearGradient></defs><path fill="url(#nisource-footer-ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.35 3.608 1.327.975.975 1.265 2.242 1.327 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.35 2.633-1.327 3.608-.975.975-2.242 1.265-3.608 1.327-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.35-3.608-1.327-.975-.975-1.265-2.242-1.327-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.35-2.633 1.327-3.608.975-.975 2.242-1.265 3.608-1.327 1.266-.058 1.646-.07 4.85-.07zm0-2.163C8.741 0 8.332.013 7.052.072 5.197.157 3.778.45 2.678 1.55 1.578 2.65 1.285 4.07 1.2 5.925 1.14 7.204 1.127 7.615 1.127 12c0 4.385.013 4.796.072 6.075.085 1.855.378 3.275 1.478 4.375 1.1 1.1 2.519 1.393 4.375 1.478 1.279.059 1.688.072 6.075.072 4.387 0 4.796-.013 6.075-.072 1.855-.085 3.275-.378 4.375-1.478 1.1-1.1 1.393-2.519 1.478-4.375.059-1.279.072-1.688.072-6.075 0-4.387-.013-4.796-.072-6.075-.085-1.855-.378-3.275-1.478-4.375-1.1-1.1-2.519-1.393-4.375-1.478C16.796.013 16.385 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg></a></li>
<li><a href="#" aria-label="X"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="var(--nisource-social-x)" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a></li>
<li><a href="#" aria-label="LinkedIn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="var(--nisource-social-linkedin)" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.07 2.07 0 1 1 0 4.14 2.07 2.07 0 0 1 0-4.14zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg></a></li>
</ul>`;

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
    body: DEFAULT_SOCIAL_CONNECT_HTML,
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

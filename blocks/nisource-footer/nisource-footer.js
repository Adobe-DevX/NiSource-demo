import { toClassName } from '../../scripts/aem.js';

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

function hasColumnContent(title, body) {
  return joinConfig(title).length > 0 || plainLength(body) > 0;
}

/**
 * loads and decorates the NiSource marketing footer (multi-column + subfooter).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cfg = readFooterConfig(block);

  const columns = [];
  for (let i = 1; i <= 5; i += 1) {
    const title = cfg[`column-${i}-title`];
    const body = cfg[`column-${i}-body`];
    if (hasColumnContent(title, body)) {
      columns.push({ title, body });
    }
  }

  const copyright = joinConfig(cfg.copyright);
  const legal = joinConfig(cfg.legal);
  const hasSubfooter = copyright.length > 0 || plainLength(cfg.legal) > 0;

  const inner = document.createElement('div');
  inner.className = 'nisource-footer__inner';

  if (columns.length > 0) {
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
  }

  if (hasSubfooter) {
    const sub = document.createElement('div');
    sub.className = 'nisource-footer__subfooter';

    if (copyright) {
      const p = document.createElement('p');
      p.className = 'nisource-footer__copyright';
      p.textContent = copyright;
      sub.append(p);
    }

    if (legal) {
      const legalEl = document.createElement('div');
      legalEl.className = 'nisource-footer__legal';
      legalEl.innerHTML = legal;
      sub.append(legalEl);
    }

    inner.append(sub);
  }

  block.textContent = '';
  block.append(inner);
}

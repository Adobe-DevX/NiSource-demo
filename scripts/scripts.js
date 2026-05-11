import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';
import {
  loadCommerceEager,
  loadCommerceLazy,
  initializeCommerce,
  applyTemplates,
  decorateLinks,
  loadErrorPage,
} from './commerce.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: Auto blocking not supported by crosswalk
    // buildHeroBlock(main);
  } catch (error) {
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Restructure `.section.two-column` so each visual column is an independent
 * flex stack. By default CSS Grid couples row heights across columns, which
 * causes uneven vertical gaps when one column has a taller block. Splitting
 * the children into two flex containers makes each column flow independently
 * with a unified gap.
 *
 * Placement rules per wrapper:
 *   - block has `place-left`   → left column
 *   - block has `place-right`  → right column
 *   - otherwise                → alternating (1st unplaced left, 2nd right, …)
 *
 * @param {Element} main The main element
 */
function decorateTwoColumnSections(main) {
  main.querySelectorAll('.section.two-column').forEach((section) => {
    if (section.querySelector(':scope > .two-column__col')) return;

    const wrappers = [...section.children];
    if (!wrappers.length) return;

    const leftColumn = document.createElement('div');
    leftColumn.className = 'two-column__col two-column__col--left';
    const rightColumn = document.createElement('div');
    rightColumn.className = 'two-column__col two-column__col--right';

    let unplacedIndex = 0;
    wrappers.forEach((wrapper) => {
      if (wrapper.querySelector(':scope > .place-right')) {
        rightColumn.append(wrapper);
      } else if (wrapper.querySelector(':scope > .place-left')) {
        leftColumn.append(wrapper);
      } else if (unplacedIndex % 2 === 0) {
        leftColumn.append(wrapper);
        unplacedIndex += 1;
      } else {
        rightColumn.append(wrapper);
        unplacedIndex += 1;
      }
    });

    section.replaceChildren(leftColumn, rightColumn);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  decorateLinks(main);
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateTwoColumnSections(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();

  const main = doc.querySelector('main');
  if (main) {
    try {
      await initializeCommerce();
      decorateMain(main);
      applyTemplates(doc);
      await loadCommerceEager();
    } catch (e) {
      console.error('Error initializing commerce configuration:', e);
      loadErrorPage(418);
    }
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCommerceLazy();

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

(async function loadDa() {
  if (!new URL(window.location.href).searchParams.get('dapreview')) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());

/**
 * Checks if experimentation is enabled.
 * @returns {boolean} True if experimentation is enabled, false otherwise.
 */
const isExperimentationEnabled = () => Boolean(
  document.head.querySelector('[name^="experiment"],[name^="campaign-"],[name^="audience-"],[property^="campaign:"],[property^="audience:"]')
    || [...document.querySelectorAll('.section-metadata div')].some((d) => d.textContent.match(/Experiment|Campaign|Audience/i)),
);

/**
 * Loads the experimentation module (eager).
 * @param {Document} doc The document object.
 * @param {object} config Plugin configuration.
 * @returns {Promise<void>}
 */
export async function runExperimentation(doc, config) {
  if (!isExperimentationEnabled()) {
    window.addEventListener('message', async (event) => {
      if (event.data?.type === 'hlx:experimentation-get-config') {
        event.source.postMessage({
          type: 'hlx:experimentation-config',
          config: { experiments: [], audiences: [], campaigns: [] },
          source: 'no-experiments',
        }, '*');
      }
    });
    return null;
  }

  try {
    const { loadEager } = await import(
      /* webpackIgnore: true */
      '../plugins/experimentation/src/index.js'
    );
    return loadEager(doc, config);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation module (eager):', error);
    return null;
  }
}

/**
 * Loads the experimentation module (lazy).
 * @param {Document} doc The document object.
 * @param {object} config Plugin configuration.
 * @returns {Promise<void>}
 */
export async function showExperimentationRail(doc, config) {
  if (!isExperimentationEnabled()) {
    return null;
  }

  try {
    const { loadLazy } = await import(
      /* webpackIgnore: true */
      '../plugins/experimentation/src/index.js'
    );
    await loadLazy(doc, config);

    const loadSidekickHandler = () => import('../tools/sidekick/aem-experimentation.js');

    if (doc.querySelector('helix-sidekick, aem-sidekick')) {
      try {
        await loadSidekickHandler();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Sidekick experimentation bridge failed to load:', e);
      }
    } else {
      await new Promise((resolve) => {
        doc.addEventListener(
          'sidekick-ready',
          () => {
            loadSidekickHandler().catch((e) => {
              // eslint-disable-next-line no-console
              console.warn('Sidekick experimentation bridge failed to load:', e);
            }).finally(resolve);
          },
          { once: true },
        );
      });
    }

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation module (lazy):', error);
    return null;
  }
}

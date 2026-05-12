import { loadScript, getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/eds-support.js';

let dmViewerPromise;

async function resolveViewerScriptUrl() {
  const ph = await fetchPlaceholders();
  const fromPh = ph.dmVideoViewerUrl?.trim();
  const fromMeta = getMetadata('dm-video-viewer-url')?.trim();
  return fromPh || fromMeta || '';
}

/**
 * @param {number} timeout
 */
function waitForDMViewer(timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (window.dmviewers?.VideoViewer) {
      resolve(true);
      return;
    }
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (window.dmviewers?.VideoViewer) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('DM VideoViewer failed to load within timeout'));
      }
    }, 100);
  });
}

async function loadDMVideoViewer() {
  if (!dmViewerPromise) {
    dmViewerPromise = (async () => {
      const src = await resolveViewerScriptUrl();
      if (!src) {
        throw new Error('Missing DM viewer script: set dmVideoViewerUrl in placeholders.json or dm-video-viewer-url metadata.');
      }
      await loadScript(src);
      await waitForDMViewer();
    })();
  }
  return dmViewerPromise;
}

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  try {
    await loadDMVideoViewer();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load DM VideoViewer:', error);
    return;
  }

  if (!window.dmviewers?.VideoViewer) {
    // eslint-disable-next-line no-console
    console.error('DM VideoViewer not available on window.dmviewers');
    return;
  }

  const videolinks = block.querySelectorAll('a[href]');
  if (videolinks.length === 0) {
    Array.from(block.children).forEach((child) => {
      // eslint-disable-next-line no-param-reassign
      child.style.display = 'none';
    });
    return;
  }

  const videoUrl = videolinks[0].href;
  const urnPattern = /(\/adobe\/assets\/urn:[^/]+)/i;
  const match = videoUrl.match(urnPattern);
  if (!match) {
    // eslint-disable-next-line no-console
    console.error('Invalid Dynamic Media video URL format');
    return;
  }

  const videoURLObj = new URL(videoUrl);
  const baseUrl = `${videoURLObj.protocol}//${videoURLObj.hostname}`;
  const assetIdPath = match[1];
  const posterImageUrl = `${baseUrl}${assetIdPath}/as/thumbnail.jpeg?preferwebp=true`;
  const dashUrl = `${baseUrl}${assetIdPath}/manifest.mpd`;
  const hlsUrl = `${baseUrl}${assetIdPath}/manifest.m3u8`;

  block.id = `dm-video-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const params = {
    posterimage: posterImageUrl,
    sources: {},
  };
  if (dashUrl) params.sources.DASH = dashUrl;
  if (hlsUrl) params.sources.HLS = hlsUrl;

  const children = Array.from(block.children);
  const getTextFromChild = (index) => {
    const childDiv = children[index];
    if (!childDiv) return '';
    const pElement = childDiv.querySelector('p');
    return pElement?.textContent?.trim() || '';
  };

  const autoplay = getTextFromChild(1)?.toLowerCase() === 'true';
  const loop = getTextFromChild(2)?.toLowerCase() === 'true';
  const muted = getTextFromChild(3)?.toLowerCase() === 'true';

  Array.from(block.children).forEach((child) => {
    // eslint-disable-next-line no-param-reassign
    child.style.display = 'none';
  });

  if (autoplay) params.autoplay = '1';
  if (loop) params.loop = '1';
  if (muted) params.muted = '1';

  const s7videoviewer = new window.dmviewers.VideoViewer({
    containerId: block.id,
    params,
  });
  s7videoviewer.init();
}

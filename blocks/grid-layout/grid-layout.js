import { decorateBlock, loadBlock, toClassName } from '../../scripts/aem.js';

const NON_BLOCK_MODELS = new Set([
  'text',
  'image',
  'button',
  'title',
  'section',
  'columns-section',
  'columns',
  'grid-layout',
  'column',
  'card',
]);

let keyValueModelsPromise;

async function getKeyValueModels() {
  if (!keyValueModelsPromise) {
    keyValueModelsPromise = fetch(`${window.hlx.codeBasePath}/component-models.json`)
      .then((response) => response.json())
      .then((models) => models
        .map((model) => ({
          id: model.id,
          fields: (model.fields || []).map((field) => toClassName(field.name)).filter(Boolean),
        }))
        .filter((model) => model.fields.length > 0)
        .filter((model) => !model.id.endsWith('-metadata'))
        .filter((model) => !NON_BLOCK_MODELS.has(model.id)));
  }

  return keyValueModelsPromise;
}

function extractKeyValuePairs(container) {
  const paragraphs = [...container.querySelectorAll(':scope > p')];
  if (paragraphs.length < 4 || paragraphs.length % 2 !== 0) return null;

  const pairs = [];
  for (let i = 0; i < paragraphs.length; i += 2) {
    const key = toClassName(paragraphs[i].textContent?.trim());
    if (!key) return null;

    pairs.push({
      key,
      valueMarkup: paragraphs[i + 1].innerHTML,
    });
  }

  return pairs;
}

function inferModelId(pairs, models) {
  const keys = pairs.map((pair) => pair.key);
  const candidates = models.filter((model) => keys.every((key) => model.fields.includes(key)));
  if (!candidates.length) return null;

  candidates.sort((a, b) => a.fields.length - b.fields.length);
  return candidates[0].id;
}

function buildNestedBlock(modelId, pairs) {
  const nestedBlock = document.createElement('div');
  nestedBlock.className = modelId;

  pairs.forEach(({ key, valueMarkup }) => {
    const row = document.createElement('div');
    const keyCell = document.createElement('div');
    const valueCell = document.createElement('div');
    keyCell.textContent = key;
    valueCell.innerHTML = valueMarkup;
    row.append(keyCell, valueCell);
    nestedBlock.append(row);
  });

  return nestedBlock;
}

export default async function decorate(block) {
  const firstRowColumns = block.firstElementChild ? [...block.firstElementChild.children] : [];
  const colCount = firstRowColumns.length || 1;
  block.classList.add(`grid-layout-${colCount}-cols`);

  const nestedBlocks = [];
  const keyValueModels = await getKeyValueModels();

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      [...cell.children].forEach((child) => {
        if (!child.className) {
          const pairs = extractKeyValuePairs(child);
          if (pairs) {
            const modelId = inferModelId(pairs, keyValueModels);
            if (modelId) {
              child.replaceWith(buildNestedBlock(modelId, pairs));
            }
          }
        }
      });

      [...cell.children].forEach((child) => {
        decorateBlock(child);
        if (child.classList.contains('block')) {
          nestedBlocks.push(child);
        }
      });
    });
  });

  const uniqueNestedBlocks = [...new Set(nestedBlocks)];
  for (let i = 0; i < uniqueNestedBlocks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadBlock(uniqueNestedBlocks[i]);
  }
}

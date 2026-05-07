import { decorateBlock, loadBlock } from '../../scripts/aem.js';

const BILL_CARD_FIELDS = new Set([
  'eyebrow',
  'bill-label',
  'amount-due',
  'bill-cta-label',
  'bill-cta-link',
]);

function normalizeNestedBlock(blockElement) {
  if (blockElement.classList[0] !== 'bill-card') {
    const otherClasses = [...blockElement.classList].filter((className) => className !== 'bill-card');
    blockElement.className = `bill-card ${otherClasses.join(' ')}`.trim();
  }
}

function convertBillCardPairsToBlock(container) {
  const items = [...container.querySelectorAll(':scope > p')];
  if (items.length < 6 || items.length % 2 !== 0) return null;

  const pairs = [];
  for (let i = 0; i < items.length; i += 2) {
    const key = items[i].textContent?.trim().toLowerCase();
    if (!BILL_CARD_FIELDS.has(key)) return null;

    pairs.push({
      key,
      valueMarkup: items[i + 1].innerHTML,
    });
  }

  const hasRequiredFields = pairs.some((item) => item.key === 'bill-label')
    && pairs.some((item) => item.key === 'amount-due')
    && pairs.some((item) => item.key === 'bill-cta-label');

  if (!hasRequiredFields) return null;

  const billCardBlock = document.createElement('div');
  billCardBlock.className = 'bill-card';

  pairs.forEach(({ key, valueMarkup }) => {
    const row = document.createElement('div');
    const keyCell = document.createElement('div');
    const valueCell = document.createElement('div');
    keyCell.textContent = key;
    valueCell.innerHTML = valueMarkup;
    row.append(keyCell, valueCell);
    billCardBlock.append(row);
  });

  return billCardBlock;
}

export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  const nestedBlocks = [];

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      [...col.children].forEach((child) => {
        if (!child.classList.contains('bill-card')) {
          const syntheticBillCard = convertBillCardPairsToBlock(child);
          if (syntheticBillCard) {
            child.replaceWith(syntheticBillCard);
          }
        }
      });

      [...col.children].forEach((child) => {
        decorateBlock(child);
        if (child.classList.contains('block')) {
          nestedBlocks.push(child);
        }
      });

      // Fallback for nested Bill Card blocks in column content.
      col.querySelectorAll('.bill-card').forEach((billCardBlock) => {
        normalizeNestedBlock(billCardBlock);

        if (!billCardBlock.classList.contains('block')) {
          decorateBlock(billCardBlock);
        }

        if (billCardBlock.classList.contains('block')) {
          nestedBlocks.push(billCardBlock);
        }
      });

      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  const uniqueNestedBlocks = [...new Set(nestedBlocks)];

  for (let i = 0; i < uniqueNestedBlocks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadBlock(uniqueNestedBlocks[i]);
  }
}

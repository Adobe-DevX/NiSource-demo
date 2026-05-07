import { decorateBlock, loadBlock } from '../../scripts/aem.js';

export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  const nestedBlocks = [];

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      [...col.children].forEach((child) => {
        decorateBlock(child);
        if (child.classList.contains('block')) {
          nestedBlocks.push(child);
        }
      });

      // Fallback for nested Bill Card blocks in column content.
      col.querySelectorAll('.bill-card').forEach((billCardBlock) => {
        if (billCardBlock.classList[0] !== 'bill-card') {
          const otherClasses = [...billCardBlock.classList].filter((className) => className !== 'bill-card');
          billCardBlock.className = `bill-card ${otherClasses.join(' ')}`.trim();
        }

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

import { decorateBlock, loadBlock } from '../../scripts/aem.js';

export default async function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const cells = [...row.children];
  if (cells.length < 2) return;

  const [leftCell, rightCell] = cells;
  leftCell.classList.add('two-column__left');
  rightCell.classList.add('two-column__right');

  const nestedBlocks = [];
  cells.forEach((cell) => {
    [...cell.children].forEach((child) => {
      decorateBlock(child);
      if (child.classList.contains('block')) {
        nestedBlocks.push(child);
      }
    });
  });

  block.replaceChildren(leftCell, rightCell);

  for (let i = 0; i < nestedBlocks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadBlock(nestedBlocks[i]);
  }
}

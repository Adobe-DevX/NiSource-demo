import { decorateBlock, loadBlock } from '../../scripts/aem.js';

const BILL_CARD_DEFAULTS = [
  ['eyebrow', 'Billing & Payment Options'],
  ['bill-label', 'Total Amount Due'],
  ['amount-due', '$127.35'],
  ['bill-cta-label', 'Pay Bill'],
  ['bill-cta-link', '/billing-payment'],
];

function buildBillCard() {
  const billCard = document.createElement('div');
  billCard.className = 'bill-card';

  BILL_CARD_DEFAULTS.forEach(([key, value]) => {
    const row = document.createElement('div');
    const keyCell = document.createElement('div');
    const valueCell = document.createElement('div');
    keyCell.textContent = key;

    if (key === 'bill-cta-link') {
      const link = document.createElement('a');
      link.href = value;
      link.textContent = value;
      valueCell.append(link);
    } else {
      valueCell.textContent = value;
    }

    row.append(keyCell, valueCell);
    billCard.append(row);
  });

  return billCard;
}

export default async function decorate(block) {
  const rows = [...block.children];

  if (rows.length < 2) return;

  block.classList.add('two-column');

  const left = document.createElement('div');
  left.className = 'two-column__left';
  const right = document.createElement('div');
  right.className = 'two-column__right';

  const billCardWrapper = document.createElement('div');
  const billCard = buildBillCard();
  billCardWrapper.append(billCard);

  left.append(billCardWrapper);
  left.append(...rows[0].childNodes);
  right.append(...rows[1].childNodes);

  block.replaceChildren(left, right);

  decorateBlock(billCard);
  await loadBlock(billCard);
}

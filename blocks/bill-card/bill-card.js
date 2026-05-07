import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULTS = {
  eyebrow: 'Billing & Payment Options',
  'bill-label': 'Total Amount Due',
  'amount-due': '$127.35',
  'bill-cta-label': 'Pay Bill',
};

function toText(value, fallback) {
  if (Array.isArray(value)) {
    return value.join(' ').trim() || fallback;
  }

  return value || fallback;
}

function normalizeConfig(config) {
  return {
    eyebrow: toText(config.eyebrow),
    billLabel: toText(config['bill-label'], DEFAULTS['bill-label']),
    amountDue: toText(config['amount-due'], DEFAULTS['amount-due']),
    billCtaLabel: toText(config['bill-cta-label'], DEFAULTS['bill-cta-label']),
    billCtaLink: config['bill-cta-link'],
  };
}

function createButton(label, link) {
  const button = document.createElement('a');
  button.className = 'button';
  button.textContent = label;
  button.href = link || '#';

  if (!link) {
    button.setAttribute('aria-disabled', 'true');
    button.classList.add('disabled');
    button.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }

  return button;
}

export default function decorate(block) {
  const config = normalizeConfig(readBlockConfig(block));

  const wrapper = document.createElement('div');
  wrapper.className = 'bill-card__wrapper';

  const topBar = document.createElement('div');
  topBar.className = 'bill-card__top';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'bill-card__eyebrow';
  eyebrow.textContent = config.eyebrow;

  topBar.append(eyebrow);

  const billCard = document.createElement('div');
  billCard.className = 'bill-card__bill-card';

  const billMeta = document.createElement('div');
  billMeta.className = 'bill-card__bill-meta';

  const billLabel = document.createElement('p');
  billLabel.className = 'bill-card__bill-label';
  billLabel.textContent = config.billLabel;

  const billAmount = document.createElement('p');
  billAmount.className = 'bill-card__bill-amount';
  billAmount.textContent = config.amountDue;

  billMeta.append(billLabel, billAmount);
  billCard.append(billMeta, createButton(config.billCtaLabel, config.billCtaLink));

  wrapper.append(topBar, billCard);

  block.replaceChildren(wrapper);
}

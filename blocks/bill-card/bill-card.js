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

function toMarkup(value, fallback = '') {
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
    highBillAlertTitle: toText(config['high-bill-alert-title'], ''),
    highBillAlertMessage: toText(config['high-bill-alert-message'], ''),
    highBillAlertCtaLabel: toText(config['high-bill-alert-cta-label'], ''),
    highBillAlertCtaLink: config['high-bill-alert-cta-link'],
    content: toMarkup(config.content),
  };
}

function hasHighBillAlert(config) {
  return [config.highBillAlertTitle, config.highBillAlertMessage, config.highBillAlertCtaLabel]
    .some((value) => String(value || '').trim());
}

function createAlertCta(label, link) {
  const text = String(label || '').trim();
  if (!text) {
    return null;
  }

  if (link) {
    const anchor = document.createElement('a');
    anchor.className = 'bill-card__high-bill-alert-cta';
    anchor.href = link;
    anchor.textContent = text;
    return anchor;
  }

  const span = document.createElement('span');
  span.className = 'bill-card__high-bill-alert-cta bill-card__high-bill-alert-cta--disabled';
  span.textContent = text;
  span.setAttribute('aria-disabled', 'true');
  return span;
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

  const billRow = document.createElement('div');
  billRow.className = 'bill-card__bill-row';

  const billMeta = document.createElement('div');
  billMeta.className = 'bill-card__bill-meta';

  const billLabel = document.createElement('p');
  billLabel.className = 'bill-card__bill-label';
  billLabel.textContent = config.billLabel;

  const billAmount = document.createElement('p');
  billAmount.className = 'bill-card__bill-amount';
  billAmount.textContent = config.amountDue;

  billMeta.append(billLabel, billAmount);
  billRow.append(billMeta, createButton(config.billCtaLabel, config.billCtaLink));
  billCard.append(billRow);

  if (hasHighBillAlert(config)) {
    const alert = document.createElement('div');
    alert.className = 'bill-card__high-bill-alert';
    alert.setAttribute('role', 'region');
    alert.setAttribute('aria-label', config.highBillAlertTitle.trim() || config.highBillAlertMessage.trim() || 'High bill alert');

    const title = document.createElement('p');
    title.className = 'bill-card__high-bill-alert-title';
    title.textContent = config.highBillAlertTitle;

    const message = document.createElement('p');
    message.className = 'bill-card__high-bill-alert-message';
    message.textContent = config.highBillAlertMessage;

    const cta = createAlertCta(config.highBillAlertCtaLabel, config.highBillAlertCtaLink);
    if (config.highBillAlertTitle.trim()) {
      alert.append(title);
    }
    if (config.highBillAlertMessage.trim()) {
      alert.append(message);
    }
    if (cta) {
      alert.append(cta);
    }
    billCard.append(alert);
  }

  wrapper.append(topBar, billCard);

  const contentPlain = (config.content || '').replace(/<[^>]*>/g, '').trim();
  if (contentPlain) {
    const contentSection = document.createElement('div');
    contentSection.className = 'bill-card__content';
    contentSection.innerHTML = config.content;
    wrapper.append(contentSection);
  }

  block.replaceChildren(wrapper);
}

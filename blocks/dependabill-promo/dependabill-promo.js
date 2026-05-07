import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULTS = {
  eyebrow: 'Billing & Payment Options',
  greeting: 'Hello Bowen!',
  'bill-label': 'Total Amount Due',
  'amount-due': '$127.35',
  'bill-cta-label': 'Pay Bill',
  headline: 'Want certainty on your monthly gas bill?',
  description: 'DependABill is our billing program that helps you avoid surprises with a guaranteed fixed monthly gas bill for 12 months with no true-ups or adjustments. Get your personalized monthly cost today.',
  'cta-label': 'Take control',
};

function toText(value, fallback) {
  if (Array.isArray(value)) {
    return value.join(' ').trim() || fallback;
  }

  return value || fallback;
}

function normalizeConfig(config) {
  return {
    eyebrow: toText(config.eyebrow, DEFAULTS.eyebrow),
    greeting: toText(config.greeting, DEFAULTS.greeting),
    billLabel: toText(config['bill-label'], DEFAULTS['bill-label']),
    amountDue: toText(config['amount-due'], DEFAULTS['amount-due']),
    billCtaLabel: toText(config['bill-cta-label'], DEFAULTS['bill-cta-label']),
    billCtaLink: config['bill-cta-link'],
    headline: toText(config.headline, DEFAULTS.headline),
    description: toText(config.description, DEFAULTS.description),
    ctaLabel: toText(config['cta-label'], DEFAULTS['cta-label']),
    ctaLink: config['cta-link'],
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
  wrapper.className = 'dependabill-promo__wrapper';

  const topBar = document.createElement('div');
  topBar.className = 'dependabill-promo__top';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'dependabill-promo__eyebrow';
  eyebrow.textContent = config.eyebrow;

  const greeting = document.createElement('p');
  greeting.className = 'dependabill-promo__greeting';
  greeting.textContent = config.greeting;

  topBar.append(eyebrow, greeting);

  const billCard = document.createElement('div');
  billCard.className = 'dependabill-promo__bill-card';

  const billMeta = document.createElement('div');
  billMeta.className = 'dependabill-promo__bill-meta';

  const billLabel = document.createElement('p');
  billLabel.className = 'dependabill-promo__bill-label';
  billLabel.textContent = config.billLabel;

  const billAmount = document.createElement('p');
  billAmount.className = 'dependabill-promo__bill-amount';
  billAmount.textContent = config.amountDue;

  billMeta.append(billLabel, billAmount);
  billCard.append(billMeta, createButton(config.billCtaLabel, config.billCtaLink));

  const content = document.createElement('div');
  content.className = 'dependabill-promo__content';

  const headline = document.createElement('h2');
  headline.textContent = config.headline;

  const description = document.createElement('p');
  description.textContent = config.description;

  const actionContainer = document.createElement('p');
  actionContainer.className = 'dependabill-promo__action';
  actionContainer.append(createButton(config.ctaLabel, config.ctaLink));

  content.append(headline, description, actionContainer);
  wrapper.append(topBar, billCard, content);

  block.replaceChildren(wrapper);
}

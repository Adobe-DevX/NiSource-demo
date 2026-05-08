import { loadCSS, readBlockConfig } from '../../scripts/aem.js';

const FONT_AWESOME_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';

const DEFAULTS = {
  'left-icon': 'fa-house',
  greeting: 'Hi Customer !',
  'account-label': 'Account#',
  'account-number': '753534557000',
  'choice-label': 'Electric Choice ID',
  'choice-number': '984302709',
  'amount-label': 'AMOUNT DUE',
  'amount-value': '$243.56',
  'options-address': '932 Apple St # Z Frostburg...',
  'options-link-label': 'Account Options',
};

function toText(value, fallback = '') {
  if (Array.isArray(value)) {
    return value.join(' ').trim() || fallback;
  }

  return value || fallback;
}

function createFaIcon(classValue, fallbackClass = 'fa-house') {
  const classes = (classValue || fallbackClass)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!classes.length) return null;

  const icon = document.createElement('i');
  const hasStyleClass = classes.some((cls) => /^fa-(solid|regular|brands|light|thin|duotone)$/.test(cls));
  const hasIconClass = classes.some((cls) => cls.startsWith('fa-') && !/^fa-(solid|regular|brands|light|thin|duotone)$/.test(cls));

  const finalClasses = classes.filter((cls) => cls.startsWith('fa-'));
  if (!hasStyleClass) finalClasses.unshift('fa-solid');
  if (!hasIconClass) {
    finalClasses.push(classes[0].startsWith('fa-') ? classes[0] : `fa-${classes[0]}`);
  }

  icon.className = finalClasses.join(' ');
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function createActionCard({ eyebrow, value, linkLabel, link, iconClass }) {
  const card = document.createElement(link ? 'a' : 'div');
  card.className = 'account-information__card';
  if (link) {
    card.href = link;
  }

  const copy = document.createElement('div');
  copy.className = 'account-information__card-copy';

  if (eyebrow) {
    const eyebrowEl = document.createElement('p');
    eyebrowEl.className = 'account-information__card-eyebrow';
    eyebrowEl.textContent = eyebrow;
    copy.append(eyebrowEl);
  }

  if (value) {
    const valueEl = document.createElement('p');
    valueEl.className = 'account-information__card-value';
    valueEl.textContent = value;
    copy.append(valueEl);
  }

  if (linkLabel) {
    const linkLabelEl = document.createElement('p');
    linkLabelEl.className = 'account-information__card-link';
    linkLabelEl.textContent = linkLabel;
    copy.append(linkLabelEl);
  }

  const trailing = document.createElement('span');
  trailing.className = 'account-information__card-icon';
  const faIcon = createFaIcon(iconClass, 'fa-angle-right');
  if (faIcon) trailing.append(faIcon);

  card.append(copy, trailing);
  return card;
}

export default async function decorate(block) {
  try {
    await loadCSS(FONT_AWESOME_CSS);
  } catch (error) {
    // Continue rendering with text-only fallbacks if external CSS is unavailable.
  }

  const config = readBlockConfig(block);
  const data = {
    leftIcon: toText(config['left-icon'], DEFAULTS['left-icon']),
    greeting: toText(config.greeting, DEFAULTS.greeting),
    accountLabel: toText(config['account-label'], DEFAULTS['account-label']),
    accountNumber: toText(config['account-number'], DEFAULTS['account-number']),
    choiceLabel: toText(config['choice-label'], DEFAULTS['choice-label']),
    choiceNumber: toText(config['choice-number'], DEFAULTS['choice-number']),
    amountLabel: toText(config['amount-label'], DEFAULTS['amount-label']),
    amountValue: toText(config['amount-value'], DEFAULTS['amount-value']),
    amountLink: config['amount-link'],
    optionsAddress: toText(config['options-address'], DEFAULTS['options-address']),
    optionsLinkLabel: toText(config['options-link-label'], DEFAULTS['options-link-label']),
    optionsLink: config['options-link'],
  };

  const wrapper = document.createElement('div');
  wrapper.className = 'account-information__wrapper';

  const profile = document.createElement('div');
  profile.className = 'account-information__profile';

  const iconBox = document.createElement('span');
  iconBox.className = 'account-information__icon-box';
  const profileIcon = createFaIcon(data.leftIcon, 'fa-house');
  if (profileIcon) iconBox.append(profileIcon);

  const profileText = document.createElement('div');
  profileText.className = 'account-information__profile-text';

  const greeting = document.createElement('p');
  greeting.className = 'account-information__greeting';
  greeting.textContent = data.greeting;

  const account = document.createElement('p');
  account.className = 'account-information__meta';
  account.innerHTML = `<strong>${data.accountLabel}</strong> ${data.accountNumber}`;

  const choice = document.createElement('p');
  choice.className = 'account-information__meta';
  choice.innerHTML = `<strong>${data.choiceLabel}</strong> ${data.choiceNumber}`;

  profileText.append(greeting, account, choice);
  profile.append(iconBox, profileText);

  const actions = document.createElement('div');
  actions.className = 'account-information__actions';

  const amountCard = createActionCard({
    eyebrow: data.amountLabel,
    value: data.amountValue,
    link: data.amountLink,
    iconClass: 'fa-angle-right',
  });

  const optionsCard = createActionCard({
    value: data.optionsAddress,
    linkLabel: data.optionsLinkLabel,
    link: data.optionsLink,
    iconClass: 'fa-angle-down',
  });

  actions.append(amountCard, optionsCard);
  wrapper.append(profile, actions);
  block.replaceChildren(wrapper);
}

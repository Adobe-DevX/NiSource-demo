import { loadCSS, readBlockConfig } from '../../scripts/aem.js';

const DEFAULTS = {
  heading: 'Billing and Payment Options',
  'heading-icon': '',
  'left-top-label': 'Enroll in <strong>AutoPay</strong>',
  'left-top-status': 'currency',
  'left-bottom-label': 'Manage <strong>My Wallet</strong>',
  'right-top-label': 'Enrolled in <strong>eBill</strong>',
  'right-top-status': 'check',
  'right-bottom-label': 'Enroll in <strong>Budget Bill</strong>',
};
const FONT_AWESOME_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';

function toMarkup(value, fallback = '') {
  if (Array.isArray(value)) {
    return value.join(' ').trim() || fallback;
  }

  return value || fallback;
}

function createStatusIcon(type) {
  const normalizedType = (type || '').toLowerCase().trim();

  if (normalizedType === 'check') {
    const status = document.createElement('span');
    status.className = 'billing-payment__status';
    status.setAttribute('aria-hidden', 'true');
    status.classList.add('billing-payment__status--check');
    status.textContent = '✓';
    return status;
  }

  return null;
}

function createHeadingIcon(iconValue) {
  const normalized = (iconValue || '').trim();
  if (!normalized) return null;

  const icon = document.createElement('span');
  icon.className = 'billing-payment__heading-icon';
  icon.setAttribute('aria-hidden', 'true');
  const fontAwesomeIcon = document.createElement('i');

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const hasStyleToken = tokens.some((token) => /^fa-(solid|regular|brands|light|thin|duotone)$/.test(token));
  const hasIconToken = tokens.some((token) => token.startsWith('fa-') && !/^fa-(solid|regular|brands|light|thin|duotone)$/.test(token));

  const classes = tokens.filter((token) => token.startsWith('fa-'));

  if (!hasStyleToken) {
    classes.unshift('fa-solid');
  }

  if (!hasIconToken) {
    classes.push(tokens[0].startsWith('fa-') ? tokens[0] : `fa-${tokens[0]}`);
  }

  fontAwesomeIcon.className = classes.join(' ');
  icon.append(fontAwesomeIcon);
  return icon;
}

function createHelpLink(link) {
  const help = document.createElement('a');
  help.className = 'billing-payment__help';
  help.href = link || '#';
  help.textContent = '?';
  help.setAttribute('aria-label', 'More information');

  if (!link) {
    help.classList.add('disabled');
    help.setAttribute('aria-disabled', 'true');
    help.addEventListener('click', (event) => event.preventDefault());
  }

  return help;
}

function createActionItem({
  label,
  link,
  helpLink,
  status,
}) {
  const item = document.createElement('div');
  item.className = 'billing-payment__item';

  const statusIcon = createStatusIcon(status);
  if (!statusIcon) {
    item.classList.add('billing-payment__item--without-status');
  }

  const action = link ? document.createElement('a') : document.createElement('span');
  action.className = 'billing-payment__action';
  action.innerHTML = label;

  if (link) {
    action.href = link;
  } else {
    action.classList.add('disabled');
  }

  if (statusIcon) {
    item.append(statusIcon);
  }

  item.append(action, createHelpLink(helpLink));
  return item;
}

function normalizeConfig(config) {
  return {
    heading: toMarkup(config.heading, DEFAULTS.heading),
    headingIcon: toMarkup(config['heading-icon'], DEFAULTS['heading-icon']),
    leftTopLabel: toMarkup(config['left-top-label'], DEFAULTS['left-top-label']),
    leftTopLink: config['left-top-link'],
    leftTopHelpLink: config['left-top-help-link'],
    leftTopStatus: toMarkup(config['left-top-status'], DEFAULTS['left-top-status']),
    leftBottomLabel: toMarkup(config['left-bottom-label'], DEFAULTS['left-bottom-label']),
    leftBottomLink: config['left-bottom-link'],
    leftBottomHelpLink: config['left-bottom-help-link'],
    leftBottomStatus: toMarkup(config['left-bottom-status']),
    rightTopLabel: toMarkup(config['right-top-label'], DEFAULTS['right-top-label']),
    rightTopLink: config['right-top-link'],
    rightTopHelpLink: config['right-top-help-link'],
    rightTopStatus: toMarkup(config['right-top-status'], DEFAULTS['right-top-status']),
    rightBottomLabel: toMarkup(config['right-bottom-label'], DEFAULTS['right-bottom-label']),
    rightBottomLink: config['right-bottom-link'],
    rightBottomHelpLink: config['right-bottom-help-link'],
    rightBottomStatus: toMarkup(config['right-bottom-status']),
  };
}

function buildColumn(items) {
  const column = document.createElement('div');
  column.className = 'billing-payment__column';
  items.forEach((itemConfig) => column.append(createActionItem(itemConfig)));
  return column;
}

export default async function decorate(block) {
  try {
    await loadCSS(FONT_AWESOME_CSS);
  } catch (error) {
    // Fail gracefully if CDN is blocked/unavailable.
  }

  const config = normalizeConfig(readBlockConfig(block));

  const wrapper = document.createElement('div');
  wrapper.className = 'billing-payment__wrapper';

  const headingRow = document.createElement('div');
  headingRow.className = 'billing-payment__heading-row';

  const headingIcon = createHeadingIcon(config.headingIcon);
  if (!headingIcon) {
    headingRow.classList.add('billing-payment__heading-row--without-icon');
  }

  const heading = document.createElement('h2');
  heading.className = 'billing-payment__heading';
  heading.textContent = config.heading;
  if (headingIcon) {
    headingRow.append(headingIcon);
  }
  headingRow.append(heading);

  const content = document.createElement('div');
  content.className = 'billing-payment__content';

  const leftColumn = buildColumn([
    {
      label: config.leftTopLabel,
      link: config.leftTopLink,
      helpLink: config.leftTopHelpLink,
      status: config.leftTopStatus,
    },
    {
      label: config.leftBottomLabel,
      link: config.leftBottomLink,
      helpLink: config.leftBottomHelpLink,
      status: config.leftBottomStatus,
    },
  ]);

  const rightColumn = buildColumn([
    {
      label: config.rightTopLabel,
      link: config.rightTopLink,
      helpLink: config.rightTopHelpLink,
      status: config.rightTopStatus,
    },
    {
      label: config.rightBottomLabel,
      link: config.rightBottomLink,
      helpLink: config.rightBottomHelpLink,
      status: config.rightBottomStatus,
    },
  ]);

  content.append(leftColumn, rightColumn);
  wrapper.append(headingRow, content);
  block.replaceChildren(wrapper);
}

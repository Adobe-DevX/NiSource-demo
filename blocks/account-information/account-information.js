import { getCustomer } from '@dropins/storefront-account/api.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { checkIsAuthenticated } from '../../scripts/commerce.js';

import '../../scripts/initializers/account.js';

const DEFAULTS = {
  greeting: 'Customer',
  'account-label': 'Account',
  'options-address': 'Home 7856 Culebra Road, San Antonio, TX',
};

function toText(value, fallback = '') {
  if (Array.isArray(value)) {
    return value.join(' ').trim() || fallback;
  }
  return value || fallback;
}

function cleanName(value) {
  return value
    .replace(/^\s*hi[,!]?\s+/i, '')
    .replace(/\s*!+\s*$/, '')
    .trim();
}

function cleanLabel(value) {
  return value.replace(/#+\s*$/, '').trim();
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function nameFromCustomer(customer) {
  if (!customer) return null;
  const name = [customer.firstName, customer.lastName]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')
    .trim();
  return name || null;
}

function parseAddressOptions(value) {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join('\n') : String(value);
  return raw
    .split(/\r?\n|\|/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const data = {
    name: cleanName(toText(config.greeting, DEFAULTS.greeting)) || DEFAULTS.greeting,
    accountLabel: cleanLabel(toText(config['account-label'], DEFAULTS['account-label']))
      || DEFAULTS['account-label'],
    addresses: parseAddressOptions(config['options-address'] || DEFAULTS['options-address']),
  };

  if (checkIsAuthenticated()) {
    try {
      const customer = await getCustomer();
      const fromCommerce = nameFromCustomer(customer);
      if (fromCommerce) {
        data.name = fromCommerce;
      }
    } catch {
      /* fall back to authored greeting if the customer query fails */
    }
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'account-information__wrapper';

  const greeting = document.createElement('p');
  greeting.className = 'account-information__greeting';
  const timePart = document.createElement('span');
  timePart.className = 'account-information__greeting-time';
  timePart.textContent = `${getTimeOfDayGreeting()}, `;
  const namePart = document.createElement('span');
  namePart.className = 'account-information__greeting-name';
  namePart.textContent = data.name.toUpperCase();
  greeting.append(timePart, namePart);

  const accountGroup = document.createElement('div');
  accountGroup.className = 'account-information__account';

  const labelId = `account-information-select-${Math.random().toString(36).slice(2, 8)}`;
  const label = document.createElement('label');
  label.className = 'account-information__label';
  label.setAttribute('for', labelId);
  label.textContent = data.accountLabel;

  const selectWrapper = document.createElement('div');
  selectWrapper.className = 'account-information__select-wrapper';

  const select = document.createElement('select');
  select.className = 'account-information__select';
  select.id = labelId;

  data.addresses.forEach((address) => {
    const option = document.createElement('option');
    option.value = address;
    option.textContent = address;
    select.append(option);
  });

  selectWrapper.append(select);
  accountGroup.append(label, selectWrapper);

  wrapper.append(greeting, accountGroup);
  block.replaceChildren(wrapper);
}

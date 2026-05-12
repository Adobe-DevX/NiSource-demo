import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULTS = {
  heading: 'Energy assistance',
  intro: 'Tell us how we can help. A specialist will follow up using the contact information you provide.',
  'contact-section-heading': 'Your information',
  'first-name-label': 'First name',
  'last-name-label': 'Last name',
  'email-label': 'Email',
  'phone-label': 'Phone',
  'account-number-label': 'Account number (optional)',
  'address-section-heading': 'Service address',
  'street-label': 'Street address',
  'city-label': 'City',
  'state-label': 'State',
  'zip-label': 'ZIP code',
  'programs-section-heading': 'How can we help?',
  'program-1-label': 'Heating / energy bill assistance (LIHEAP)',
  'program-2-label': 'Payment arrangement or budget billing',
  'program-3-label': 'Weatherization or energy efficiency programs',
  'comments-label': 'Additional details',
  'consent-label': 'I understand this form is for assistance inquiries only and does not change my account balance. I agree to be contacted about my request.',
  'submit-label': 'Submit request',
  'reset-label': '',
  'success-message': 'Thank you. Your request has been received. We will contact you soon.',
};

function toRowKey(text) {
  return typeof text === 'string'
    ? text
      .toLowerCase()
      .replace(/[^0-9a-z]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    : '';
}

function readCellInnerHTML(block, ...keys) {
  const targets = new Set(keys.map((k) => toRowKey(k)));
  const rows = [...block.querySelectorAll(':scope > div')];
  const match = rows.find((row) => {
    const k = toRowKey(row.children[0]?.textContent);
    return targets.has(k) && row.children[1];
  });
  return match ? match.children[1].innerHTML.trim() : '';
}

function toText(value, fallback = '') {
  if (Array.isArray(value)) {
    return value.join(' ').trim() || fallback;
  }
  return (value && String(value).trim()) || fallback;
}

function plainFromHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, '').trim();
}

function normalizeConfig(config, introHtml, consentHtml) {
  return {
    heading: toText(config.heading, DEFAULTS.heading),
    introHtml: introHtml || (toText(config.intro, DEFAULTS.intro) ? `<p>${escapeHtml(toText(config.intro, DEFAULTS.intro))}</p>` : ''),
    contactSectionHeading: toText(config['contact-section-heading'], DEFAULTS['contact-section-heading']),
    firstNameLabel: toText(config['first-name-label'], DEFAULTS['first-name-label']),
    lastNameLabel: toText(config['last-name-label'], DEFAULTS['last-name-label']),
    emailLabel: toText(config['email-label'], DEFAULTS['email-label']),
    phoneLabel: toText(config['phone-label'], DEFAULTS['phone-label']),
    accountNumberLabel: toText(config['account-number-label'], DEFAULTS['account-number-label']),
    addressSectionHeading: toText(config['address-section-heading'], DEFAULTS['address-section-heading']),
    streetLabel: toText(config['street-label'], DEFAULTS['street-label']),
    cityLabel: toText(config['city-label'], DEFAULTS['city-label']),
    stateLabel: toText(config['state-label'], DEFAULTS['state-label']),
    zipLabel: toText(config['zip-label'], DEFAULTS['zip-label']),
    programsSectionHeading: toText(config['programs-section-heading'], DEFAULTS['programs-section-heading']),
    program1Label: toText(config['program-1-label'], DEFAULTS['program-1-label']),
    program2Label: toText(config['program-2-label'], DEFAULTS['program-2-label']),
    program3Label: toText(config['program-3-label'], DEFAULTS['program-3-label']),
    commentsLabel: toText(config['comments-label'], DEFAULTS['comments-label']),
    consentHtml: consentHtml
      || `<span>${escapeHtml(toText(config['consent-label'], DEFAULTS['consent-label']))}</span>`,
    submitLabel: toText(config['submit-label'], DEFAULTS['submit-label']),
    resetLabel: toText(config['reset-label'], DEFAULTS['reset-label']),
    successMessage: toText(config['success-message'], DEFAULTS['success-message']),
    formAction: config['form-action'] || '',
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createUid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().replace(/-/g, '')
    : `eaf-${Date.now()}`;
}

function createFieldGroup({ legendText, className }) {
  const fieldset = document.createElement('fieldset');
  fieldset.className = className;
  const legend = document.createElement('legend');
  legend.className = 'energy-assistance-form__legend';
  legend.textContent = legendText;
  fieldset.append(legend);
  return fieldset;
}

function createTextField({
  uid, name, labelText, required = true, autocomplete, type = 'text', inputMode, maxLength,
}) {
  const id = `${uid}-${name}`;
  const wrap = document.createElement('div');
  wrap.className = 'energy-assistance-form__field';

  const label = document.createElement('label');
  label.className = 'energy-assistance-form__label';
  label.htmlFor = id;
  label.textContent = labelText;

  const input = document.createElement('input');
  input.className = 'energy-assistance-form__input';
  input.id = id;
  input.name = name;
  input.type = type;
  input.required = required;
  if (autocomplete) input.setAttribute('autocomplete', autocomplete);
  if (inputMode) input.setAttribute('inputmode', inputMode);
  if (maxLength != null) input.maxLength = maxLength;

  wrap.append(label, input);
  return wrap;
}

function createTextAreaField({
  uid,
  name,
  labelText,
  rows = 4,
}) {
  const id = `${uid}-${name}`;
  const wrap = document.createElement('div');
  wrap.className = 'energy-assistance-form__field energy-assistance-form__field--full';

  const label = document.createElement('label');
  label.className = 'energy-assistance-form__label';
  label.htmlFor = id;
  label.textContent = labelText;

  const ta = document.createElement('textarea');
  ta.className = 'energy-assistance-form__textarea';
  ta.id = id;
  ta.name = name;
  ta.rows = rows;

  wrap.append(label, ta);
  return wrap;
}

function createCheckboxRow({ uid, name, labelText }) {
  if (!labelText.trim()) return null;
  const id = `${uid}-${name}`;
  const wrap = document.createElement('div');
  wrap.className = 'energy-assistance-form__check';

  const input = document.createElement('input');
  input.className = 'energy-assistance-form__checkbox';
  input.type = 'checkbox';
  input.id = id;
  input.name = name;
  input.value = 'yes';

  const label = document.createElement('label');
  label.className = 'energy-assistance-form__check-label';
  label.htmlFor = id;
  label.textContent = labelText;

  wrap.append(input, label);
  return wrap;
}

export default function decorate(block) {
  /* First-column text becomes row key (see readBlockConfig / toClassName in aem.js). */
  const introHtml = readCellInnerHTML(block, 'intro', 'introduction');
  const consentHtml = readCellInnerHTML(block, 'consent', 'consent-copy');
  const config = normalizeConfig(readBlockConfig(block), introHtml, consentHtml);

  const placement = toText(
    config['classes-placement'] || config['column-placement-in-two-column-section'],
    '',
  );
  if (placement === 'place-left' || placement === 'place-right') {
    block.classList.add(placement);
  }

  const uid = createUid();
  const formId = `energy-assistance-form-${uid}`;

  const root = document.createElement('div');
  root.className = 'energy-assistance-form__wrapper';

  const heading = document.createElement('h3');
  heading.className = 'energy-assistance-form__heading';
  heading.textContent = config.heading;

  root.append(heading);

  const introPlain = plainFromHtml(config.introHtml);
  if (introPlain) {
    const intro = document.createElement('div');
    intro.className = 'energy-assistance-form__intro';
    intro.innerHTML = config.introHtml;
    root.append(intro);
  }

  const status = document.createElement('div');
  status.className = 'energy-assistance-form__status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;
  root.append(status);

  const form = document.createElement('form');
  form.className = 'energy-assistance-form__form';
  form.id = formId;

  if (config.formAction) {
    form.action = config.formAction;
    form.method = 'post';
  }

  const contact = createFieldGroup({
    legendText: config.contactSectionHeading,
    className: 'energy-assistance-form__fieldset',
  });
  const nameRow = document.createElement('div');
  nameRow.className = 'energy-assistance-form__row energy-assistance-form__row--2';
  nameRow.append(
    createTextField({
      uid, name: 'firstName', labelText: config.firstNameLabel, autocomplete: 'given-name',
    }),
    createTextField({
      uid, name: 'lastName', labelText: config.lastNameLabel, autocomplete: 'family-name',
    }),
  );
  const contactRow2 = document.createElement('div');
  contactRow2.className = 'energy-assistance-form__row energy-assistance-form__row--2';
  contactRow2.append(
    createTextField({
      uid, name: 'email', labelText: config.emailLabel, type: 'email', autocomplete: 'email',
    }),
    createTextField({
      uid, name: 'phone', labelText: config.phoneLabel, type: 'tel', autocomplete: 'tel', inputMode: 'tel',
    }),
  );
  contact.append(
    nameRow,
    contactRow2,
    createTextField({
      uid,
      name: 'accountNumber',
      labelText: config.accountNumberLabel,
      required: false,
      autocomplete: 'off',
    }),
  );

  const address = createFieldGroup({
    legendText: config.addressSectionHeading,
    className: 'energy-assistance-form__fieldset',
  });
  address.append(
    createTextField({
      uid, name: 'street', labelText: config.streetLabel, autocomplete: 'street-address',
    }),
  );
  const cityRow = document.createElement('div');
  cityRow.className = 'energy-assistance-form__row energy-assistance-form__row--city';
  cityRow.append(
    createTextField({
      uid, name: 'city', labelText: config.cityLabel, autocomplete: 'address-level2',
    }),
    createTextField({
      uid,
      name: 'state',
      labelText: config.stateLabel,
      autocomplete: 'address-level1',
      inputMode: 'text',
      maxLength: 2,
    }),
    createTextField({
      uid,
      name: 'zip',
      labelText: config.zipLabel,
      autocomplete: 'postal-code',
      inputMode: 'numeric',
      maxLength: 10,
    }),
  );
  address.append(cityRow);

  const checks = document.createElement('div');
  checks.className = 'energy-assistance-form__checks';
  [
    createCheckboxRow({ uid, name: 'programInterest1', labelText: config.program1Label }),
    createCheckboxRow({ uid, name: 'programInterest2', labelText: config.program2Label }),
    createCheckboxRow({ uid, name: 'programInterest3', labelText: config.program3Label }),
  ].forEach((el) => {
    if (el) checks.append(el);
  });

  let programs = null;
  if (checks.childElementCount > 0) {
    programs = createFieldGroup({
      legendText: config.programsSectionHeading,
      className: 'energy-assistance-form__fieldset energy-assistance-form__fieldset--programs',
    });
    programs.append(checks);
  }

  const comments = createTextAreaField({
    uid, name: 'comments', labelText: config.commentsLabel, rows: 4,
  });

  const consentWrap = document.createElement('div');
  consentWrap.className = 'energy-assistance-form__consent';
  const consentId = `${uid}-consent`;
  const consentInput = document.createElement('input');
  consentInput.type = 'checkbox';
  consentInput.className = 'energy-assistance-form__checkbox';
  consentInput.id = consentId;
  consentInput.name = 'consent';
  consentInput.required = true;
  consentInput.value = 'yes';

  const consentLabel = document.createElement('label');
  consentLabel.className = 'energy-assistance-form__consent-label';
  consentLabel.htmlFor = consentId;
  if (config.consentHtml) {
    consentLabel.innerHTML = config.consentHtml;
  }

  consentWrap.append(consentInput, consentLabel);

  const actions = document.createElement('div');
  actions.className = 'energy-assistance-form__actions';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'button';
  submitBtn.textContent = config.submitLabel;

  actions.append(submitBtn);

  if (config.resetLabel.trim()) {
    const resetBtn = document.createElement('button');
    resetBtn.type = 'reset';
    resetBtn.className = 'button secondary';
    resetBtn.textContent = config.resetLabel;
    actions.append(resetBtn);
  }

  const sections = [contact, address];
  if (programs) {
    sections.push(programs);
  }
  sections.push(comments, consentWrap, actions);
  form.append(...sections);
  root.append(form);

  form.addEventListener('submit', (event) => {
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }
    if (!config.formAction) {
      event.preventDefault();
      form.hidden = true;
      status.textContent = config.successMessage;
      status.hidden = false;
    }
  });

  block.replaceChildren(root);
}

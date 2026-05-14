import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULTS = {
  heading: 'Complete the SERV application below',
  'eligibility-section-heading': 'ELIGIBILITY',
  'household-income-label': 'Household Size and Income',
  'household-income-options': [
    '3-person household with annual income less than $66,625',
    '4-person household with annual income less than $75,000',
    '5-person household with annual income less than $84,000',
  ].join('\n'),
  'household-hint-left': 'Number of people in the household',
  'household-hint-right': 'Annual household income in dollars',
  'customer-information-heading': 'CUSTOMER INFORMATION',
  'account-owner-subheading': 'ACCOUNT OWNER',
  'owner-first-name-label': 'First Name (Account Owner)',
  'owner-first-name-hint': 'First name of authorized account holder',
  'owner-last-name-label': 'Last Name (Account Owner)',
  'owner-last-name-hint': 'Last name of authorized account holder',
  'spouse-section-heading': "ACCOUNT OWNER'S SPOUSE (IF APPLICABLE)",
  'spouse-first-name-label': "First Name (Account Owner's Spouse)",
  'spouse-first-name-hint': 'First name of authorized account holder',
  'spouse-last-name-label': "Last Name (Account Owner's Spouse)",
  'spouse-last-name-hint': 'Last name of authorized account holder',
  'contact-section-heading': 'CUSTOMER INFORMATION',
  'applicant-email-label': 'Applicant Email Address',
  'applicant-email-hint': 'email@example.com',
  'applicant-phone-label': 'Applicant Phone Number',
  'applicant-phone-hint': '(XXX) XXX-XXXX',
  'primary-holder-label': 'Are you the primary account holder?',
  'primary-holder-hint': "Acceptable in spouse's name (proof may be required)",
  'primary-holder-placeholder': '-- Select --',
  'primary-holder-option-yes': 'Yes',
  'primary-holder-option-no': 'No',
  'terms-toggle-label': 'View Terms and Conditions',
  'terms-body-fallback': '<p>NIPSCO energy assistance programs include SERV and SILVER. SERV and SILVER end annually on May 31. Review the full program terms before you apply.</p>',
  'terms-checkbox-legend': 'I agree to the terms and conditions.',
  'terms-checkbox-affirm-label': 'Yes, I agree',
  'behalf-question-label': 'Are you submitting this form on behalf of the authorized account holder?',
  'behalf-option-self-label': 'No, I am submitting this form on my own behalf; I am the primary authorized account holder',
  'behalf-option-behalf-label': 'Yes, I am submitting this form on behalf of the authorized account holder',
  'submit-label': 'Apply for Energy Assistance',
  'reset-label': '',
  'success-message': 'Thank you. Your application has been received.',
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

function toMultiline(value, fallback) {
  if (Array.isArray(value)) {
    return value.map((l) => String(l).trim()).filter(Boolean).join('\n') || fallback;
  }
  return toText(value, fallback);
}

function plainFromHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, '').trim();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeConfig(config, introHtml, termsBodyHtml) {
  return {
    heading: toText(config.heading, DEFAULTS.heading),
    introHtml: introHtml || (toText(config.intro, '') ? `<p>${escapeHtml(toText(config.intro, ''))}</p>` : ''),
    eligibilitySectionHeading: toText(config['eligibility-section-heading'], DEFAULTS['eligibility-section-heading']),
    householdIncomeLabel: toText(config['household-income-label'], DEFAULTS['household-income-label']),
    householdIncomeOptions: toMultiline(
      config['household-income-options'],
      DEFAULTS['household-income-options'],
    ),
    householdHintLeft: toText(config['household-hint-left'], DEFAULTS['household-hint-left']),
    householdHintRight: toText(config['household-hint-right'], DEFAULTS['household-hint-right']),
    customerInformationHeading: toText(config['customer-information-heading'], DEFAULTS['customer-information-heading']),
    accountOwnerSubheading: toText(config['account-owner-subheading'], DEFAULTS['account-owner-subheading']),
    ownerFirstNameLabel: toText(config['owner-first-name-label'], DEFAULTS['owner-first-name-label']),
    ownerFirstNameHint: toText(config['owner-first-name-hint'], DEFAULTS['owner-first-name-hint']),
    ownerLastNameLabel: toText(config['owner-last-name-label'], DEFAULTS['owner-last-name-label']),
    ownerLastNameHint: toText(config['owner-last-name-hint'], DEFAULTS['owner-last-name-hint']),
    spouseSectionHeading: toText(config['spouse-section-heading'], DEFAULTS['spouse-section-heading']),
    spouseFirstNameLabel: toText(config['spouse-first-name-label'], DEFAULTS['spouse-first-name-label']),
    spouseFirstNameHint: toText(config['spouse-first-name-hint'], DEFAULTS['spouse-first-name-hint']),
    spouseLastNameLabel: toText(config['spouse-last-name-label'], DEFAULTS['spouse-last-name-label']),
    spouseLastNameHint: toText(config['spouse-last-name-hint'], DEFAULTS['spouse-last-name-hint']),
    contactSectionHeading: toText(config['contact-section-heading'], DEFAULTS['contact-section-heading']),
    applicantEmailLabel: toText(config['applicant-email-label'], DEFAULTS['applicant-email-label']),
    applicantEmailHint: toText(config['applicant-email-hint'], DEFAULTS['applicant-email-hint']),
    applicantPhoneLabel: toText(config['applicant-phone-label'], DEFAULTS['applicant-phone-label']),
    applicantPhoneHint: toText(config['applicant-phone-hint'], DEFAULTS['applicant-phone-hint']),
    primaryHolderLabel: toText(config['primary-holder-label'], DEFAULTS['primary-holder-label']),
    primaryHolderHint: toText(config['primary-holder-hint'], DEFAULTS['primary-holder-hint']),
    primaryHolderPlaceholder: toText(config['primary-holder-placeholder'], DEFAULTS['primary-holder-placeholder']),
    primaryHolderOptionYes: toText(config['primary-holder-option-yes'], DEFAULTS['primary-holder-option-yes']),
    primaryHolderOptionNo: toText(config['primary-holder-option-no'], DEFAULTS['primary-holder-option-no']),
    termsToggleLabel: toText(config['terms-toggle-label'], DEFAULTS['terms-toggle-label']),
    termsBodyHtml: termsBodyHtml
      || (toText(config['terms-body'], '').trim()
        ? `<p>${escapeHtml(toText(config['terms-body'], ''))}</p>`
        : '')
      || DEFAULTS['terms-body-fallback'],
    termsCheckboxLegend: toText(config['terms-checkbox-legend'], DEFAULTS['terms-checkbox-legend']),
    termsCheckboxAffirmLabel: toText(config['terms-checkbox-affirm-label'], DEFAULTS['terms-checkbox-affirm-label']),
    behalfQuestionLabel: toText(config['behalf-question-label'], DEFAULTS['behalf-question-label']),
    behalfOptionSelfLabel: toText(config['behalf-option-self-label'], DEFAULTS['behalf-option-self-label']),
    behalfOptionBehalfLabel: toText(config['behalf-option-behalf-label'], DEFAULTS['behalf-option-behalf-label']),
    submitLabel: toText(config['submit-label'], DEFAULTS['submit-label']),
    resetLabel: toText(config['reset-label'], DEFAULTS['reset-label']),
    successMessage: toText(config['success-message'], DEFAULTS['success-message']),
    /**
     * Relative to site root (after codeBasePath). Empty = default demo JSON.
     * Set block field to `none` to disable fetch.
     */
    prefillJsonPath: toText(config['prefill-json-path'], '').trim(),
    formAction: config['form-action'] || '',
  };
}

function createUid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().replace(/-/g, '')
    : `eaf-${Date.now()}`;
}

function appendRequiredStar(labelEl) {
  labelEl.appendChild(document.createTextNode(' '));
  const star = document.createElement('span');
  star.className = 'energy-assistance-form__required';
  star.textContent = '*';
  star.setAttribute('aria-hidden', 'true');
  labelEl.appendChild(star);
}

function createHintsRow(leftText, rightText) {
  const row = document.createElement('div');
  row.className = 'energy-assistance-form__hints';
  if (leftText) {
    const left = document.createElement('span');
    left.className = 'energy-assistance-form__hint energy-assistance-form__hint--left';
    left.textContent = leftText;
    row.append(left);
  }
  if (rightText) {
    const right = document.createElement('span');
    right.className = 'energy-assistance-form__hint energy-assistance-form__hint--right';
    right.textContent = rightText;
    row.append(right);
  }
  return row;
}

function createSingleHint(text) {
  const el = document.createElement('p');
  el.className = 'energy-assistance-form__hint energy-assistance-form__hint--single';
  el.textContent = text;
  return el;
}

function createTextField({
  uid,
  name,
  labelText,
  hint,
  required = false,
  type = 'text',
  autocomplete,
  inputMode,
  maxLength,
}) {
  const id = `${uid}-${name}`;
  const wrap = document.createElement('div');
  wrap.className = 'energy-assistance-form__field';

  const label = document.createElement('label');
  label.className = 'energy-assistance-form__label';
  label.htmlFor = id;
  label.textContent = labelText;
  if (required) appendRequiredStar(label);

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
  if (hint) wrap.append(createSingleHint(hint));
  return wrap;
}

function parseIncomeOptions(raw) {
  return String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label, index) => ({ value: `household-tier-${index}`, label }));
}

function createHouseholdSelect({
  uid,
  name,
  labelText,
  options,
  hintLeft,
  hintRight,
  required = true,
}) {
  const id = `${uid}-${name}`;
  const wrap = document.createElement('div');
  wrap.className = 'energy-assistance-form__field energy-assistance-form__field--full';

  const label = document.createElement('label');
  label.className = 'energy-assistance-form__label';
  label.htmlFor = id;
  label.textContent = labelText;
  if (required) appendRequiredStar(label);

  const select = document.createElement('select');
  select.className = 'energy-assistance-form__input energy-assistance-form__select';
  select.id = id;
  select.name = name;
  select.required = required;

  if (options.length) {
    options.forEach((opt, index) => {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      if (index === 0) o.selected = true;
      select.append(o);
    });
  } else {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = 'Add options in authoring (Household Income Options)';
    select.append(o);
  }

  wrap.append(label, select);
  if (hintLeft || hintRight) wrap.append(createHintsRow(hintLeft, hintRight));
  return wrap;
}

function createPrimaryHolderSelect({
  uid,
  name,
  labelText,
  hint,
  placeholderText,
  yesLabel,
  noLabel,
  required = true,
}) {
  const id = `${uid}-${name}`;
  const wrap = document.createElement('div');
  wrap.className = 'energy-assistance-form__field energy-assistance-form__field--full';

  const label = document.createElement('label');
  label.className = 'energy-assistance-form__label';
  label.htmlFor = id;
  label.textContent = labelText;
  if (required) appendRequiredStar(label);

  const select = document.createElement('select');
  select.className = 'energy-assistance-form__input energy-assistance-form__select';
  select.id = id;
  select.name = name;
  select.required = required;

  const ph = document.createElement('option');
  ph.value = '';
  ph.disabled = true;
  ph.selected = true;
  ph.textContent = placeholderText;
  select.append(ph);

  [['yes', yesLabel], ['no', noLabel]].forEach(([value, text]) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = text;
    select.append(o);
  });

  wrap.append(label, select);
  if (hint) wrap.append(createSingleHint(hint));
  return wrap;
}

function createFieldsetSection(legendText, extraClass = '') {
  const fs = document.createElement('fieldset');
  fs.className = ['energy-assistance-form__fieldset', extraClass].filter(Boolean).join(' ');
  const leg = document.createElement('legend');
  leg.className = 'energy-assistance-form__section-title';
  leg.textContent = legendText;
  fs.append(leg);
  return fs;
}

/**
 * Default SERV demo prefill (same-origin JSON).
 * Override path via block key `prefill-json-path`.
 */
const DEFAULT_PREFILL_JSON_PATH = 'blocks/energy-assistance-form/energy-assistance-prefill.json';

function prefillJsonUrl(pathFromConfig) {
  const base = (typeof window !== 'undefined' && window.hlx?.codeBasePath)
    ? String(window.hlx.codeBasePath).replace(/\/$/, '')
    : '';
  const path = (pathFromConfig || DEFAULT_PREFILL_JSON_PATH).replace(/^\//, '');
  return base ? `${base}/${path}` : `/${path}`;
}

async function fetchEnergyAssistancePrefill(pathFromConfig) {
  const url = prefillJsonUrl(pathFromConfig);
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function setSelectOptionByLabel(selectEl, labelText) {
  if (!selectEl || labelText == null) return;
  const want = String(labelText).trim();
  if (!want) return;
  const opts = [...selectEl.options];
  const match = opts.find((o) => o.textContent.trim() === want);
  if (match) {
    selectEl.value = match.value;
  }
}

function setPrimaryAccountHolder(selectEl, yesNo) {
  if (!selectEl || yesNo == null) return;
  const v = String(yesNo).trim().toLowerCase();
  if (v === 'yes' || v === 'y' || v === 'true' || v === '1') {
    selectEl.value = 'yes';
  } else if (v === 'no' || v === 'n' || v === 'false' || v === '0') {
    selectEl.value = 'no';
  }
}

function setBehalfRadios(form, submittingOnBehalf) {
  if (!form || submittingOnBehalf == null) return;
  const v = String(submittingOnBehalf).trim().toLowerCase();
  const self = form.querySelector('input[name="submitOnBehalf"][value="self"]');
  const behalf = form.querySelector('input[name="submitOnBehalf"][value="behalf"]');
  if (v === 'yes' || v === 'y' || v === 'true' || v === '1' || v === 'behalf') {
    if (behalf) behalf.checked = true;
  } else if (self) {
    self.checked = true;
  }
}

function setInputValue(form, name, value) {
  if (value == null) return;
  const el = form.querySelector(`input[name="${name}"]`);
  if (el) el.value = String(value);
}

/**
 * Applies same-origin JSON prefill to the live form (optional; skips missing fields).
 * @param {HTMLFormElement} form
 * @param {Record<string, unknown>} data
 */
function applyEnergyAssistancePrefill(form, data) {
  if (!form || !data || typeof data !== 'object') return;

  const elig = data.eligibility?.householdSizeAndIncome;
  if (elig?.displayText) {
    setSelectOptionByLabel(form.querySelector('select[name="householdIncome"]'), elig.displayText);
  }

  const owner = data.customerInformation?.accountOwner;
  if (owner) {
    setInputValue(form, 'ownerFirstName', owner.firstName);
    setInputValue(form, 'ownerLastName', owner.lastName);
  }

  const spouse = data.customerInformation?.accountOwnerSpouse;
  if (spouse) {
    setInputValue(form, 'spouseFirstName', spouse.firstName);
    setInputValue(form, 'spouseLastName', spouse.lastName);
  }

  const info = data.yourInformation;
  if (info) {
    setInputValue(form, 'applicantEmail', info.applicantEmail);
    setInputValue(form, 'applicantPhone', info.applicantPhone);
    setPrimaryAccountHolder(form.querySelector('select[name="primaryAccountHolder"]'), info.isPrimaryAccountHolder);
  }

  const agree = data.agreement;
  if (agree && typeof agree.agreedToTermsAndConditions === 'boolean') {
    const cb = form.querySelector('input[name="termsAgree"]');
    if (cb) cb.checked = agree.agreedToTermsAndConditions;
  }

  if (agree?.submittingOnBehalfOfAccountHolder != null) {
    setBehalfRadios(form, agree.submittingOnBehalfOfAccountHolder);
  }
}

export default async function decorate(block) {
  const introHtml = readCellInnerHTML(block, 'intro', 'introduction');
  const termsBodyHtml = readCellInnerHTML(block, 'terms-body', 'terms-body-copy');
  const raw = readBlockConfig(block);
  const config = normalizeConfig(raw, introHtml, termsBodyHtml);

  const prefillDisabled = ['none', 'off', 'false'].includes(
    String(config.prefillJsonPath || '').trim().toLowerCase(),
  );
  const prefillPromise = prefillDisabled
    ? Promise.resolve(null)
    : fetchEnergyAssistancePrefill(config.prefillJsonPath || undefined);

  const placement = toText(
    raw['classes-placement'] || raw['column-placement-in-two-column-section'],
    '',
  );
  if (placement === 'place-left' || placement === 'place-right') {
    block.classList.add(placement);
  }

  const uid = createUid();
  const formId = `energy-assistance-form-${uid}`;

  const root = document.createElement('div');
  root.className = 'energy-assistance-form__wrapper';

  const heading = document.createElement('h2');
  heading.className = 'energy-assistance-form__title';
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

  const incomeOptions = parseIncomeOptions(config.householdIncomeOptions);

  const eligibility = createFieldsetSection(config.eligibilitySectionHeading);
  eligibility.append(
    createHouseholdSelect({
      uid,
      name: 'householdIncome',
      labelText: config.householdIncomeLabel,
      options: incomeOptions.length ? incomeOptions : parseIncomeOptions(DEFAULTS['household-income-options']),
      hintLeft: config.householdHintLeft,
      hintRight: config.householdHintRight,
      required: true,
    }),
  );

  const customerOwner = createFieldsetSection(config.customerInformationHeading);
  const ownerSub = document.createElement('p');
  ownerSub.className = 'energy-assistance-form__subheading';
  ownerSub.textContent = config.accountOwnerSubheading;
  customerOwner.append(ownerSub);

  const ownerRow = document.createElement('div');
  ownerRow.className = 'energy-assistance-form__row energy-assistance-form__row--2';
  ownerRow.append(
    createTextField({
      uid,
      name: 'ownerFirstName',
      labelText: config.ownerFirstNameLabel,
      hint: config.ownerFirstNameHint,
      required: true,
      autocomplete: 'given-name',
    }),
    createTextField({
      uid,
      name: 'ownerLastName',
      labelText: config.ownerLastNameLabel,
      hint: config.ownerLastNameHint,
      required: true,
      autocomplete: 'family-name',
    }),
  );
  customerOwner.append(ownerRow);

  const spouseFs = createFieldsetSection(config.spouseSectionHeading);
  const spouseRow = document.createElement('div');
  spouseRow.className = 'energy-assistance-form__row energy-assistance-form__row--2';
  spouseRow.append(
    createTextField({
      uid,
      name: 'spouseFirstName',
      labelText: config.spouseFirstNameLabel,
      hint: config.spouseFirstNameHint,
      required: false,
      autocomplete: 'off',
    }),
    createTextField({
      uid,
      name: 'spouseLastName',
      labelText: config.spouseLastNameLabel,
      hint: config.spouseLastNameHint,
      required: false,
      autocomplete: 'off',
    }),
  );
  spouseFs.append(spouseRow);

  const contactFs = createFieldsetSection(config.contactSectionHeading);
  const contactRow = document.createElement('div');
  contactRow.className = 'energy-assistance-form__row energy-assistance-form__row--2';
  contactRow.append(
    createTextField({
      uid,
      name: 'applicantEmail',
      labelText: config.applicantEmailLabel,
      hint: config.applicantEmailHint,
      required: true,
      type: 'email',
      autocomplete: 'email',
    }),
    createTextField({
      uid,
      name: 'applicantPhone',
      labelText: config.applicantPhoneLabel,
      hint: config.applicantPhoneHint,
      required: true,
      type: 'tel',
      autocomplete: 'tel',
      inputMode: 'tel',
    }),
  );
  contactFs.append(
    contactRow,
    createPrimaryHolderSelect({
      uid,
      name: 'primaryAccountHolder',
      labelText: config.primaryHolderLabel,
      hint: config.primaryHolderHint,
      placeholderText: config.primaryHolderPlaceholder,
      yesLabel: config.primaryHolderOptionYes,
      noLabel: config.primaryHolderOptionNo,
      required: true,
    }),
  );

  const termsWrap = document.createElement('div');
  termsWrap.className = 'energy-assistance-form__terms-wrap';

  const details = document.createElement('details');
  details.className = 'energy-assistance-form__terms-details';

  const summary = document.createElement('summary');
  summary.className = 'energy-assistance-form__terms-summary';
  summary.textContent = config.termsToggleLabel;

  const panel = document.createElement('div');
  panel.className = 'energy-assistance-form__terms-panel';
  panel.innerHTML = config.termsBodyHtml;

  details.append(summary, panel);
  termsWrap.append(details);

  const agreeFs = document.createElement('fieldset');
  agreeFs.className = 'energy-assistance-form__terms-agree';

  const agreeLegend = document.createElement('legend');
  agreeLegend.className = 'energy-assistance-form__terms-agree-legend';
  agreeLegend.textContent = config.termsCheckboxLegend;
  appendRequiredStar(agreeLegend);

  const agreeRow = document.createElement('div');
  agreeRow.className = 'energy-assistance-form__terms-agree-row';
  const agreeId = `${uid}-termsAgree`;
  const agreeInput = document.createElement('input');
  agreeInput.type = 'checkbox';
  agreeInput.className = 'energy-assistance-form__checkbox';
  agreeInput.id = agreeId;
  agreeInput.name = 'termsAgree';
  agreeInput.required = true;
  agreeInput.value = 'yes';

  const agreeLabel = document.createElement('label');
  agreeLabel.className = 'energy-assistance-form__terms-agree-label';
  agreeLabel.htmlFor = agreeId;
  agreeLabel.textContent = config.termsCheckboxAffirmLabel;

  agreeRow.append(agreeInput, agreeLabel);
  agreeFs.append(agreeLegend, agreeRow);
  termsWrap.append(agreeFs);

  const behalfFs = document.createElement('fieldset');
  behalfFs.className = 'energy-assistance-form__fieldset energy-assistance-form__fieldset--radios';

  const behalfLegend = document.createElement('legend');
  behalfLegend.className = 'energy-assistance-form__label energy-assistance-form__label--legend';
  behalfLegend.textContent = config.behalfQuestionLabel;
  appendRequiredStar(behalfLegend);
  behalfFs.append(behalfLegend);

  const radioName = 'submitOnBehalf';
  [['self', config.behalfOptionSelfLabel], ['behalf', config.behalfOptionBehalfLabel]].forEach(([value, text], idx) => {
    const rid = `${uid}-behalf-${value}`;
    const row = document.createElement('div');
    row.className = 'energy-assistance-form__radio-row';

    const input = document.createElement('input');
    input.type = 'radio';
    input.className = 'energy-assistance-form__radio';
    input.name = radioName;
    input.id = rid;
    input.value = value;
    input.required = true;
    if (idx === 0) input.checked = true;

    const lab = document.createElement('label');
    lab.className = 'energy-assistance-form__radio-label';
    lab.htmlFor = rid;
    lab.textContent = text;

    row.append(input, lab);
    behalfFs.append(row);
  });

  termsWrap.append(behalfFs);

  const actions = document.createElement('div');
  actions.className = 'energy-assistance-form__actions energy-assistance-form__actions--center';

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

  form.append(
    eligibility,
    customerOwner,
    spouseFs,
    contactFs,
    termsWrap,
    actions,
  );
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

  const prefillData = await prefillPromise;
  applyEnergyAssistancePrefill(form, prefillData);

  block.replaceChildren(root);
}

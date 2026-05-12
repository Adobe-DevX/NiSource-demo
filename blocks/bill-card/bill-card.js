import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULTS = {
  'bill-label': 'Total Amount Due',
  'amount-due': '$150.53',
  'due-date': 'Pay before May 15, 2026',
  'billing-period': 'Mar 30, 2026 - Apr 30, 2026',
  'bill-cta-label': 'Pay Bill',
  'bill-cta-link': '/billing-payment',
  'high-bill-alert-title': 'High Bill Alert',
  'high-bill-alert-message': '18% higher compared to last month',
  'high-bill-alert-cta-label': 'See why & Take Action',
};

/** Static demo insights (not authorable; wireframe / journey reference). */
const STATIC_INSIGHTS = {
  collapseLabel: 'Show less',
  estimateHeading: 'Month estimate bill',
  estimateValue: '$203.92',
  estimateCalcLabel: 'How is this calculated?',
  costTrendHeading: 'Cost trend',
  costTrendValue: '+$23 (+13%)',
  whatChangedHeading: 'What changed',
  whatChangedValue: '+$53 (+25%)',
  chartAriaLabel: 'Cost trends (monthly)',
  chartHeading: 'Cost trends (monthly)',
  saveHeading: 'Recommended smart thermostats to help you save',
  saveCtaLabel: 'Shop marketplace',
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

function plainFromMarkup(html) {
  return String(html || '').replace(/<[^>]*>/g, '').trim();
}

function normalizeConfig(config) {
  return {
    eyebrow: toText(config.eyebrow, ''),
    billLabel: toText(config['bill-label'], DEFAULTS['bill-label']),
    amountDue: toText(config['amount-due'], DEFAULTS['amount-due']),
    dueDate: toText(config['due-date'], DEFAULTS['due-date']),
    billingPeriod: toText(config['billing-period'], DEFAULTS['billing-period']),
    billCtaLabel: toText(config['bill-cta-label'], DEFAULTS['bill-cta-label']),
    billCtaLink: config['bill-cta-link'] || DEFAULTS['bill-cta-link'],
    highBillAlertTitle: toText(config['high-bill-alert-title'], DEFAULTS['high-bill-alert-title']),
    highBillAlertMessage: toText(config['high-bill-alert-message'], DEFAULTS['high-bill-alert-message']),
    highBillAlertCtaLabel: toText(config['high-bill-alert-cta-label'], DEFAULTS['high-bill-alert-cta-label']),
    content: toMarkup(config.content),
  };
}

function createMetricCell({
  heading,
  value,
  microLinkLabel,
  microLinkHref,
}) {
  const h = String(heading || '').trim();
  const v = String(value || '').trim();
  const ml = String(microLinkLabel || '').trim();
  if (!h && !v && !(ml && microLinkHref)) {
    return null;
  }

  const cell = document.createElement('div');
  cell.className = 'bill-card__high-bill-metric';

  if (h) {
    const headingEl = document.createElement('p');
    headingEl.className = 'bill-card__high-bill-metric-heading';
    headingEl.textContent = h;
    cell.append(headingEl);
  }
  if (v) {
    const valueEl = document.createElement('p');
    valueEl.className = 'bill-card__high-bill-metric-value';
    valueEl.textContent = v;
    cell.append(valueEl);
  }
  if (ml && microLinkHref) {
    const micro = document.createElement('a');
    micro.className = 'bill-card__high-bill-metric-link';
    micro.href = microLinkHref;
    micro.textContent = ml;
    cell.append(micro);
  } else if (ml) {
    const micro = document.createElement('span');
    micro.className = 'bill-card__high-bill-metric-link bill-card__high-bill-metric-link--disabled';
    micro.textContent = ml;
    micro.setAttribute('aria-disabled', 'true');
    cell.append(micro);
  }

  return cell;
}

function createChartPlaceholder(ariaLabel, uid) {
  const fillId = `bill-card-chart-fill-${uid}`;
  const wrap = document.createElement('div');
  wrap.className = 'bill-card__high-bill-chart-placeholder';
  wrap.setAttribute('role', 'img');
  if (ariaLabel) {
    wrap.setAttribute('aria-label', ariaLabel);
  }

  wrap.innerHTML = `
    <svg class="bill-card__high-bill-chart-svg" viewBox="0 0 400 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${fillId}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="var(--nisource-color-high-bill-chart-line)" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="var(--nisource-color-high-bill-chart-line)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect class="bill-card__high-bill-chart-svg-bg" x="0" y="0" width="400" height="120" rx="4" />
      <g class="bill-card__high-bill-chart-grid" stroke="var(--nisource-color-high-bill-chart-grid)">
        <line x1="32" y1="24" x2="368" y2="24" />
        <line x1="32" y1="56" x2="368" y2="56" />
        <line x1="32" y1="88" x2="368" y2="88" />
      </g>
      <polygon fill="url(#${fillId})" points="32,88 80,72 128,80 176,48 224,56 272,40 320,52 368,44 368,120 32,120" />
      <polyline fill="none" stroke="var(--nisource-color-high-bill-chart-line)" stroke-width="2.5"
        points="32,88 80,72 128,80 176,48 224,56 272,40 320,52 368,44" />
    </svg>`;

  return wrap;
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

function appendStaticInsightsPanel(insightsPanel, uid) {
  const s = STATIC_INSIGHTS;

  const metricsRow = document.createElement('div');
  metricsRow.className = 'bill-card__high-bill-metrics';

  [
    createMetricCell({
      heading: s.estimateHeading,
      value: s.estimateValue,
      microLinkLabel: s.estimateCalcLabel,
      microLinkHref: null,
    }),
    createMetricCell({
      heading: s.costTrendHeading,
      value: s.costTrendValue,
    }),
    createMetricCell({
      heading: s.whatChangedHeading,
      value: s.whatChangedValue,
    }),
  ].filter(Boolean).forEach((cell) => metricsRow.append(cell));

  insightsPanel.append(metricsRow);

  const chartBlock = document.createElement('div');
  chartBlock.className = 'bill-card__high-bill-chart';
  const ch = document.createElement('h3');
  ch.className = 'bill-card__high-bill-chart-heading';
  ch.textContent = s.chartHeading;
  chartBlock.append(ch);
  const chartMedia = document.createElement('div');
  chartMedia.className = 'bill-card__high-bill-chart-body';
  chartMedia.append(createChartPlaceholder(s.chartAriaLabel, uid));
  chartBlock.append(chartMedia);
  insightsPanel.append(chartBlock);

  const save = document.createElement('div');
  save.className = 'bill-card__high-bill-save';
  const saveCopy = document.createElement('div');
  saveCopy.className = 'bill-card__high-bill-save-copy';
  const sh = document.createElement('div');
  sh.className = 'bill-card__high-bill-save-heading';
  const shp = document.createElement('p');
  shp.textContent = s.saveHeading;
  sh.append(shp);
  saveCopy.append(sh, createButton(s.saveCtaLabel, null));
  save.append(saveCopy);
  insightsPanel.append(save);

  const footer = document.createElement('div');
  footer.className = 'bill-card__high-bill-insights-footer';
  const collapseBtn = document.createElement('button');
  collapseBtn.type = 'button';
  collapseBtn.className = 'bill-card__high-bill-insights-collapse';
  collapseBtn.textContent = s.collapseLabel;
  footer.append(collapseBtn);
  insightsPanel.append(footer);

  return collapseBtn;
}

function appendHighBillAlert(billCard, config) {
  const alert = document.createElement('div');
  alert.className = 'bill-card__high-bill-alert';
  alert.setAttribute('role', 'region');
  alert.setAttribute(
    'aria-label',
    config.highBillAlertTitle.trim()
      || config.highBillAlertMessage.trim()
      || 'High bill alert',
  );

  const bar = document.createElement('div');
  bar.className = 'bill-card__high-bill-alert-bar';

  if (config.highBillAlertTitle.trim()) {
    const title = document.createElement('p');
    title.className = 'bill-card__high-bill-alert-title';
    title.textContent = config.highBillAlertTitle;
    bar.append(title);
  }
  if (config.highBillAlertMessage.trim()) {
    const message = document.createElement('p');
    message.className = 'bill-card__high-bill-alert-message';
    message.textContent = config.highBillAlertMessage;
    bar.append(message);
  }

  const uid = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const insightsId = `bill-card-insights-${uid}`;

  const expandLabel = config.highBillAlertCtaLabel.trim() || 'See more';
  const { collapseLabel } = STATIC_INSIGHTS;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'bill-card__high-bill-alert-cta bill-card__high-bill-alert-cta--toggle';
  toggle.textContent = expandLabel;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', insightsId);

  const insightsPanel = document.createElement('div');
  insightsPanel.id = insightsId;
  insightsPanel.className = 'bill-card__high-bill-insights';
  insightsPanel.setAttribute('hidden', '');

  const collapseBtn = appendStaticInsightsPanel(insightsPanel, uid);

  let insightsOpen = false;

  const setOpen = (open) => {
    insightsOpen = open;
    if (open) {
      insightsPanel.removeAttribute('hidden');
    } else {
      insightsPanel.setAttribute('hidden', '');
    }
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.textContent = open ? collapseLabel : expandLabel;
    billCard.classList.toggle('bill-card__bill-card--insights-open', open);
  };

  toggle.addEventListener('click', () => {
    setOpen(!insightsOpen);
  });
  collapseBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
  });

  if (expandLabel) {
    bar.append(toggle);
  }
  alert.append(bar, insightsPanel);
  billCard.append(alert);
}

export default function decorate(block) {
  const config = normalizeConfig(readBlockConfig(block));

  const wrapper = document.createElement('div');
  wrapper.className = 'bill-card__wrapper';

  if (config.eyebrow.trim()) {
    const topBar = document.createElement('div');
    topBar.className = 'bill-card__top';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'bill-card__eyebrow';
    eyebrow.textContent = config.eyebrow;

    topBar.append(eyebrow);
    wrapper.append(topBar);
  }

  const billCard = document.createElement('div');
  billCard.className = 'bill-card__bill-card';

  const billRow = document.createElement('div');
  billRow.className = 'bill-card__bill-row';

  const billSummary = document.createElement('div');
  billSummary.className = 'bill-card__bill-summary';

  const billLabel = document.createElement('p');
  billLabel.className = 'bill-card__bill-label';
  billLabel.textContent = config.billLabel;

  const billAmount = document.createElement('p');
  billAmount.className = 'bill-card__bill-amount';
  billAmount.textContent = config.amountDue;

  billSummary.append(billLabel, billAmount);

  const dueEl = document.createElement('p');
  dueEl.className = 'bill-card__bill-due';
  dueEl.textContent = config.dueDate;
  billSummary.append(dueEl);

  const periodEl = document.createElement('p');
  periodEl.className = 'bill-card__bill-period';
  periodEl.textContent = config.billingPeriod;
  billSummary.append(periodEl);

  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'bill-card__bill-cta';
  ctaWrap.append(createButton(config.billCtaLabel, config.billCtaLink));

  billRow.append(billSummary, ctaWrap);
  billCard.append(billRow);

  appendHighBillAlert(billCard, config);

  wrapper.append(billCard);

  const contentPlain = plainFromMarkup(config.content);
  if (contentPlain) {
    const contentSection = document.createElement('div');
    contentSection.className = 'bill-card__content';
    contentSection.innerHTML = config.content;
    wrapper.append(contentSection);
  }

  block.replaceChildren(wrapper);
}

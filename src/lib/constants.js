export const LOAN_STATUS_LABELS = {
  current:       'Current',
  '30_days':     '30 Days Delinquent',
  '60_days':     '60 Days Delinquent',
  '90_plus':     '90+ Days Delinquent',
  forbearance:   'Forbearance',
  modification:  'In Modification',
  foreclosure:   'Foreclosure',
  paid_off:      'Paid Off',
};

export const LOAN_STATUS_COLORS = {
  current:       'green',
  '30_days':     'amber',
  '60_days':     'orange',
  '90_plus':     'red',
  forbearance:   'red',
  modification:  'amber',
  foreclosure:   'red',
  paid_off:      'gray',
};

export const MODULE_META = {
  customer_service: { label: 'Customer Service', color: 'blue'   },
  collections:      { label: 'Collections',      color: 'orange' },
  loss_mitigation:  { label: 'Loss Mitigation',  color: 'red'    },
  payoff:           { label: 'Payoff / Refi',    color: 'teal'   },
  escrow:           { label: 'Escrow',           color: 'teal'   },
};

export const VIEW_LABELS = {
  loan_overview:           'Loan Overview',
  payment_history:         'Payment History',
  escrow_detail:           'Escrow Detail',
  documents:               'Documents',
  customer_service:        'Customer Service',
  collections_delinquency: 'Collections',
  lossmit_case:            'Loss Mitigation',
  payoff_quote:            'Payoff / Refi',
  notes_disposition:       'Notes & Disposition',
};

export const COMPLIANCE_LABELS = {
  fdcpa:         'FDCPA',
  scra:          'SCRA',
  fema:          'FEMA',
  bankruptcy:    'Bankruptcy',
  litigation:    'Litigation',
  cease_desist:  'Cease & Desist',
  dual_tracking: 'Dual Tracking',
};

export const SENTIMENT_LABELS = {
  positive: 'Positive',
  neutral:  'Neutral',
  negative: 'Negative',
};

export const formatCurrency = (n) => {
  if (n == null) return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
};

export const formatPercent = (n, digits = 2) => {
  if (n == null) return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return `${num.toFixed(digits)}%`;
};

export const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatShortDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
};

export const daysBetween = (a, b) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

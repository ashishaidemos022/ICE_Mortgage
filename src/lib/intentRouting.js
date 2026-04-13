export const INTENT_ROUTING = {
  payment_inquiry:  { module: 'customer_service',  view: 'loan_overview' },
  past_due:         { module: 'collections',       view: 'collections_delinquency' },
  hardship:         { module: 'loss_mitigation',   view: 'lossmit_case' },
  escrow:           { module: 'customer_service',  view: 'escrow_detail' },
  payoff:           { module: 'payoff',            view: 'payoff_quote' },
  general:          { module: 'customer_service',  view: 'loan_overview' },
  insurance_change: { module: 'customer_service',  view: 'escrow_detail' },
  pmi_inquiry:      { module: 'customer_service',  view: 'loan_overview' },
  document_request: { module: 'customer_service',  view: 'documents' },
};

export function routeIntent(intent) {
  return INTENT_ROUTING[intent] || INTENT_ROUTING.general;
}

const NAV = [
  {
    title: 'Dashboard',
    items: [
      { view: 'home_dashboard',  module: 'home',             label: 'Home',            glyph: '⌂' },
    ],
  },
  {
    title: 'Loan Navigation',
    items: [
      { view: 'loan_overview',   module: 'customer_service', label: 'Loan Overview',   glyph: '◉' },
      { view: 'payment_history', module: 'customer_service', label: 'Payment History', glyph: '⌗' },
      { view: 'escrow_detail',   module: 'customer_service', label: 'Escrow Detail',   glyph: '⎌' },
      { view: 'documents',       module: 'customer_service', label: 'Documents',       glyph: '▤' },
    ],
  },
  {
    title: 'Modules',
    items: [
      { view: 'customer_service',        module: 'customer_service', label: 'Customer Service', glyph: '☎' },
      { view: 'collections_delinquency', module: 'collections',      label: 'Collections',      glyph: '⚠' },
      { view: 'lossmit_case',            module: 'loss_mitigation',  label: 'Loss Mitigation',  glyph: '⚑' },
      { view: 'payoff_quote',            module: 'payoff',           label: 'Payoff / Refi',    glyph: '$' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { view: 'notes_disposition', module: 'customer_service', label: 'Notes & Disposition', glyph: '✎' },
    ],
  },
];

export default function Sidebar({ activeView, onNavigate, disabled }) {
  return (
    <div className="sidebar">
      {NAV.map((section) => (
        <div className="sidebar-section" key={section.title}>
          <div className="sidebar-section-title">{section.title}</div>
          {section.items.map((item) => (
            <button
              key={item.view}
              className={`sidebar-item ${activeView?.view === item.view ? 'active' : ''}`}
              onClick={() => !disabled && onNavigate({ module: item.module, view: item.view })}
              disabled={disabled}
            >
              <span className="glyph">{item.glyph}</span>
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

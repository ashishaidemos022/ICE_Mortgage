import { useCallback, useState } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import ContextPanel from './components/ContextPanel';
import ScreenPopOverlay from './components/ScreenPopOverlay';
import { useLoanData } from './hooks/useLoanData';
import { useScreenPop, markScreenPopConsumed } from './hooks/useScreenPop';
import { VIEW_LABELS, MODULE_META } from './lib/constants';

import HomeDashboard from './components/modules/HomeDashboard';
import LoanOverview from './components/modules/LoanOverview';
import PaymentHistory from './components/modules/PaymentHistory';
import EscrowDetail from './components/modules/EscrowDetail';
import Documents from './components/modules/Documents';
import CustomerService from './components/modules/CustomerService';
import Collections from './components/modules/Collections';
import LossMitigation from './components/modules/LossMitigation';
import PayoffRefi from './components/modules/PayoffRefi';
import NotesDisposition from './components/modules/NotesDisposition';

const DEFAULT_LOAN = '10478293';
const DEFAULT_VIEW = { module: 'home', view: 'home_dashboard' };

export default function App() {
  const [loanNumber, setLoanNumber] = useState(DEFAULT_LOAN);
  const [activeView, setActiveView] = useState(DEFAULT_VIEW);
  const [caller, setCaller] = useState(null);
  const [screenPop, setScreenPop] = useState(null);
  const [currentScreenPopId, setCurrentScreenPopId] = useState(null);
  const { data: loan, loading, error } = useLoanData(loanNumber);

  const handleIncoming = useCallback((pop) => {
    setScreenPop(pop);
    if (pop.loan_number) setLoanNumber(pop.loan_number);
    setCaller({
      name: pop.caller_name,
      phone: pop.caller_phone,
      auth_method: pop.auth_method,
      auth_score: pop.auth_score != null ? Number(pop.auth_score) : null,
    });
  }, []);

  useScreenPop({ onIncoming: handleIncoming });

  const handleAcceptPop = () => {
    if (!screenPop) return;
    setActiveView({ module: screenPop.target_module, view: screenPop.target_view });
    setCurrentScreenPopId(screenPop.id || null);
    markScreenPopConsumed(screenPop.id);
    setScreenPop(null);
  };

  const moduleMeta = MODULE_META[activeView.module] || { label: activeView.module, color: 'blue' };
  const isHome = activeView.view === 'home_dashboard';

  const openLoan = (loanNum) => {
    setLoanNumber(loanNum);
    setActiveView({ module: 'customer_service', view: 'loan_overview' });
  };

  const renderView = () => {
    if (activeView.view === 'home_dashboard') {
      return <HomeDashboard onOpenLoan={openLoan} />;
    }
    if (loading) return <div className="content-empty">Loading loan {loanNumber}…</div>;
    if (error)   return <div className="alert red"><div><div className="title">Error</div><div className="detail">{error.message}</div></div></div>;
    if (!loan)   return <div className="content-empty">No loan found for {loanNumber}.</div>;

    switch (activeView.view) {
      case 'loan_overview':           return <LoanOverview loan={loan} />;
      case 'payment_history':         return <PaymentHistory loan={loan} />;
      case 'escrow_detail':           return <EscrowDetail loan={loan} />;
      case 'documents':               return <Documents loan={loan} />;
      case 'customer_service':        return <CustomerService loan={loan} />;
      case 'collections_delinquency': return <Collections loan={loan} onReferLossMit={() => setActiveView({ module: 'loss_mitigation', view: 'lossmit_case' })} />;
      case 'lossmit_case':            return <LossMitigation loan={loan} />;
      case 'payoff_quote':            return <PayoffRefi loan={loan} />;
      case 'notes_disposition':       return <NotesDisposition loan={loan} screenPopId={currentScreenPopId} />;
      default:                        return <LoanOverview loan={loan} />;
    }
  };

  return (
    <div className={`app ${isHome ? 'no-context' : ''}`}>
      <TopBar activeLoan={loanNumber} onSelectLoan={(n) => { setLoanNumber(n); setCaller(null); setCurrentScreenPopId(null); }} />
      <Sidebar activeView={activeView} onNavigate={setActiveView} />

      <div className="main">
        <div className="content-header">
          <h1>{VIEW_LABELS[activeView.view] || activeView.view}</h1>
          <span className={`badge ${moduleMeta.color}`}>{moduleMeta.label}</span>
          <span className="spacer" />
          {loan && <span className="mono text-dim" style={{ fontSize: 11 }}>LOAN {loan.loan_number}</span>}
        </div>
        <div className="content-body">
          {renderView()}
        </div>
      </div>

      {!isHome && <ContextPanel loan={loan} caller={caller} activeView={activeView} />}

      <ScreenPopOverlay
        pop={screenPop}
        loan={loan}
        loading={loading}
        onAccept={handleAcceptPop}
        onDismiss={() => { if (screenPop) markScreenPopConsumed(screenPop.id); setScreenPop(null); }}
      />
    </div>
  );
}

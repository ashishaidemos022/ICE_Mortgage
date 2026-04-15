import { useCallInitiation } from '../hooks/useCallInitiation';

export default function PhoneLink({
  phone,
  loan,
  className = '',
  style,
  showIcon = true,
  stopPropagation = true,
}) {
  const { status, error, call } = useCallInitiation(loan);
  if (!phone) return null;

  const handleClick = (e) => {
    if (stopPropagation) e.stopPropagation();
    call(phone);
  };

  const statusLabel =
    status === 'calling' ? 'Calling…' :
    status === 'success' ? '✓ Dialed' :
    status === 'error'   ? '✗ Failed' : null;

  return (
    <span
      className={`phone-link ${status || ''} ${className}`}
      style={style}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e); }}
      title={error || `Click to call ${phone}`}
    >
      {showIcon && <span className="phone-link-icon">📞</span>}
      <span className="phone-link-number">{phone}</span>
      {statusLabel && <span className="phone-link-status">{statusLabel}</span>}
    </span>
  );
}

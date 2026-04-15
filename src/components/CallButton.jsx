import { useCallInitiation } from '../hooks/useCallInitiation';

export default function CallButton({
  loan,
  phone,
  label = '📞 Call Borrower',
  className = 'btn sm',
}) {
  const { status, error, call } = useCallInitiation(loan);
  const resolvedPhone = phone || loan?.borrower?.phone;

  const text =
    status === 'calling' ? 'Calling…' :
    status === 'success' ? '✓ Dialed' :
    status === 'error'   ? '✗ Failed' : label;

  return (
    <button
      className={className}
      onClick={() => call(resolvedPhone)}
      disabled={!resolvedPhone || status === 'calling'}
      title={error || (resolvedPhone ? `Initiate outbound call to ${resolvedPhone}` : 'No phone number')}
    >
      {text}
    </button>
  );
}

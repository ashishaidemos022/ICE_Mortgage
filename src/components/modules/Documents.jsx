import { formatShortDate } from '../../lib/constants';

const TYPE_COLORS = {
  statement: 'blue',
  escrow:    'teal',
  tax:       'amber',
  disclosure:'gray',
  legal:     'red',
  lossmit:   'red',
  correspondence: 'gray',
};

export default function Documents({ loan }) {
  const docs = (loan.documents || []).slice().sort((a, b) => new Date(b.document_date) - new Date(a.document_date));

  return (
    <div className="card">
      <div className="card-header"><h2>Document Library</h2><span className="count">{docs.length} documents</span></div>
      <div className="card-body tight">
        <table className="dense">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Date</th>
              <th>Delivery</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 500 }}>{d.document_name}</td>
                <td><span className={`badge ${TYPE_COLORS[d.document_type] || 'gray'}`}>{d.document_type}</span></td>
                <td>{formatShortDate(d.document_date)}</td>
                <td><span className={`badge ${d.delivery_status === 'delivered' ? 'green' : 'amber'}`}>{d.delivery_status}</span></td>
                <td>
                  <button className="btn sm" onClick={() => {}}>View</button>{' '}
                  <button className="btn sm" onClick={() => {}}>Download</button>{' '}
                  <button className="btn sm ghost" onClick={() => {}}>Email</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

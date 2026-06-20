import { useEffect, useState } from 'react';
import { getFee } from '../../api/feesApi';
import toast from 'react-hot-toast';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const STATUS_COLORS = {
  paid:    { bg: '#f0fdf4', border: '#16a34a', text: '#16a34a' },
  pending: { bg: '#fffbeb', border: '#d97706', text: '#d97706' },
  overdue: { bg: '#fff1f2', border: '#dc2626', text: '#dc2626' },
  partial: { bg: '#eff6ff', border: '#2563eb', text: '#2563eb' },
};

function Row({ label, value, bold }) {
  return (
    <tr>
      <td style={{ padding: '7px 12px', fontSize: 12, color: '#555', fontWeight: 600, width: '40%', borderBottom: '1px solid #f0f0f0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</td>
      <td style={{ padding: '7px 12px', fontSize: 13, color: '#111', fontWeight: bold ? 700 : 400, borderBottom: '1px solid #f0f0f0' }}>{value}</td>
    </tr>
  );
}

// ─── Embeddable receipt content ───────────────────────────────────────────────
export function FeeReceiptContent({ feeId, schoolName, schoolPhone, schoolAddress, schoolCity, schoolState }) {
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!feeId) return;
    setLoading(true);
    setFee(null);
    getFee(feeId)
      .then((res) => setFee(res.data.data))
      .catch(() => toast.error('Failed to load fee receipt'))
      .finally(() => setLoading(false));
  }, [feeId]);

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#999', fontSize: 14 }}>Loading...</div>;
  if (!fee) return null;

  const statusColor = STATUS_COLORS[fee.status] || { bg: '#f9fafb', border: '#6b7280', text: '#6b7280' };
  const receiptNo = fee._id?.slice(-8).toUpperCase();
  const items = fee.feeItems || [];
  const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
  const discount = fee.discount || 0;
  const finalAmount = fee.finalAmount ?? Math.max(0, subtotal - discount);

  return (
    <div
      className="fee-receipt-page"
      style={{
        maxWidth: 680, margin: '0 auto', background: '#fff',
        padding: '36px 44px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        borderRadius: 4, fontFamily: 'Georgia, "Times New Roman", serif', color: '#111',
      }}
    >
      {/* School Header */}
      <div style={{ textAlign: 'center', borderBottom: '3px double #1e3a5f', paddingBottom: 10, marginBottom: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1e3a5f', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
          {(schoolName || 'S')[0].toUpperCase()}
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e3a5f', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {schoolName || 'School Name'}
        </h1>
        {schoolAddress && (
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#555' }}>{schoolAddress}</p>
        )}
        {(schoolCity || schoolState || schoolPhone) && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#555' }}>
            {[schoolCity, schoolState].filter(Boolean).join(', ')}
            {schoolPhone ? ([schoolCity, schoolState].some(Boolean) ? '  |  ' : '') + '📞 ' + schoolPhone : ''}
          </p>
        )}
      </div>

      {/* Title + Receipt No */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1e3a5f' }}>
          Fee Receipt
        </h2>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Receipt No.</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#1e3a5f' }}>#{receiptNo}</p>
        </div>
      </div>

      {/* Student Info */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14, border: '1px solid #c0c0c0' }}>
        <tbody>
          <tr style={{ background: '#f0f4f8' }}>
            <td style={tdLabel}>Student Name</td>
            <td style={tdValue}>{fee.student?.firstName} {fee.student?.lastName}</td>
            <td style={tdLabel}>Roll Number</td>
            <td style={tdValue}>{fee.student?.rollNumber || '—'}</td>
          </tr>
          <tr>
            <td style={tdLabel}>Class & Section</td>
            <td style={tdValue}>Class {fee.student?.class}–{fee.student?.section}</td>
            <td style={tdLabel}>Student ID</td>
            <td style={{ ...tdValue, fontFamily: 'monospace', fontSize: 11 }}>{fee.student?.studentId || '—'}</td>
          </tr>
          <tr style={{ background: '#f0f4f8' }}>
            <td style={tdLabel}>Academic Year</td>
            <td style={tdValue}>{fee.academicYear}</td>
            <td style={tdLabel}>Date Issued</td>
            <td style={tdValue}>{fmt(fee.updatedAt || fee.createdAt)}</td>
          </tr>
        </tbody>
      </table>

      {/* Fee Items Breakdown */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #c0c0c0', marginBottom: 14 }}>
        <thead>
          <tr style={{ background: '#1e3a5f', color: '#fff' }}>
            <th style={{ ...thStyle, width: '6%' }}>#</th>
            <th style={thStyle}>Fee Type</th>
            <th style={thStyle}>Description</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '20%' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((item, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <td style={{ ...tbCell, color: '#888', fontSize: 11 }}>{i + 1}</td>
              <td style={{ ...tbCell, fontWeight: 600, textTransform: 'capitalize' }}>{item.feeType}</td>
              <td style={{ ...tbCell, color: '#555' }}>{item.description || '—'}</td>
              <td style={{ ...tbCell, textAlign: 'right' }}>₹{(item.amount || 0).toLocaleString('en-IN')}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4} style={{ ...tbCell, textAlign: 'center', color: '#999' }}>No fee items</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          {/* Subtotal row — only show when there are multiple items or discount */}
          {(items.length > 1 || discount > 0) && (
            <tr style={{ background: '#f5f5f5' }}>
              <td colSpan={3} style={{ ...tbCell, textAlign: 'right', fontWeight: 600, color: '#555', fontSize: 12 }}>Sub Total</td>
              <td style={{ ...tbCell, textAlign: 'right', fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</td>
            </tr>
          )}
          {discount > 0 && (
            <tr style={{ background: '#f0fff4' }}>
              <td colSpan={3} style={{ ...tbCell, textAlign: 'right', color: '#16a34a', fontWeight: 600, fontSize: 12 }}>Discount</td>
              <td style={{ ...tbCell, textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>– ₹{discount.toLocaleString('en-IN')}</td>
            </tr>
          )}
          <tr style={{ background: '#1e3a5f', color: '#fff' }}>
            <td colSpan={3} style={{ ...tbCell, color: '#fff', fontWeight: 700, textAlign: 'right', fontSize: 13 }}>Total Amount</td>
            <td style={{ ...tbCell, textAlign: 'right', color: '#fff', fontWeight: 800, fontSize: 15 }}>
              ₹{finalAmount.toLocaleString('en-IN')}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Payment Summary Row */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #c0c0c0', marginBottom: 14 }}>
        <tbody>
          <tr style={{ background: '#f0f4f8' }}>
            <td style={tdLabel}>Payment Status</td>
            <td style={tdValue}>
              <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: statusColor.bg, color: statusColor.text, border: `1px solid ${statusColor.border}` }}>
                {fee.status?.toUpperCase()}
              </span>
            </td>
            <td style={tdLabel}>Paid Amount</td>
            <td style={{ ...tdValue, color: '#16a34a', fontWeight: 700 }}>₹{(fee.paidAmount || 0).toLocaleString('en-IN')}</td>
          </tr>
          {fee.collectedBy?.name && (
            <tr>
              <td style={tdLabel}>Collected By</td>
              <td style={tdValue}>{fee.collectedBy.name}</td>
              <td style={tdLabel}>Balance Due</td>
              <td style={{ ...tdValue, color: (fee.balanceAmount || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                {(fee.balanceAmount || 0) > 0 ? `₹${(fee.balanceAmount || 0).toLocaleString('en-IN')}` : 'Nil'}
              </td>
            </tr>
          )}
          {!fee.collectedBy?.name && (
            <tr>
              <td style={tdLabel}>Balance Due</td>
              <td colSpan={3} style={{ ...tdValue, color: (fee.balanceAmount || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                {(fee.balanceAmount || 0) > 0 ? `₹${(fee.balanceAmount || 0).toLocaleString('en-IN')}` : 'Nil'}
              </td>
            </tr>
          )}
          {fee.remarks && (
            <tr>
              <td style={tdLabel}>Remarks</td>
              <td colSpan={3} style={tdValue}>{fee.remarks}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Payment Installments */}
      {(fee.payments || []).length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #c0c0c0', marginBottom: 14 }}>
          <thead>
            <tr style={{ background: '#374151', color: '#fff' }}>
              <th style={{ ...thStyle, width: '6%' }}>#</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Method</th>
              <th style={thStyle}>Transaction ID</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '20%' }}>Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            {(fee.payments || []).map((p, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ ...tbCell, color: '#888', fontSize: 11 }}>{i + 1}</td>
                <td style={tbCell}>{fmt(p.paidDate)}</td>
                <td style={{ ...tbCell, textTransform: 'capitalize' }}>{p.paymentMethod || '—'}</td>
                <td style={{ ...tbCell, fontFamily: 'monospace', fontSize: 11, color: '#555' }}>{p.transactionId || '—'}</td>
                <td style={{ ...tbCell, textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>₹{(p.amount || 0).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f0fdf4' }}>
              <td colSpan={4} style={{ ...tbCell, textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: 12 }}>Total Paid</td>
              <td style={{ ...tbCell, textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>₹{(fee.paidAmount || 0).toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Status banner */}
      <div style={{ textAlign: 'center', padding: '10px 24px', borderRadius: 6, background: statusColor.bg, border: `2px solid ${statusColor.border}`, marginBottom: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: statusColor.text, letterSpacing: '0.1em' }}>
          {fee.status === 'paid' ? '✓ PAID' : fee.status === 'partial' ? '◑ PARTIAL' : fee.status === 'overdue' ? '✗ OVERDUE' : '⏳ PENDING'}
        </span>
      </div>

      {/* Signature */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 12, borderTop: '1px solid #ddd' }}>
        {['Parent / Guardian', 'Accounts Staff', 'Principal'].map((label) => (
          <div key={label} style={{ textAlign: 'center', width: '28%' }}>
            <div style={{ borderBottom: '1px solid #333', marginBottom: 6, height: 36 }}></div>
            <p style={{ margin: 0, fontSize: 11, color: '#444', fontWeight: 600 }}>{label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#888' }}>Signature & Date</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 10, color: '#aaa', borderTop: '1px solid #eee', paddingTop: 8 }}>
        This is a computer-generated fee receipt. Issued by {schoolName || 'School'} via Vidyanet ERP.
      </p>
    </div>
  );
}

const thStyle = { padding: '9px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', borderRight: '1px solid rgba(255,255,255,0.2)' };
const tdLabel = { padding: '7px 12px', fontSize: 11, fontWeight: 700, color: '#444', borderRight: '1px solid #d0d0d0', borderBottom: '1px solid #d0d0d0', width: '18%', background: 'inherit', textTransform: 'uppercase', letterSpacing: '0.04em' };
const tdValue = { padding: '7px 12px', fontSize: 13, fontWeight: 600, color: '#111', borderRight: '1px solid #d0d0d0', borderBottom: '1px solid #d0d0d0', width: '32%' };
const tbCell  = { padding: '8px 12px', fontSize: 13, borderRight: '1px solid #d0d0d0', borderBottom: '1px solid #e0e0e0' };

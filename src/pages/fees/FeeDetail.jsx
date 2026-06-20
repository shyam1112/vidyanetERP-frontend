import { useEffect, useState } from 'react';
import { getFee } from '../../api/feesApi';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const statusVariant = { paid: 'success', pending: 'warning', overdue: 'danger', partial: 'info' };

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-sm text-gray-800 mt-0.5">{value || <span className="text-gray-300">—</span>}</p>
  </div>
);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

export default function FeeDetail({ feeId }) {
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!feeId) return;
    setLoading(true);
    getFee(feeId)
      .then((res) => setFee(res.data.data))
      .catch(() => toast.error('Failed to load fee details'))
      .finally(() => setLoading(false));
  }, [feeId]);

  if (loading) return <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>;
  if (!fee) return null;

  const isImage = fee.receiptUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(fee.receiptUrl);
  const isPdf = fee.receiptUrl && /\.pdf$/i.test(fee.receiptUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {fee.student?.firstName} {fee.student?.lastName}
          </h2>
          <p className="text-sm text-gray-500 font-mono">{fee.student?.studentId}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Class {fee.student?.class}–{fee.student?.section}
          </p>
        </div>
        <Badge variant={statusVariant[fee.status] || 'default'}>
          {fee.status?.charAt(0).toUpperCase() + fee.status?.slice(1)}
        </Badge>
      </div>

      {/* Fee Details */}
      <div>
        <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3 pb-1 border-b border-indigo-50">
          Fee Information
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Fee Type" value={fee.feeType?.charAt(0).toUpperCase() + fee.feeType?.slice(1)} />
          <Field label="Academic Year" value={fee.academicYear} />
          <Field label="Amount" value={`₹${fee.amount?.toLocaleString('en-IN')}`} />
          <Field label="Discount" value={fee.discount ? `₹${fee.discount.toLocaleString('en-IN')}` : '₹0'} />
          <Field
            label="Final Amount"
            value={<span className="font-semibold text-indigo-700">₹{fee.finalAmount?.toLocaleString('en-IN')}</span>}
          />
          <Field label="Paid Date" value={formatDate(fee.paidDate)} />
          <Field
            label="Payment Method"
            value={fee.paymentMethod ? fee.paymentMethod.toUpperCase() : null}
          />
          <Field label="Transaction ID" value={fee.transactionId} />
          {fee.collectedBy?.name && <Field label="Collected By" value={fee.collectedBy.name} />}
          {fee.remarks && <div className="col-span-2"><Field label="Remarks" value={fee.remarks} /></div>}
        </div>
      </div>

      {/* Receipt */}
      <div>
        <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3 pb-1 border-b border-indigo-50">
          Receipt
        </h3>
        {fee.receiptUrl ? (
          <div className="space-y-3">
            {isImage && (
              <img
                src={fee.receiptUrl}
                alt="Fee Receipt"
                className="w-full max-h-80 object-contain rounded-lg border border-gray-200"
              />
            )}
            {isPdf && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-3xl">📄</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">PDF Receipt</p>
                  <p className="text-xs text-gray-400">Click below to open</p>
                </div>
              </div>
            )}
            <a
              href={fee.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ↗ Open Receipt
            </a>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No receipt uploaded.</p>
        )}
      </div>
    </div>
  );
}

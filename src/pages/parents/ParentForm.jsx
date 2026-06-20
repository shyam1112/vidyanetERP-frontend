import { useState, useEffect } from 'react';
import { createParent, updateParent } from '../../api/parentApi';
import { getStudents } from '../../api/studentApi';
import toast from 'react-hot-toast';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

export default function ParentForm({ parent, onSaved, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    student: parent?.student?._id || '',
    'father.name': parent?.father?.name || '',
    'father.phone': parent?.father?.phone || '',
    'father.email': parent?.father?.email || '',
    'father.occupation': parent?.father?.occupation || '',
    'father.qualification': parent?.father?.qualification || '',
    'mother.name': parent?.mother?.name || '',
    'mother.phone': parent?.mother?.phone || '',
    'mother.email': parent?.mother?.email || '',
    'mother.occupation': parent?.mother?.occupation || '',
    'mother.qualification': parent?.mother?.qualification || '',
    'guardian.name': parent?.guardian?.name || '',
    'guardian.phone': parent?.guardian?.phone || '',
    'guardian.relation': parent?.guardian?.relation || '',
    'address.street': parent?.address?.street || '',
    'address.city': parent?.address?.city || '',
    'address.state': parent?.address?.state || '',
    'address.pincode': parent?.address?.pincode || '',
    annualIncome: parent?.annualIncome || '',
  });

  useEffect(() => {
    getStudents({ limit: 200 }).then((res) => setStudents(res.data.data)).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const buildPayload = () => {
    const payload = { student: form.student, annualIncome: form.annualIncome };
    ['father', 'mother', 'guardian', 'address'].forEach((group) => {
      payload[group] = {};
      Object.keys(form).filter((k) => k.startsWith(`${group}.`)).forEach((k) => {
        payload[group][k.split('.')[1]] = form[k];
      });
    });
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = buildPayload();
      if (parent) {
        await updateParent(parent._id, payload);
        toast.success('Parent updated');
      } else {
        await createParent(payload);
        toast.success('Parent record added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ title }) => (
    <h4 className="text-sm font-semibold text-gray-700 col-span-2 border-b pb-1">{title}</h4>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Student *">
        <select required value={form.student} onChange={set('student')} className={inputCls}>
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>{s.firstName} {s.lastName} — Class {s.class}-{s.section} ({s.studentId})</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Section title="Father's Details" />
        <Field label="Name"><input value={form['father.name']} onChange={set('father.name')} className={inputCls} /></Field>
        <Field label="Phone"><input value={form['father.phone']} onChange={set('father.phone')} className={inputCls} type="tel" /></Field>
        <Field label="Email"><input value={form['father.email']} onChange={set('father.email')} className={inputCls} type="email" /></Field>
        <Field label="Occupation"><input value={form['father.occupation']} onChange={set('father.occupation')} className={inputCls} /></Field>

        <Section title="Mother's Details" />
        <Field label="Name"><input value={form['mother.name']} onChange={set('mother.name')} className={inputCls} /></Field>
        <Field label="Phone"><input value={form['mother.phone']} onChange={set('mother.phone')} className={inputCls} type="tel" /></Field>
        <Field label="Email"><input value={form['mother.email']} onChange={set('mother.email')} className={inputCls} type="email" /></Field>
        <Field label="Occupation"><input value={form['mother.occupation']} onChange={set('mother.occupation')} className={inputCls} /></Field>

        <Section title="Guardian (if applicable)" />
        <Field label="Name"><input value={form['guardian.name']} onChange={set('guardian.name')} className={inputCls} /></Field>
        <Field label="Phone"><input value={form['guardian.phone']} onChange={set('guardian.phone')} className={inputCls} type="tel" /></Field>
        <Field label="Relation"><input value={form['guardian.relation']} onChange={set('guardian.relation')} className={inputCls} /></Field>
        <Field label="Annual Income (₹)"><input value={form.annualIncome} onChange={set('annualIncome')} className={inputCls} type="number" /></Field>

        <Section title="Address" />
        <div className="col-span-2"><Field label="Street"><input value={form['address.street']} onChange={set('address.street')} className={inputCls} /></Field></div>
        <Field label="City"><input value={form['address.city']} onChange={set('address.city')} className={inputCls} /></Field>
        <Field label="State"><input value={form['address.state']} onChange={set('address.state')} className={inputCls} /></Field>
        <Field label="Pincode"><input value={form['address.pincode']} onChange={set('address.pincode')} className={inputCls} /></Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Saving...' : parent ? 'Update' : 'Add Parent'}
        </button>
      </div>
    </form>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { BOARDS } from '../constants/academicYears';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

export default function Configuration() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    schoolName: '', phone: '', address: '', city: '', state: '', board: '', website: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    axiosInstance.get('/auth/me')
      .then((res) => {
        const u = res.data.user;
        setForm({
          schoolName: u.schoolName || '',
          phone: u.phone || '',
          address: u.address || '',
          city: u.city || '',
          state: u.state || '',
          board: u.board || '',
          website: u.website || '',
        });
      })
      .finally(() => setFetching(false));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.patch('/auth/profile', form);
      await refreshUser();
      toast.success('Configuration saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
        <p className="text-gray-500 mt-1 text-sm">Manage your school profile and settings</p>
      </div>

      {/* School Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-5">School Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="School Name">
            <input
              type="text"
              value={form.schoolName}
              onChange={set('schoolName')}
              required
              className={inputCls}
              placeholder="e.g. SOS School"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                className={inputCls}
                placeholder="+91 XXXXX XXXXX"
              />
            </Field>
            <Field label="Website">
              <input
                type="url"
                value={form.website}
                onChange={set('website')}
                className={inputCls}
                placeholder="https://yourschool.com"
              />
            </Field>
          </div>

          <Field label="Address">
            <textarea
              value={form.address}
              onChange={set('address')}
              className={inputCls}
              placeholder="Street / Area / Locality"
              rows={2}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City">
              <input
                type="text"
                value={form.city}
                onChange={set('city')}
                className={inputCls}
                placeholder="City"
              />
            </Field>
            <Field label="State">
              <input
                type="text"
                value={form.state}
                onChange={set('state')}
                className={inputCls}
                placeholder="State"
              />
            </Field>
          </div>

          <Field label="Board">
            <select value={form.board} onChange={set('board')} className={inputCls}>
              <option value="">Select board</option>
              {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Info (read-only) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Account Info</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-800">{user?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-800">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Role</span>
            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 capitalize">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

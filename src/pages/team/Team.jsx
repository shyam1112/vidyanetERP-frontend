import { useState, useEffect } from 'react';
import { getTeam, addMember, updateMember, resetMemberPassword, deleteMember } from '../../api/teamApi';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

const emptyForm = () => ({ name: '', email: '', password: '', role: 'teacher', phone: '' });

function MemberForm({ member, onSaved, onCancel }) {
  const [form, setForm] = useState(
    member
      ? { name: member.name, phone: member.phone || '', role: member.role }
      : emptyForm()
  );
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (member) {
        await updateMember(member._id, { name: form.name, phone: form.phone, role: form.role });
        toast.success('Member updated');
      } else {
        await addMember(form);
        toast.success('Member added. They can now log in.');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input required value={form.name} onChange={set('name')} className={inputCls} placeholder="e.g. Priya Sharma" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
          <select required value={form.role} onChange={set('role')} className={inputCls}>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input value={form.phone} onChange={set('phone')} className={inputCls} placeholder="10-digit number" />
        </div>
        {!member && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="teacher@school.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input required type="password" value={form.password} onChange={set('password')} className={inputCls} placeholder="Min 6 characters" minLength={6} />
            </div>
          </>
        )}
      </div>
      {!member && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
          The teacher/staff will log in at the same login page using this email and password.
        </p>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Saving...' : member ? 'Update' : 'Add Member'}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordModal({ member, onClose }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await resetMemberPassword(member._id, password);
      toast.success('Password reset successfully');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">Reset password for <span className="font-semibold">{member.name}</span></p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Min 6 characters" minLength={6} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
        <input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} placeholder="Re-enter password" />
        {confirm && password !== confirm && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </form>
  );
}

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [resetMember, setResetMember] = useState(null);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await getTeam();
      setMembers(res.data.data);
    } catch {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleToggleActive = async (member) => {
    try {
      await updateMember(member._id, { isActive: !member.isActive });
      toast.success(member.isActive ? 'Member deactivated' : 'Member activated');
      fetchTeam();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this team member? They will no longer be able to log in.')) return;
    try {
      await deleteMember(id);
      toast.success('Member removed');
      fetchTeam();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditMember(null);
    fetchTeam();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Team</h2>
          <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditMember(null); setShowModal(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-1">No team members yet</p>
            <p className="text-sm text-gray-400">Add teachers and staff so they can access the portal.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Email', 'Role', 'Phone', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs">
                        {m.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={m.role === 'admin' ? 'warning' : 'info'}>
                      {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={m.isActive ? 'success' : 'danger'}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => { setEditMember(m); setShowModal(true); }} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                      <button onClick={() => setResetMember(m)} className="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Reset Password</button>
                      <button onClick={() => handleToggleActive(m)} className={`text-xs font-medium ${m.isActive ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-800'}`}>
                        {m.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(m._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditMember(null); }} title={editMember ? 'Edit Member' : 'Add Team Member'} size="md">
        <MemberForm member={editMember} onSaved={handleSaved} onCancel={() => { setShowModal(false); setEditMember(null); }} />
      </Modal>

      <Modal isOpen={!!resetMember} onClose={() => setResetMember(null)} title="Reset Password" size="sm">
        {resetMember && <ResetPasswordModal member={resetMember} onClose={() => setResetMember(null)} />}
      </Modal>
    </div>
  );
}

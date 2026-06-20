import { useState, useEffect } from 'react';
import { createStudent, updateStudent, getStudent } from '../../api/studentApi';
import toast from 'react-hot-toast';

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
import { ACADEMIC_YEARS } from '../../constants/academicYears';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

const Field = ({ label, children, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div className="col-span-2 border-b border-gray-200 pb-2 mt-2">
    <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

const emptyForm = (student, parent) => ({
  // Student basic
  studentId: student?.studentId || '',
  firstName: student?.firstName || '',
  lastName: student?.lastName || '',
  dateOfBirth: student?.dateOfBirth?.split('T')[0] || '',
  gender: student?.gender || 'male',
  class: student?.class || '',
  section: student?.section || '',
  rollNumber: student?.rollNumber || '',
  academicYear: student?.academicYear || '2025-2026',
  bloodGroup: student?.bloodGroup || '',
  phone: student?.phone || '',
  email: student?.email || '',
  isActive: student?.isActive !== false,
  // Address
  street: student?.address?.street || '',
  city: student?.address?.city || '',
  state: student?.address?.state || '',
  pincode: student?.address?.pincode || '',
  // Father
  fatherName: parent?.father?.name || '',
  fatherPhone: parent?.father?.phone || '',
  fatherEmail: parent?.father?.email || '',
  fatherOccupation: parent?.father?.occupation || '',
  fatherQualification: parent?.father?.qualification || '',
  // Mother
  motherName: parent?.mother?.name || '',
  motherPhone: parent?.mother?.phone || '',
  motherEmail: parent?.mother?.email || '',
  motherOccupation: parent?.mother?.occupation || '',
  motherQualification: parent?.mother?.qualification || '',
});

export default function StudentForm({ student, onSaved, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!student);
  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState(emptyForm(student, null));

  useEffect(() => {
    if (!student) return;
    // Fetch full student + parent data when editing
    getStudent(student._id)
      .then((res) => {
        setForm(emptyForm(res.data.data, res.data.parent));
      })
      .catch(() => toast.error('Could not load parent details'))
      .finally(() => setFetching(false));
  }, [student]);

  const set = (key) => (e) =>
    setForm((prev) => ({
      ...prev,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);

      if (student) {
        await updateStudent(student._id, fd);
        toast.success('Student updated');
        onSaved(null);
      } else {
        const res = await createStudent(fd);
        toast.success('Student added');
        onSaved(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="py-10 text-center text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Student Information ── */}
      <div className="grid grid-cols-2 gap-4">
        <SectionTitle title="Student Information" />

        <Field label="Student ID" required>
          <input required value={form.studentId} onChange={set('studentId')} className={inputCls} placeholder="STU001" />
        </Field>
        <Field label="Academic Year" required>
          <select required value={form.academicYear} onChange={set('academicYear')} className={inputCls}>
            {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
        <Field label="First Name" required>
          <input required value={form.firstName} onChange={set('firstName')} className={inputCls} />
        </Field>
        <Field label="Last Name" required>
          <input required value={form.lastName} onChange={set('lastName')} className={inputCls} />
        </Field>
        <Field label="Date of Birth" required>
          <input required type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inputCls} />
        </Field>
        <Field label="Gender" required>
          <select required value={form.gender} onChange={set('gender')} className={inputCls}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Class" required>
          <select required value={form.class} onChange={set('class')} className={inputCls}>
            <option value="">Select class</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Section" required>
          <select required value={form.section} onChange={set('section')} className={inputCls}>
            <option value="">Select section</option>
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Roll Number" required>
          <input required value={form.rollNumber} onChange={set('rollNumber')} className={inputCls} />
        </Field>
        <Field label="Blood Group">
          <select value={form.bloodGroup} onChange={set('bloodGroup')} className={inputCls}>
            <option value="">Select</option>
            {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={set('phone')} className={inputCls} type="tel" />
        </Field>
        <Field label="Email">
          <input value={form.email} onChange={set('email')} className={inputCls} type="email" />
        </Field>
      </div>

      {/* ── Address ── */}
      <div className="grid grid-cols-2 gap-4">
        <SectionTitle title="Address" />
        <div className="col-span-2">
          <Field label="Street">
            <input value={form.street} onChange={set('street')} className={inputCls} />
          </Field>
        </div>
        <Field label="City">
          <input value={form.city} onChange={set('city')} className={inputCls} />
        </Field>
        <Field label="State">
          <input value={form.state} onChange={set('state')} className={inputCls} />
        </Field>
        <Field label="Pincode">
          <input value={form.pincode} onChange={set('pincode')} className={inputCls} />
        </Field>
      </div>

      {/* ── Father Information ── */}
      <div className="grid grid-cols-2 gap-4">
        <SectionTitle title="Father's Information" subtitle="Optional — leave blank if not applicable" />
        <Field label="Father's Name">
          <input value={form.fatherName} onChange={set('fatherName')} className={inputCls} />
        </Field>
        <Field label="Phone">
          <input value={form.fatherPhone} onChange={set('fatherPhone')} className={inputCls} type="tel" />
        </Field>
        <Field label="Email">
          <input value={form.fatherEmail} onChange={set('fatherEmail')} className={inputCls} type="email" />
        </Field>
        <Field label="Occupation">
          <input value={form.fatherOccupation} onChange={set('fatherOccupation')} className={inputCls} />
        </Field>
        <Field label="Qualification">
          <input value={form.fatherQualification} onChange={set('fatherQualification')} className={inputCls} />
        </Field>
      </div>

      {/* ── Mother Information ── */}
      <div className="grid grid-cols-2 gap-4">
        <SectionTitle title="Mother's Information" subtitle="Optional — leave blank if not applicable" />
        <Field label="Mother's Name">
          <input value={form.motherName} onChange={set('motherName')} className={inputCls} />
        </Field>
        <Field label="Phone">
          <input value={form.motherPhone} onChange={set('motherPhone')} className={inputCls} type="tel" />
        </Field>
        <Field label="Email">
          <input value={form.motherEmail} onChange={set('motherEmail')} className={inputCls} type="email" />
        </Field>
        <Field label="Occupation">
          <input value={form.motherOccupation} onChange={set('motherOccupation')} className={inputCls} />
        </Field>
        <Field label="Qualification">
          <input value={form.motherQualification} onChange={set('motherQualification')} className={inputCls} />
        </Field>
      </div>

      {/* ── Photo & Status ── */}
      <div className="grid grid-cols-2 gap-4">
        <SectionTitle title="Photo & Status" />
        <div className="col-span-2">
          <Field label="Student Photo">
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="text-sm text-gray-600" />
            {student?.photo && (
              <img src={student.photo} alt="Current" className="mt-2 w-16 h-16 rounded-lg object-cover" />
            )}
          </Field>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={set('isActive')} />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active Student</label>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-2 border-t">
        <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
        </button>
      </div>
    </form>
  );
}

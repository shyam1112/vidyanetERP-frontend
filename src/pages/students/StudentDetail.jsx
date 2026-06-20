import { useEffect, useState } from 'react';
import { getStudent } from '../../api/studentApi';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-sm text-gray-800 mt-0.5">{value || <span className="text-gray-300">—</span>}</p>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3 pb-1 border-b border-indigo-50">
      {title}
    </h3>
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
  </div>
);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

export default function StudentDetail({ studentId }) {
  const [student, setStudent] = useState(null);
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    getStudent(studentId)
      .then((res) => {
        setStudent(res.data.data);
        setParent(res.data.parent);
      })
      .catch(() => toast.error('Failed to load student details'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>;
  if (!student) return null;

  const addr = student.address;
  const fullAddress = [addr?.street, addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        {student.photo ? (
          <img src={student.photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
            {student.firstName[0]}{student.lastName[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900">{student.firstName} {student.lastName}</h2>
          <p className="text-sm text-gray-500 font-mono">{student.studentId}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={student.isActive ? 'success' : 'danger'}>
              {student.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-xs text-gray-400">Class {student.class} – {student.section} | Roll {student.rollNumber}</span>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <Section title="Student Information">
        <Field label="First Name" value={student.firstName} />
        <Field label="Last Name" value={student.lastName} />
        <Field label="Date of Birth" value={formatDate(student.dateOfBirth)} />
        <Field label="Gender" value={student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : null} />
        <Field label="Blood Group" value={student.bloodGroup} />
        <Field label="Academic Year" value={student.academicYear} />
        <Field label="Admission Date" value={formatDate(student.admissionDate)} />
        <Field label="Phone" value={student.phone} />
        <Field label="Email" value={student.email} />
        <Field label="Address" value={fullAddress} />
      </Section>

      {/* Father */}
      {parent?.father?.name && (
        <Section title="Father's Information">
          <Field label="Name" value={parent.father.name} />
          <Field label="Phone" value={parent.father.phone} />
          <Field label="Email" value={parent.father.email} />
          <Field label="Occupation" value={parent.father.occupation} />
          <Field label="Qualification" value={parent.father.qualification} />
        </Section>
      )}

      {/* Mother */}
      {parent?.mother?.name && (
        <Section title="Mother's Information">
          <Field label="Name" value={parent.mother.name} />
          <Field label="Phone" value={parent.mother.phone} />
          <Field label="Email" value={parent.mother.email} />
          <Field label="Occupation" value={parent.mother.occupation} />
          <Field label="Qualification" value={parent.mother.qualification} />
        </Section>
      )}

      {!parent?.father?.name && !parent?.mother?.name && (
        <p className="text-sm text-gray-400 text-center py-2">No parent information on record.</p>
      )}
    </div>
  );
}

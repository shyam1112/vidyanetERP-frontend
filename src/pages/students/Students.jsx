import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, deleteStudent } from '../../api/studentApi';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import StudentForm from './StudentForm';
import StudentDetail from './StudentDetail';
import toast from 'react-hot-toast';

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [viewStudentId, setViewStudentId] = useState(null);
  const [addedStudent, setAddedStudent] = useState(null);
  const limit = 10;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudents({ page, limit, search, class: filterClass });
      setStudents(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterClass]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await deleteStudent(id);
      toast.success('Student deleted');
      fetchStudents();
    } catch {
      toast.error('Failed to delete student');
    }
  };

  const handleEdit = (student) => {
    setEditStudent(student);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditStudent(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditStudent(null);
  };

  const handleSaved = (newStudent) => {
    handleModalClose();
    fetchStudents();
    if (newStudent) {
      setAddedStudent(newStudent);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Students</h2>
          <p className="text-sm text-gray-500">{total} total students</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add Student
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filterClass}
          onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
          className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Classes</option>
          {['1','2','3','4','5','6','7','8','9','10','11','12'].map((c) => (
            <option key={c} value={c}>Class {c}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No students found</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {students.map((s) => (
                <div key={s._id} className="p-4 flex items-center gap-3">
                  {s.photo ? (
                    <img src={s.photo} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Class {s.class}-{s.section} · Roll {s.rollNumber} · <span className="font-mono">{s.studentId}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={s.isActive ? 'success' : 'danger'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                      <span className="text-xs text-gray-400 capitalize">{s.gender}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => setViewStudentId(s._id)} className="text-xs text-gray-500 font-medium px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200">View</button>
                    <button onClick={() => handleEdit(s)} className="text-xs text-indigo-600 font-medium px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100">Edit</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Student ID', 'Name', 'Class', 'Roll No', 'Gender', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.studentId}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.photo ? (
                            <img src={s.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium text-xs">
                              {s.firstName[0]}{s.lastName[0]}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{s.firstName} {s.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{s.class}-{s.section}</td>
                      <td className="px-4 py-3">{s.rollNumber}</td>
                      <td className="px-4 py-3 capitalize">{s.gender}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.isActive ? 'success' : 'danger'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setViewStudentId(s._id)} className="text-gray-500 hover:text-gray-800 text-xs font-medium">View</button>
                          <button onClick={() => handleEdit(s)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {total > limit && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-gray-600">
            <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={handleModalClose} title={editStudent ? 'Edit Student' : 'Add Student'} size="lg">
        <StudentForm student={editStudent} onSaved={handleSaved} onCancel={handleModalClose} />
      </Modal>

      <Modal isOpen={!!viewStudentId} onClose={() => setViewStudentId(null)} title="Student Details" size="lg">
        <StudentDetail studentId={viewStudentId} />
      </Modal>

      {/* Add Fees prompt after new student created */}
      <Modal isOpen={!!addedStudent} onClose={() => setAddedStudent(null)} title="Student Added" size="sm">
        {addedStudent && (
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-3xl">✓</div>
            <div>
              <p className="text-base font-semibold text-gray-900">
                {addedStudent.firstName} {addedStudent.lastName}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Class {addedStudent.class}-{addedStudent.section} · ID: {addedStudent.studentId}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Would you like to add a fee record for this student now?
            </p>
            <div className="flex gap-3 justify-center pt-1">
              <button
                onClick={() => {
                  const s = addedStudent;
                  setAddedStudent(null);
                  navigate('/fees', { state: { prefillStudentId: s._id, prefillStudentName: `${s.firstName} ${s.lastName}` } });
                }}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                💰 Add Fees
              </button>
              <button
                onClick={() => setAddedStudent(null)}
                className="bg-gray-100 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

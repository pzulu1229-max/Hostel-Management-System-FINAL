import React, { useState, useEffect } from 'react';
import api from '../services/api';

function AdminPanel({ user, onLogout }) {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('all');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({ room_number: '', capacity: 4, price: 500, description: '' });
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', password: '', role: 'student' });

  useEffect(() => {
    if (user.role === 'warden') fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPendingBookings(),
      fetchAllBookings(),
      fetchStudents(),
      fetchRooms(),
      fetchAllComplaints()
    ]);
    setLoading(false);
  };

  const fetchPendingBookings = async () => {
    try {
      const response = await api.get('/admin/pending-bookings');
      setPendingBookings(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await api.get('/admin/all-bookings');
      setAllBookings(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchAllComplaints = async () => {
    try {
      const response = await api.get('/complaints/all');
      setAllComplaints(response.data);
    } catch (err) { console.error(err); }
  };

  const handleApprove = async (bookingId) => {
    try {
      await api.put(`/admin/approve/${bookingId}`);
      setMessage('Booking approved successfully!');
      setTimeout(() => setMessage(''), 3000);
      fetchAllData();
    } catch (err) { alert('Error approving booking'); }
  };

  const handleReject = async (bookingId) => {
    if (window.confirm('Are you sure you want to reject this booking?')) {
      try {
        await api.put(`/admin/reject/${bookingId}`);
        setMessage('Booking rejected');
        setTimeout(() => setMessage(''), 3000);
        fetchAllData();
      } catch (err) { alert('Error rejecting booking'); }
    }
  };

  const handleRevokeApproval = async (bookingId) => {
    if (window.confirm('Revoke approval? This will put the booking back to pending status.')) {
      try {
        await api.put(`/admin/revoke-approval/${bookingId}`);
        setMessage('Approval revoked! Booking is now pending.');
        setTimeout(() => setMessage(''), 3000);
        fetchAllData();
      } catch (err) { alert('Error revoking approval'); }
    }
  };

  const handleDeleteBooking = async (bookingId, studentName, roomNumber) => {
    if (window.confirm(`Delete booking #${bookingId} for ${studentName} (Room ${roomNumber})?`)) {
      try {
        await api.delete(`/admin/booking/${bookingId}`);
        setMessage(`Booking #${bookingId} deleted successfully!`);
        fetchAllData();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) { alert('Error deleting booking'); }
    }
  };

  const handleClearAllBookings = async () => {
    if (window.confirm('WARNING: This will delete ALL bookings from the database!')) {
      try {
        await api.delete('/admin/clear-all-bookings');
        setMessage('All bookings have been cleared from the database!');
        setShowClearModal(false);
        fetchAllData();
        setTimeout(() => setMessage(''), 4000);
      } catch (err) { alert('Error clearing bookings'); }
    }
  };

  const handleAddRoom = async () => {
    try {
      await api.post('/rooms', roomForm);
      setMessage('Room added successfully!');
      setShowRoomForm(false);
      setRoomForm({ room_number: '', capacity: 4, price: 500, description: '' });
      fetchRooms();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert('Error adding room'); }
  };

  const handleEditRoom = async () => {
    try {
      await api.put(`/rooms/${editingRoom.id}`, roomForm);
      setMessage('Room updated successfully!');
      setEditingRoom(null);
      setShowRoomForm(false);
      setRoomForm({ room_number: '', capacity: 4, price: 500, description: '' });
      fetchRooms();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert('Error updating room'); }
  };

  const handleDeleteRoom = async (roomId, roomNumber) => {
    if (window.confirm(`Are you sure you want to delete Room ${roomNumber}?`)) {
      try {
        await api.delete(`/rooms/${roomId}`);
        setMessage(`Room ${roomNumber} deleted successfully!`);
        fetchRooms();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) { alert('Error deleting room'); }
    }
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      room_number: room.room_number,
      capacity: room.capacity,
      price: room.price,
      description: room.description || ''
    });
    setShowRoomForm(true);
  };

  const handleAddStudent = async () => {
    try {
      await api.post('/auth/register', studentForm);
      setMessage('Student added successfully!');
      setShowStudentForm(false);
      setStudentForm({ name: '', email: '', password: '', role: 'student' });
      fetchStudents();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert('Error adding student'); }
  };

  const handleEditStudent = async () => {
    try {
      await api.put(`/admin/students/${editingStudent.id}`, studentForm);
      setMessage('Student updated successfully!');
      setEditingStudent(null);
      setShowStudentForm(false);
      setStudentForm({ name: '', email: '', password: '', role: 'student' });
      fetchStudents();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert('Error updating student'); }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to delete student ${studentName}?`)) {
      try {
        await api.delete(`/admin/students/${studentId}`);
        setMessage(`Student ${studentName} deleted successfully!`);
        fetchStudents();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) { alert('Error deleting student'); }
    }
  };

  const openEditStudent = (student) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name,
      email: student.email,
      password: '',
      role: student.role
    });
    setShowStudentForm(true);
  };

  const handleUpdateComplaintStatus = async (complaintId, status) => {
    try {
      await api.put(`/complaints/${complaintId}/status`, { status });
      setMessage(`Complaint marked as ${status}`);
      fetchAllData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert('Error updating complaint status'); }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (window.confirm('Delete this complaint?')) {
      try {
        await api.delete(`/complaints/${complaintId}`);
        setMessage('Complaint deleted successfully');
        fetchAllData();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) { alert('Error deleting complaint'); }
    }
  };

  const filteredPending = pendingBookings.filter(b => 
    b.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllBookings = allBookings.filter(b => 
    b.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRooms = rooms.filter(room => {
    if (roomSearchTerm && !room.room_number.toLowerCase().includes(roomSearchTerm.toLowerCase())) return false;
    if (roomStatusFilter !== 'all') {
      const occ = room.current_occupancy || 0;
      const cap = room.capacity || 4;
      if (roomStatusFilter === 'available' && occ > 0) return false;
      if (roomStatusFilter === 'partial' && (occ === 0 || occ >= cap)) return false;
      if (roomStatusFilter === 'full' && occ < cap) return false;
    }
    return true;
  });

  if (user.role !== 'warden') {
    return (
      <div style={styles.accessDenied}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <button onClick={onLogout} style={styles.backBtn}>Go Back</button>
      </div>
    );
  }

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  const availableCount = rooms.filter(r => (r.current_occupancy || 0) === 0).length;
  const partialCount = rooms.filter(r => (r.current_occupancy || 0) > 0 && (r.current_occupancy || 0) < (r.capacity || 4)).length;
  const fullCount = rooms.filter(r => (r.current_occupancy || 0) >= (r.capacity || 4)).length;

  return (
    <div style={styles.appContainer}>
      <nav style={styles.nav}>
        <h2 style={styles.navTitle}>Hostel Manager - Admin Panel</h2>
        <div style={styles.navRight}>
          <span style={styles.userName}>Welcome, {user.name}</span>
          <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.mainLayout}>
        <div style={styles.sidebar}>
          <button onClick={() => { setActiveTab('pending'); setSearchTerm(''); }} style={activeTab === 'pending' ? styles.sidebarActive : styles.sidebarBtn}>
            ⏳ Pending Approvals ({pendingBookings.length})
          </button>
          <button onClick={() => { setActiveTab('bookings'); setSearchTerm(''); }} style={activeTab === 'bookings' ? styles.sidebarActive : styles.sidebarBtn}>
            📋 All Bookings
          </button>
          <button onClick={() => { setActiveTab('rooms'); setRoomSearchTerm(''); setRoomStatusFilter('all'); }} style={activeTab === 'rooms' ? styles.sidebarActive : styles.sidebarBtn}>
            🏠 Manage Rooms ({rooms.length})
          </button>
          <button onClick={() => { setActiveTab('students'); setSearchTerm(''); }} style={activeTab === 'students' ? styles.sidebarActive : styles.sidebarBtn}>
            👨‍🎓 Manage Students ({students.length})
          </button>
          <button onClick={() => { setActiveTab('complaints'); setSearchTerm(''); }} style={activeTab === 'complaints' ? styles.sidebarActive : styles.sidebarBtn}>
            📋 Manage Complaints ({allComplaints.length})
          </button>
          <div style={styles.sidebarDivider}></div>
          <button onClick={() => setShowClearModal(true)} style={styles.sidebarDangerBtn}>
            🗑️ Clear All Bookings
          </button>
        </div>

        <div style={styles.contentArea}>
          {showClearModal && (
            <div style={styles.modal}>
              <div style={styles.modalContent}>
                <h3 style={{ color: '#f44336' }}>Clear All Bookings</h3>
                <p>Are you sure you want to delete ALL bookings from the database?</p>
                <p><strong>This action cannot be undone!</strong></p>
                <div style={styles.modalActions}>
                  <button onClick={handleClearAllBookings} style={styles.dangerBtn}>Yes, Delete All</button>
                  <button onClick={() => setShowClearModal(false)} style={styles.cancelBtn}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pending' && (
            <div>
              <h3>Pending Booking Approvals</h3>
              <div style={styles.searchContainer}>
                <input type="text" placeholder="Search by student, room, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                {searchTerm && <button onClick={() => setSearchTerm('')} style={styles.clearSearchBtn}>Clear</button>}
              </div>
              <p style={styles.resultCount}>Found {filteredPending.length} pending bookings</p>
              {filteredPending.length === 0 && <div style={styles.emptyState}><p>No pending bookings!</p></div>}
              {filteredPending.map(booking => (
                <div key={booking.id} style={styles.bookingCard}>
                  <div style={styles.bookingInfo}>
                    <h4>Booking #{booking.id}</h4>
                    <p><strong>Student:</strong> {booking.user_name}</p>
                    <p><strong>Email:</strong> {booking.email}</p>
                    <p><strong>Room:</strong> {booking.room_number}</p>
                    <p><strong>Price:</strong> K{booking.price}/month</p>
                    <p><strong>Booked on:</strong> {new Date(booking.allocated_date).toLocaleDateString()}</p>
                  </div>
                  <div style={styles.actions}>
                    <button onClick={() => handleApprove(booking.id)} style={styles.approveBtn}>Approve</button>
                    <button onClick={() => handleReject(booking.id)} style={styles.rejectBtn}>Reject</button>
                    <button onClick={() => handleDeleteBooking(booking.id, booking.user_name, booking.room_number)} style={styles.deleteBtnSmall}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h3>All Bookings</h3>
              <div style={styles.searchContainer}>
                <input type="text" placeholder="Search by student, room, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                {searchTerm && <button onClick={() => setSearchTerm('')} style={styles.clearSearchBtn}>Clear</button>}
              </div>
              <p style={styles.resultCount}>Found {filteredAllBookings.length} bookings</p>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Student</th>
                      <th style={styles.th}>Room</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Approval</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllBookings.map(booking => (
                      <tr key={booking.id}>
                        <td style={styles.td}>{booking.id}</td>
                        <td style={styles.td}>{booking.user_name}</td>
                        <td style={styles.td}>{booking.room_number}</td>
                        <td style={styles.td}>{new Date(booking.allocated_date).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <span style={{...styles.approvalBadge, background: booking.approval_status === 'approved' ? '#4caf50' : booking.approval_status === 'rejected' ? '#f44336' : '#ff9800'}}>
                            {booking.approval_status || 'pending'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {booking.approval_status === 'approved' && <button onClick={() => handleRevokeApproval(booking.id)} style={styles.smallBtn}>Revoke</button>}
                          <button onClick={() => handleDeleteBooking(booking.id, booking.user_name, booking.room_number)} style={styles.deleteBtnSmall}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div>
              <div style={styles.sectionHeader}>
                <h3>Room Management</h3>
                <button onClick={() => { setShowRoomForm(true); setEditingRoom(null); }} style={styles.addBtn}>+ Add New Room</button>
              </div>
              
              <div style={styles.roomStatsContainer}>
                <div style={styles.roomStatCard}><div style={styles.roomStatNumber}>{rooms.length}</div><div style={styles.roomStatLabel}>Total Rooms</div></div>
                <div style={styles.roomStatCard}><div style={styles.roomStatNumber}>{availableCount}</div><div style={styles.roomStatLabel}>Available</div></div>
                <div style={styles.roomStatCard}><div style={styles.roomStatNumber}>{partialCount}</div><div style={styles.roomStatLabel}>Partially Filled</div></div>
                <div style={styles.roomStatCard}><div style={styles.roomStatNumber}>{fullCount}</div><div style={styles.roomStatLabel}>Full</div></div>
              </div>
              
              <div style={styles.filterSection}>
                <div style={styles.searchContainer}>
                  <input type="text" placeholder="Search by room number..." value={roomSearchTerm} onChange={(e) => setRoomSearchTerm(e.target.value)} style={styles.searchInput} />
                  {roomSearchTerm && <button onClick={() => setRoomSearchTerm('')} style={styles.clearSearchBtn}>Clear</button>}
                </div>
                <select value={roomStatusFilter} onChange={(e) => setRoomStatusFilter(e.target.value)} style={styles.filterSelect}>
                  <option value="all">All Rooms</option>
                  <option value="available">Available Only</option>
                  <option value="partial">Partially Filled</option>
                  <option value="full">Full Only</option>
                </select>
              </div>
              <p style={styles.resultCount}>Found {filteredRooms.length} rooms</p>
              
              {showRoomForm && (
                <div style={styles.modal}>
                  <div style={styles.modalContent}>
                    <h3>{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
                    <input type="text" placeholder="Room Number" value={roomForm.room_number} onChange={(e) => setRoomForm({...roomForm, room_number: e.target.value})} style={styles.input} />
                    <select value={roomForm.capacity} onChange={(e) => setRoomForm({...roomForm, capacity: parseInt(e.target.value)})} style={styles.input}>
                      <option value={1}>1 Person</option><option value={2}>2 Persons</option>
                      <option value={3}>3 Persons</option><option value={4}>4 Persons</option>
                      <option value={6}>6 Persons</option>
                    </select>
                    <input type="number" placeholder="Price per month (K)" value={roomForm.price} onChange={(e) => setRoomForm({...roomForm, price: parseInt(e.target.value)})} style={styles.input} />
                    <textarea placeholder="Description" value={roomForm.description} onChange={(e) => setRoomForm({...roomForm, description: e.target.value})} style={styles.textarea} rows="3" />
                    <div style={styles.modalActions}>
                      <button onClick={editingRoom ? handleEditRoom : handleAddRoom} style={styles.saveBtn}>Save</button>
                      <button onClick={() => { setShowRoomForm(false); setEditingRoom(null); }} style={styles.cancelBtn}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Room</th>
                      <th style={styles.th}>Capacity</th>
                      <th style={styles.th}>Price</th>
                      <th style={styles.th}>Occupancy</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.map(room => {
                      const currentOcc = room.current_occupancy || 0;
                      const capacity = room.capacity || 4;
                      let statusText = '', statusColor = '';
                      if (currentOcc === 0) { statusText = 'Available'; statusColor = '#4caf50'; }
                      else if (currentOcc < capacity) { statusText = 'Partially Filled'; statusColor = '#ff9800'; }
                      else { statusText = 'Full'; statusColor = '#f44336'; }
                      return (
                        <tr key={room.id}>
                          <td style={styles.td}><strong>{room.room_number}</strong></td>
                          <td style={styles.td}>{capacity} persons</td>
                          <td style={styles.td}>K{room.price}</td>
                          <td style={styles.td}>{currentOcc}/{capacity}</td>
                          <td style={styles.td}><span style={{...styles.statusBadge, background: statusColor}}>{statusText}</span></td>
                          <td style={styles.td}>
                            <button onClick={() => openEditRoom(room)} style={styles.editBtnSmall}>Edit</button>
                            <button onClick={() => handleDeleteRoom(room.id, room.room_number)} style={styles.deleteBtnSmall}>Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              <div style={styles.sectionHeader}>
                <h3>Student Management</h3>
                <div style={styles.searchContainer}>
                  <input type="text" placeholder="Search by name, email, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                  {searchTerm && <button onClick={() => setSearchTerm('')} style={styles.clearSearchBtn}>Clear</button>}
                </div>
                <button onClick={() => { setShowStudentForm(true); setEditingStudent(null); }} style={styles.addBtn}>+ Add New Student</button>
              </div>
              {showStudentForm && (
                <div style={styles.modal}>
                  <div style={styles.modalContent}>
                    <h3>{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
                    <input type="text" placeholder="Full Name" value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} style={styles.input} />
                    <input type="email" placeholder="Email" value={studentForm.email} onChange={(e) => setStudentForm({...studentForm, email: e.target.value})} style={styles.input} />
                    <input type="password" placeholder={editingStudent ? "New Password (optional)" : "Password"} value={studentForm.password} onChange={(e) => setStudentForm({...studentForm, password: e.target.value})} style={styles.input} />
                    <select value={studentForm.role} onChange={(e) => setStudentForm({...studentForm, role: e.target.value})} style={styles.input}>
                      <option value="student">Student</option><option value="warden">Admin</option>
                    </select>
                    <div style={styles.modalActions}>
                      <button onClick={editingStudent ? handleEditStudent : handleAddStudent} style={styles.saveBtn}>Save</button>
                      <button onClick={() => { setShowStudentForm(false); setEditingStudent(null); }} style={styles.cancelBtn}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              <div style={styles.tableContainer}>
                <p style={styles.resultCount}>Found {filteredStudents.length} students</p>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Registered</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr key={student.id}>
                        <td style={styles.td}>{student.id}</td>
                        <td style={styles.td}>{student.name}</td>
                        <td style={styles.td}>{student.email}</td>
                        <td style={styles.td}>{student.role === 'warden' ? 'Admin' : 'Student'}</td>
                        <td style={styles.td}>{new Date(student.created_at).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <button onClick={() => openEditStudent(student)} style={styles.editBtnSmall}>Edit</button>
                          <button onClick={() => handleDeleteStudent(student.id, student.name)} style={styles.deleteBtnSmall}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'complaints' && (
            <div>
              <h3>Manage Complaints</h3>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Student</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Description</th>
                      <th style={styles.th}>Image</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allComplaints.map(complaint => (
                      <tr key={complaint.id}>
                        <td style={styles.td}>{complaint.id}</td>
                        <td style={styles.td}>{complaint.user_name}</td>
                        <td style={styles.td}>{complaint.email}</td>
                        <td style={styles.td} style={{ maxWidth: '300px', wordBreak: 'break-word' }}>{complaint.description}</td>
                        <td style={styles.td}>{complaint.image_url && <a href={complaint.image_url} target="_blank" rel="noopener noreferrer">View</a>}</td>
                        <td style={styles.td}>{new Date(complaint.created_at).toLocaleDateString()}</td>
                        <td style={styles.td}><span style={{...styles.approvalBadge, background: complaint.status === 'resolved' ? '#4caf50' : '#ff9800'}}>{complaint.status}</span></td>
                        <td style={styles.td}>
                          {complaint.status === 'pending' && <button onClick={() => handleUpdateComplaintStatus(complaint.id, 'resolved')} style={styles.smallBtn}>Resolve</button>}
                          <button onClick={() => handleDeleteComplaint(complaint.id)} style={styles.smallBtnDanger}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  appContainer: { minHeight: '100vh', background: '#f5f5f5' },
  nav: { position: "sticky", top: 0, zIndex: 100, background: "#1a237e", color: "white", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" },
  navTitle: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
  navRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  userName: { marginRight: '0' },
  logoutBtn: { padding: '8px 16px', background: '#fff', color: '#1a237e', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  message: { background: '#4caf50', color: 'white', padding: '12px', textAlign: 'center', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 100 },
  
  mainLayout: { display: 'flex', minHeight: 'calc(100vh - 80px)' },
  
  sidebar: { width: '280px', background: '#fff', borderRight: '1px solid #e0e0e0', padding: '20px 0', flexShrink: 0 },
  sidebarBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#555', textAlign: 'left', borderLeft: '3px solid transparent' },
  sidebarActive: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', background: '#e8eaf6', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#1a237e', fontWeight: 'bold', borderLeft: '3px solid #1a237e' },
  sidebarDangerBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#f44336', textAlign: 'left', borderLeft: '3px solid transparent', marginTop: '20px' },
  sidebarIcon: { fontSize: '20px' },
  badge: { marginLeft: 'auto', background: '#e0e0e0', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', color: '#555' },
  sidebarDivider: { height: '1px', background: '#e0e0e0', margin: '15px 20px' },
  
  contentArea: { flex: 1, padding: '30px', background: '#f5f5f5', overflowX: 'auto' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  searchContainer: { display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '400px' },
  searchInput: { flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' },
  clearSearchBtn: { padding: '10px 15px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
  resultCount: { color: '#666', fontSize: '14px', marginBottom: '10px' },
  addBtn: { padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  
  roomStatsContainer: { display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' },
  roomStatCard: { flex: 1, minWidth: '100px', background: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  roomStatNumber: { fontSize: '28px', fontWeight: 'bold', color: '#1a237e' },
  roomStatLabel: { fontSize: '12px', color: '#666', marginTop: '5px' },
  
  filterSection: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' },
  filterSelect: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', cursor: 'pointer', background: '#fff', minWidth: '150px' },
  
  modal: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px' },
  input: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' },
  textarea: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', fontFamily: 'inherit' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' },
  saveBtn: { padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', flex: 1 },
  cancelBtn: { padding: '10px 20px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', flex: 1 },
  dangerBtn: { padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', flex: 1 },
  
  tableContainer: { overflowX: 'auto', marginTop: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' },
  th: { padding: '12px', textAlign: 'left', backgroundColor: '#1a237e', color: 'white', border: '1px solid #ddd', fontWeight: 'bold' },
  td: { padding: '10px', textAlign: 'left', border: '1px solid #ddd', verticalAlign: 'top' },
  
  statusBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', color: 'white', fontSize: '12px', fontWeight: 'bold' },
  editBtnSmall: { padding: '5px 10px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', marginRight: '8px' },
  deleteBtnSmall: { padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
  smallBtn: { padding: '5px 10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', marginRight: '8px' },
  smallBtnDanger: { padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
  
  bookingCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px', background: '#fff', flexWrap: 'wrap' },
  bookingInfo: { flex: 1 },
  actions: { display: 'flex', gap: '10px' },
  approveBtn: { padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  rejectBtn: { padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  approvalBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', color: 'white', fontSize: '12px' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#666', background: '#fff', borderRadius: '8px' },
  accessDenied: { textAlign: 'center', padding: '50px', fontSize: '20px', color: 'red' },
  backBtn: { padding: '10px 20px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' },
};

export default AdminPanel;

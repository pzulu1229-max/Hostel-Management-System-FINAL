import React, { useState, useEffect } from 'react';
import api from '../services/api';

function AdminPanel({ user, onLogout }) {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [filteredPending, setFilteredPending] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [filteredAllBookings, setFilteredAllBookings] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
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

  useEffect(() => {
    filterData();
  }, [searchTerm, roomSearchTerm, roomStatusFilter, students, rooms, pendingBookings, allBookings]);

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
      setFilteredPending(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await api.get('/admin/all-bookings');
      setAllBookings(response.data);
      setFilteredAllBookings(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
      setFilteredRooms(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchAllComplaints = async () => {
    try {
      const response = await api.get('/complaints/all');
      setAllComplaints(response.data);
    } catch (err) { console.error(err); }
  };

  const filterData = () => {
    if (searchTerm) {
      setFilteredPending(pendingBookings.filter(b => 
        b.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      setFilteredAllBookings(allBookings.filter(b => 
        b.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      setFilteredStudents(students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toString().includes(searchTerm)
      ));
    } else {
      setFilteredPending(pendingBookings);
      setFilteredAllBookings(allBookings);
      setFilteredStudents(students);
    }
    
    let filtered = [...rooms];
    if (roomSearchTerm) {
      filtered = filtered.filter(r => r.room_number.toLowerCase().includes(roomSearchTerm.toLowerCase()));
    }
    if (roomStatusFilter !== 'all') {
      filtered = filtered.filter(r => {
        const occ = r.current_occupancy || 0;
        const cap = r.capacity || 4;
        if (roomStatusFilter === 'available') return occ === 0;
        if (roomStatusFilter === 'partial') return occ > 0 && occ < cap;
        if (roomStatusFilter === 'full') return occ >= cap;
        return true;
      });
    }
    setFilteredRooms(filtered);
  };

  const handleApprove = async (id) => {
    try { await api.put(`/admin/approve/${id}`); setMessage('Booking approved!'); fetchAllData(); setTimeout(() => setMessage(''), 3000); } 
    catch (err) { alert('Error approving booking'); }
  };

  const handleReject = async (id) => {
    if (window.confirm('Reject this booking?')) {
      try { await api.put(`/admin/reject/${id}`); setMessage('Booking rejected!'); fetchAllData(); setTimeout(() => setMessage(''), 3000); } 
      catch (err) { alert('Error rejecting booking'); }
    }
  };

  const handleDeleteBooking = async (id, name, room) => {
    if (window.confirm(`Delete booking for ${name} (Room ${room})?`)) {
      try { await api.delete(`/admin/booking/${id}`); setMessage('Booking deleted!'); fetchAllData(); setTimeout(() => setMessage(''), 3000); } 
      catch (err) { alert('Error deleting booking'); }
    }
  };

  const handleRevokeApproval = async (id) => {
    if (window.confirm('Revoke approval?')) {
      try { await api.put(`/admin/revoke-approval/${id}`); setMessage('Approval revoked!'); fetchAllData(); setTimeout(() => setMessage(''), 3000); } 
      catch (err) { alert('Error revoking approval'); }
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

  const handleAddRoom = async () => {
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, roomForm);
        setMessage('Room updated!');
      } else {
        await api.post('/rooms', roomForm);
        setMessage('Room added!');
      }
      setShowRoomForm(false);
      setEditingRoom(null);
      setRoomForm({ room_number: '', capacity: 4, price: 500, description: '' });
      fetchRooms();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert('Error saving room'); }
  };

  const handleDeleteRoom = async (id, number) => {
    if (window.confirm(`Delete Room ${number}?`)) {
      try { await api.delete(`/rooms/${id}`); setMessage('Room deleted!'); fetchRooms(); setTimeout(() => setMessage(''), 3000); } 
      catch (err) { alert('Error deleting room'); }
    }
  };

  const handleAddStudent = async () => {
    try {
      await api.post('/auth/register', studentForm);
      setMessage('Student added!');
      setShowStudentForm(false);
      setStudentForm({ name: '', email: '', password: '', role: 'student' });
      fetchStudents();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert('Error adding student'); }
  };

  const handleEditStudent = async () => {
    try {
      const updateData = { name: studentForm.name, email: studentForm.email, role: studentForm.role };
      if (studentForm.password && studentForm.password.trim() !== '') updateData.password = studentForm.password;
      await api.put(`/admin/students/${editingStudent.id}`, updateData);
      setMessage('Student updated!');
      setShowStudentForm(false);
      setEditingStudent(null);
      setStudentForm({ name: '', email: '', password: '', role: 'student' });
      fetchStudents();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert('Error updating student'); }
  };

  const handleDeleteStudent = async (id, name) => {
    if (window.confirm(`Delete student ${name}?`)) {
      try { await api.delete(`/admin/students/${id}`); setMessage('Student deleted!'); fetchStudents(); setTimeout(() => setMessage(''), 3000); } 
      catch (err) { alert('Error deleting student'); }
    }
  };

  const handleClearAllBookings = async () => {
    if (window.confirm('Delete ALL bookings? This cannot be undone!')) {
      try { await api.delete('/admin/clear-all-bookings'); setMessage('All bookings cleared!'); setShowClearModal(false); fetchAllData(); setTimeout(() => setMessage(''), 4000); } 
      catch (err) { alert('Error clearing bookings'); }
    }
  };

  const handleUpdateComplaintStatus = async (id, status) => {
    try { await api.put(`/complaints/${id}/status`, { status }); setMessage(`Complaint ${status}!`); fetchAllData(); setTimeout(() => setMessage(''), 3000); } 
    catch (err) { alert('Error updating complaint'); }
  };

  const handleDeleteComplaint = async (id) => {
    if (window.confirm('Delete this complaint?')) {
      try { await api.delete(`/complaints/${id}`); setMessage('Complaint deleted!'); fetchAllData(); setTimeout(() => setMessage(''), 3000); } 
      catch (err) { alert('Error deleting complaint'); }
    }
  };

  const openEditStudent = (student) => {
    setEditingStudent(student);
    setStudentForm({ name: student.name, email: student.email, password: '', role: student.role });
    setShowStudentForm(true);
  };

  if (user.role !== 'warden') {
    return <div style={styles.accessDenied}><h2>Access Denied</h2><button onClick={onLogout} style={styles.backBtn}>Go Back</button></div>;
  }

  if (loading) return <div style={styles.loading}>Loading...</div>;

  const availableCount = rooms.filter(r => (r.current_occupancy || 0) === 0).length;
  const partialCount = rooms.filter(r => (r.current_occupancy || 0) > 0 && (r.current_occupancy || 0) < (r.capacity || 4)).length;
  const fullCount = rooms.filter(r => (r.current_occupancy || 0) >= (r.capacity || 4)).length;

  return (
    <div style={styles.appContainer}>
      <nav style={styles.nav}>
        <h2 style={styles.navTitle}>Hostel Manager - Admin Panel</h2>
        <div style={styles.navRight}>
          <span>Welcome, {user.name}</span>
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
          <div style={styles.divider}></div>
          <button onClick={() => setShowClearModal(true)} style={styles.dangerBtn}>🗑️ Clear All Bookings</button>
        </div>

        <div style={styles.contentArea}>
          {showClearModal && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                <h3>Clear All Bookings</h3>
                <p>Delete ALL bookings? This cannot be undone!</p>
                <div style={styles.modalActions}>
                  <button onClick={handleClearAllBookings} style={styles.dangerModalBtn}>Yes, Delete All</button>
                  <button onClick={() => setShowClearModal(false)} style={styles.cancelBtn}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Approvals Tab */}
          {activeTab === 'pending' && (
            <div>
              <h3 style={styles.sectionTitle}>⏳ Pending Booking Approvals</h3>
              <p style={styles.sectionDesc}>Review and manage student booking requests</p>
              
              <div style={styles.searchSection}>
                <input type="text" placeholder="Search by student name, room number, or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.searchInput} />
                {searchTerm && <span style={styles.searchResultCount}>Found {filteredPending.length} results</span>}
              </div>
              
              {filteredPending.length === 0 && (
                <div style={styles.emptyCard}>
                  <div style={styles.emptyIcon}>✅</div>
                  <h4>No Pending Bookings</h4>
                  <p>All booking requests have been processed</p>
                </div>
              )}
              
              <div style={styles.pendingGrid}>
                {filteredPending.map(booking => (
                  <div key={booking.id} style={styles.pendingCard}>
                    <div style={styles.pendingCardHeader}>
                      <span style={styles.pendingStatus}>⏳ Pending Review</span>
                      <span style={styles.pendingId}>ID: {booking.id}</span>
                    </div>
                    
                    <div style={styles.pendingCardBody}>
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>👤 Student</span>
                        <span style={styles.infoValue}>{booking.user_name}</span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>📧 Email</span>
                        <span style={styles.infoValue}>{booking.email}</span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>🛏️ Room</span>
                        <span style={styles.infoValue}>{booking.room_number}</span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>💰 Price</span>
                        <span style={styles.infoValue}>K{booking.price}/month</span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>📅 Requested</span>
                        <span style={styles.infoValue}>{new Date(booking.allocated_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div style={styles.pendingCardFooter}>
                      <button onClick={() => handleApprove(booking.id)} style={styles.approveBtn}>Approve</button>
                      <button onClick={() => handleReject(booking.id)} style={styles.rejectBtn}>Reject</button>
                      <button onClick={() => handleDeleteBooking(booking.id, booking.user_name, booking.room_number)} style={styles.deleteOutlineBtn}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              <h3 style={styles.sectionTitle}>📋 All Bookings</h3>
              <p style={styles.sectionDesc}>Complete history of all booking requests</p>
              
              <input type="text" placeholder="Search by student, room, or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.searchInput} />
              <p style={styles.resultCount}>Found {filteredAllBookings.length} bookings</p>
              
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
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
                      <tr key={booking.id} style={styles.tableRow}>
                        <td style={styles.td}>{booking.id}</td>
                        <td style={styles.td}><strong>{booking.user_name}</strong><br/><span style={styles.subText}>{booking.email}</span></td>
                        <td style={styles.td}>{booking.room_number}</td>
                        <td style={styles.td}>{new Date(booking.allocated_date).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <span style={{...styles.statusBadge, background: booking.approval_status === 'approved' ? '#4caf50' : booking.approval_status === 'rejected' ? '#f44336' : '#ff9800'}}>
                            {booking.approval_status || 'pending'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {booking.approval_status === 'approved' && (
                            <button onClick={() => handleRevokeApproval(booking.id)} style={styles.smallBtn}>Revoke</button>
                          )}
                          <button onClick={() => handleDeleteBooking(booking.id, booking.user_name, booking.room_number)} style={styles.deleteSmallBtn}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Manage Rooms Tab */}
          {activeTab === 'rooms' && (
            <div>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>🏠 Room Management</h3>
                <button onClick={() => { setShowRoomForm(true); setEditingRoom(null); setRoomForm({ room_number: '', capacity: 4, price: 500, description: '' }); }} style={styles.addBtn}>+ Add New Room</button>
              </div>
              
              <div style={styles.statsContainer}>
                <div style={styles.statCard}><div style={styles.statNumber}>{rooms.length}</div><div>Total Rooms</div></div>
                <div style={styles.statCard}><div style={styles.statNumber}>{availableCount}</div><div>Available</div></div>
                <div style={styles.statCard}><div style={styles.statNumber}>{partialCount}</div><div>Partially Filled</div></div>
                <div style={styles.statCard}><div style={styles.statNumber}>{fullCount}</div><div>Full</div></div>
              </div>
              
              <div style={styles.filterSection}>
                <input type="text" placeholder="Search by room number..." value={roomSearchTerm} onChange={e => setRoomSearchTerm(e.target.value)} style={styles.searchSmallInput} />
                <select value={roomStatusFilter} onChange={e => setRoomStatusFilter(e.target.value)} style={styles.filterSelect}>
                  <option value="all">All Rooms</option>
                  <option value="available">Available Only</option>
                  <option value="partial">Partially Filled</option>
                  <option value="full">Full Only</option>
                </select>
              </div>
              <p style={styles.resultCount}>Found {filteredRooms.length} rooms</p>

              {showRoomForm && (
                <div style={styles.modalOverlay}>
                  <div style={styles.modalContent}>
                    <h3>{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
                    <input type="text" placeholder="Room Number" value={roomForm.room_number} onChange={e => setRoomForm({...roomForm, room_number: e.target.value})} style={styles.input} />
                    <select value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: parseInt(e.target.value)})} style={styles.input}>
                      <option value={1}>1 Person</option><option value={2}>2 Persons</option>
                      <option value={3}>3 Persons</option><option value={4}>4 Persons</option>
                      <option value={6}>6 Persons</option>
                    </select>
                    <input type="number" placeholder="Price per month (K)" value={roomForm.price} onChange={e => setRoomForm({...roomForm, price: parseInt(e.target.value)})} style={styles.input} />
                    <textarea placeholder="Description" value={roomForm.description} onChange={e => setRoomForm({...roomForm, description: e.target.value})} style={styles.textarea} rows="3" />
                    <div style={styles.modalActions}>
                      <button onClick={handleAddRoom} style={styles.saveBtn}>Save</button>
                      <button onClick={() => { setShowRoomForm(false); setEditingRoom(null); }} style={styles.cancelBtn}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
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
                      const occ = room.current_occupancy || 0;
                      const cap = room.capacity || 4;
                      let statusText = '', statusColor = '';
                      if (occ === 0) { statusText = 'Available'; statusColor = '#4caf50'; }
                      else if (occ < cap) { statusText = 'Partially Filled'; statusColor = '#ff9800'; }
                      else { statusText = 'Full'; statusColor = '#f44336'; }
                      return (
                        <tr key={room.id} style={styles.tableRow}>
                          <td style={styles.td}><strong>{room.room_number}</strong></td>
                          <td style={styles.td}>{cap} persons</td>
                          <td style={styles.td}>K{room.price}</td>
                          <td style={styles.td}>{occ}/{cap}</td>
                          <td style={styles.td}><span style={{...styles.statusBadge, background: statusColor}}>{statusText}</span></td>
                          <td style={styles.td}>
                            <button onClick={() => openEditRoom(room)} style={styles.editBtn}>Edit</button>
                            <button onClick={() => handleDeleteRoom(room.id, room.room_number)} style={styles.deleteSmallBtn}>Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Manage Students Tab */}
          {activeTab === 'students' && (
            <div>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>👨‍🎓 Student Management</h3>
                <button onClick={() => { setShowStudentForm(true); setEditingStudent(null); setStudentForm({ name: '', email: '', password: '', role: 'student' }); }} style={styles.addBtn}>+ Add New Student</button>
              </div>
              
              <input type="text" placeholder="Search by name, email, or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.searchInput} />
              <p style={styles.resultCount}>Found {filteredStudents.length} students</p>

              {showStudentForm && (
                <div style={styles.modalOverlay}>
                  <div style={styles.modalContent}>
                    <h3>{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
                    <input type="text" name="name" placeholder="Full Name" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} style={styles.input} />
                    <input type="email" name="email" placeholder="Email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} style={styles.input} />
                    <input type="password" name="password" placeholder={editingStudent ? "New Password (leave blank to keep current)" : "Password"} value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} style={styles.input} />
                    <select name="role" value={studentForm.role} onChange={e => setStudentForm({...studentForm, role: e.target.value})} style={styles.input}>
                      <option value="student">Student</option>
                      <option value="warden">Admin</option>
                    </select>
                    <div style={styles.modalActions}>
                      <button onClick={editingStudent ? handleEditStudent : handleAddStudent} style={styles.saveBtn}>Save</button>
                      <button onClick={() => { setShowStudentForm(false); setEditingStudent(null); }} style={styles.cancelBtn}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
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
                      <tr key={student.id} style={styles.tableRow}>
                        <td style={styles.td}>{student.id}</td>
                        <td style={styles.td}><strong>{student.name}</strong></td>
                        <td style={styles.td}>{student.email}</td>
                        <td style={styles.td}>{student.role === 'warden' ? 'Admin' : 'Student'}</td>
                        <td style={styles.td}>{new Date(student.created_at).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <button onClick={() => openEditStudent(student)} style={styles.editBtn}>Edit</button>
                          <button onClick={() => handleDeleteStudent(student.id, student.name)} style={styles.deleteSmallBtn}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Manage Complaints Tab */}
          {activeTab === 'complaints' && (
            <div>
              <h3 style={styles.sectionTitle}>📋 Manage Complaints</h3>
              <p style={styles.sectionDesc}>Student feedback and issue reports</p>
              
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Student</th>
                      <th style={styles.th}>Description</th>
                      <th style={styles.th}>Image</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allComplaints.map(complaint => (
                      <tr key={complaint.id} style={styles.tableRow}>
                        <td style={styles.td}>{complaint.id}</td>
                        <td style={styles.td}><strong>{complaint.user_name}</strong><br/><span style={styles.subText}>{complaint.email}</span></td>
                        <td style={styles.td} style={{ maxWidth: '300px', wordBreak: 'break-word' }}>{complaint.description}</td>
                        <td style={styles.td}>{complaint.image_url && <a href={complaint.image_url} target="_blank" rel="noopener noreferrer">View</a>}</td>
                        <td style={styles.td}>{new Date(complaint.created_at).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <span style={{...styles.statusBadge, background: complaint.status === 'resolved' ? '#4caf50' : '#ff9800'}}>
                            {complaint.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {complaint.status === 'pending' && (
                            <button onClick={() => handleUpdateComplaintStatus(complaint.id, 'resolved')} style={styles.smallBtn}>Resolve</button>
                          )}
                          <button onClick={() => handleDeleteComplaint(complaint.id)} style={styles.deleteSmallBtn}>Delete</button>
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
  nav: { background: '#1a237e', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  navTitle: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
  navRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoutBtn: { padding: '8px 16px', background: '#fff', color: '#1a237e', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  message: { background: '#4caf50', color: 'white', padding: '12px', textAlign: 'center', fontWeight: 'bold' },
  
  mainLayout: { display: 'flex', minHeight: 'calc(100vh - 80px)' },
  sidebar: { width: '280px', background: '#fff', borderRight: '1px solid #ddd', padding: '20px 0', flexShrink: 0 },
  sidebarBtn: { width: '100%', padding: '14px 24px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#555', borderLeft: '3px solid transparent' },
  sidebarActive: { width: '100%', padding: '14px 24px', textAlign: 'left', background: '#e8eaf6', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#1a237e', fontWeight: 'bold', borderLeft: '3px solid #1a237e' },
  divider: { height: '1px', background: '#ddd', margin: '15px 20px' },
  dangerBtn: { width: '100%', padding: '14px 24px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#f44336', borderLeft: '3px solid transparent', marginTop: '20px' },
  
  contentArea: { flex: 1, padding: '30px', background: '#f5f5f5', overflowX: 'auto' },
  sectionTitle: { fontSize: '24px', marginBottom: '8px', color: '#1a237e' },
  sectionDesc: { color: '#666', marginBottom: '20px' },
  searchSection: { marginBottom: '20px' },
  searchInput: { padding: '12px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', maxWidth: '400px', fontSize: '14px' },
  searchResultCount: { fontSize: '13px', color: '#666', marginLeft: '10px' },
  resultCount: { color: '#666', fontSize: '14px', marginBottom: '15px' },
  
  pendingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' },
  pendingCard: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  pendingCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#f8f9fa', borderBottom: '1px solid #eee' },
  pendingStatus: { background: '#ff9800', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  pendingId: { fontSize: '12px', color: '#888' },
  pendingCardBody: { padding: '20px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' },
  infoLabel: { fontWeight: 'bold', color: '#555' },
  infoValue: { color: '#333' },
  pendingCardFooter: { display: 'flex', gap: '10px', padding: '15px 20px', background: '#fafafa', borderTop: '1px solid #eee' },
  
  approveBtn: { flex: 1, padding: '10px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  rejectBtn: { flex: 1, padding: '10px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  deleteOutlineBtn: { flex: 1, padding: '10px', background: '#fff', color: '#f44336', border: '1px solid #f44336', borderRadius: '6px', cursor: 'pointer' },
  deleteSmallBtn: { padding: '5px 10px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
  
  editBtn: { padding: '5px 10px', background: '#ff9800', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' },
  smallBtn: { padding: '5px 10px', background: '#ff9800', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' },
  
  emptyCard: { textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  
  statsContainer: { display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '100px', background: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statNumber: { fontSize: '28px', fontWeight: 'bold', color: '#1a237e' },
  
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  addBtn: { padding: '10px 20px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  
  filterSection: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' },
  searchSmallInput: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', width: '300px' },
  filterSelect: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', minWidth: '150px' },
  
  tableContainer: { overflowX: 'auto', marginTop: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' },
  tableHeader: { backgroundColor: '#1a237e' },
  th: { padding: '12px', textAlign: 'left', color: '#fff', border: '1px solid #2a2a4e' },
  td: { padding: '10px', textAlign: 'left', border: '1px solid #ddd', verticalAlign: 'top' },
  tableRow: { borderBottom: '1px solid #ddd' },
  subText: { fontSize: '12px', color: '#888' },
  
  statusBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: 'bold' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px' },
  input: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' },
  textarea: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', fontFamily: 'inherit' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' },
  saveBtn: { padding: '10px 20px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', flex: 1 },
  cancelBtn: { padding: '10px 20px', background: '#999', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', flex: 1 },
  dangerModalBtn: { padding: '10px 20px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', flex: 1 },
  
  loading: { textAlign: 'center', padding: '50px', fontSize: '20px' },
  accessDenied: { textAlign: 'center', padding: '50px', fontSize: '20px', color: 'red' },
  backBtn: { padding: '10px 20px', background: '#1a237e', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' },
};

export default AdminPanel;

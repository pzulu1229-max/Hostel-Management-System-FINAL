import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('rooms');
  const [complaintText, setComplaintText] = useState('');
  const [complaintImage, setComplaintImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  useEffect(() => { fetchAllData(); }, []);
  useEffect(() => { filterRooms(); }, [rooms, searchTerm, priceFilter, capacityFilter, availabilityFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchRooms(), fetchComplaints(), fetchMyBookings()]);
    setLoading(false);
  };

  const fetchRooms = async () => { try { const res = await api.get('/rooms'); setRooms(res.data); setFilteredRooms(res.data); } catch (err) { console.error(err); } };
  const fetchComplaints = async () => { try { const res = await api.get(`/complaints/my-complaints/${user.id}`); setComplaints(res.data); } catch (err) { setComplaints([]); } };
  const fetchMyBookings = async () => { try { const res = await api.get(`/bookings/my-bookings/${user.id}`); setMyBookings(res.data); } catch (err) { setMyBookings([]); } };

  const filterRooms = () => {
    let filtered = [...rooms];
    if (searchTerm) filtered = filtered.filter(r => r.room_number.toLowerCase().includes(searchTerm.toLowerCase()));
    if (priceFilter !== 'all') filtered = filtered.filter(r => {
      if (priceFilter === 'under500') return r.price < 500;
      if (priceFilter === '500-700') return r.price >= 500 && r.price <= 700;
      if (priceFilter === '700-900') return r.price > 700 && r.price <= 900;
      if (priceFilter === '900-1000') return r.price > 900 && r.price <= 1000;
      return true;
    });
    if (capacityFilter !== 'all') filtered = filtered.filter(r => r.capacity === parseInt(capacityFilter));
    if (availabilityFilter === 'available') filtered = filtered.filter(r => (r.current_occupancy || 0) < (r.capacity || 4));
    setFilteredRooms(filtered);
  };

  const handleBookRoom = async (roomId, roomNumber) => {
    if (myBookings.length > 0) { alert('You already have a pending or approved booking!'); return; }
    if (window.confirm(`Request to book Room ${roomNumber}?`)) {
      try { await api.post('/bookings', { user_id: user.id, room_id: roomId }); setMessage(`Booking request sent for Room ${roomNumber}!`); await fetchAllData(); setTimeout(() => setMessage(''), 5000); } 
      catch (err) { alert(err.response?.data?.error || 'Failed to book room'); }
    }
  };

  const handleCancelRequest = async (bookingId, roomNumber) => {
    if (window.confirm(`Cancel your request for Room ${roomNumber}?`)) {
      try { await api.put(`/bookings/cancel/${bookingId}`); setMessage(`Request for Room ${roomNumber} cancelled.`); await fetchAllData(); setTimeout(() => setMessage(''), 4000); } 
      catch (err) { alert('Failed to cancel request'); }
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (window.confirm('Delete this complaint?')) {
      try { await api.delete(`/complaints/${complaintId}`); setMessage('Complaint deleted!'); await fetchComplaints(); setTimeout(() => setMessage(''), 3000); } 
      catch (err) { alert('Error deleting complaint'); }
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (complaintText.length > 100) { alert('Description cannot exceed 100 characters!'); return; }
    setUploading(true);
    try {
      let imageUrl = '';
      if (complaintImage) {
        const formData = new FormData();
        formData.append('image', complaintImage);
        const uploadRes = await api.post('/upload', formData);
        imageUrl = uploadRes.data.imageUrl;
      }
      await api.post('/complaints', { user_id: user.id, description: complaintText, image_url: imageUrl });
      setComplaintText(''); setComplaintImage(null); await fetchComplaints(); setMessage('Complaint submitted!'); setTimeout(() => setMessage(''), 3000);
      document.getElementById('complaintImage').value = '';
    } catch (err) { alert('Error submitting complaint'); }
    finally { setUploading(false); }
  };

  const getRoomStatus = (roomId) => {
    const booking = myBookings.find(b => b.room_id === roomId);
    return booking ? booking.approval_status : null;
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  const hasPending = myBookings.some(b => b.approval_status === 'pending');
  const hasApproved = myBookings.some(b => b.approval_status === 'approved');

  return (
    <div style={styles.appContainer}>
      <nav style={styles.nav}>
        <h2 style={styles.navTitle}>Hostel Manager</h2>
        <div style={styles.navRight}>
          <span style={styles.userName}>Welcome, {user.name}</span>
          {hasPending && <span style={styles.pendingBadge}>⏳ Pending Request</span>}
          {hasApproved && <span style={styles.approvedBadge}>✅ Approved Room</span>}
          <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.mainLayout}>
        <div style={styles.sidebar}>
          <button onClick={() => setActiveTab('rooms')} style={activeTab === 'rooms' ? styles.sidebarActive : styles.sidebarBtn}>
            <span style={styles.sidebarIcon}>🏠</span> Available Rooms
          </button>
          <button onClick={() => setActiveTab('myBookings')} style={activeTab === 'myBookings' ? styles.sidebarActive : styles.sidebarBtn}>
            <span style={styles.sidebarIcon}>📋</span> My Bookings
            <span style={styles.badge}>{myBookings.length}</span>
          </button>
          <button onClick={() => setActiveTab('myComplaints')} style={activeTab === 'myComplaints' ? styles.sidebarActive : styles.sidebarBtn}>
            <span style={styles.sidebarIcon}>📝</span> My Complaints
          </button>
          <button onClick={() => setActiveTab('newComplaint')} style={activeTab === 'newComplaint' ? styles.sidebarActive : styles.sidebarBtn}>
            <span style={styles.sidebarIcon}>✏️</span> File Complaint
          </button>
        </div>

        <div style={styles.contentArea}>
          {activeTab === 'rooms' && (
            <div>
              <h3>Available Hostel Rooms</h3>
              <p style={styles.subtitle}>4-person: K500 | 2-person: K700, K900, K1000 | 1-person: K400</p>
              
              {hasPending && <div style={styles.warningBox}>You have a pending request! Cancel from My Bookings tab.</div>}
              {hasApproved && <div style={styles.successBox}>You already have an approved room!</div>}
              
              <div style={styles.filterSection}>
                <input type="text" placeholder="Search by room number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} style={styles.filterSelect}>
                  <option value="all">All Prices</option>
                  <option value="under500">Under K500</option>
                  <option value="500-700">K500 - K700</option>
                  <option value="700-900">K700 - K900</option>
                  <option value="900-1000">K900 - K1000</option>
                </select>
                <select value={capacityFilter} onChange={(e) => setCapacityFilter(e.target.value)} style={styles.filterSelect}>
                  <option value="all">All Capacities</option>
                  <option value="1">1 Person</option>
                  <option value="2">2 Persons</option>
                  <option value="4">4 Persons</option>
                </select>
                <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} style={styles.filterSelect}>
                  <option value="all">All Rooms</option>
                  <option value="available">Available Only (Not Full)</option>
                </select>
                <button onClick={() => { setSearchTerm(''); setPriceFilter('all'); setCapacityFilter('all'); setAvailabilityFilter('all'); }} style={styles.clearBtn}>Clear Filters</button>
              </div>
              
              <p style={styles.resultCount}>Found {filteredRooms.length} rooms</p>
              
              <div style={styles.roomGrid}>
                {filteredRooms.map(room => {
                  const status = getRoomStatus(room.id);
                  const occ = room.current_occupancy || 0;
                  const cap = room.capacity || 4;
                  return (
                    <div key={room.id} style={styles.roomCard}>
                      <h4 style={styles.roomNumber}>Room {room.room_number}</h4>
                      <p>Capacity: {cap} person{cap > 1 ? 's' : ''}</p>
                      <p>Price: <span style={styles.price}>K{room.price}</span>/month</p>
                      <p>Occupancy: {occ}/{cap}</p>
                      {status === 'pending' && <p style={styles.pendingBadge}>⏳ Waiting for Approval</p>}
                      {status === 'approved' && <p style={styles.approvedBadge}>✅ Approved - You have this room</p>}
                      {!status && occ < cap && !hasPending && !hasApproved && <button onClick={() => handleBookRoom(room.id, room.room_number)} style={styles.bookBtn}>Request to Book</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'myBookings' && (
            <div>
              <h3>My Room Bookings</h3>
              {myBookings.length === 0 && <div style={styles.emptyState}><p>No bookings yet.</p><button onClick={() => setActiveTab('rooms')} style={styles.goBookBtn}>Go Book a Room →</button></div>}
              {myBookings.map(booking => {
                const room = rooms.find(r => r.id === booking.room_id);
                return (
                  <div key={booking.id} style={styles.bookingCard}>
                    <h4>Room {room?.room_number}</h4>
                    <p>Capacity: {room?.capacity} person{room?.capacity > 1 ? 's' : ''}</p>
                    <p>Price: K{room?.price}/month</p>
                    <p>Requested: {new Date(booking.allocated_date).toLocaleDateString()}</p>
                    <p>Status: <span style={{...styles.statusBadge, background: booking.approval_status === 'approved' ? '#4caf50' : '#ff9800'}}>{booking.approval_status === 'approved' ? 'Approved' : 'Pending'}</span></p>
                    {booking.approval_status === 'pending' && <button onClick={() => handleCancelRequest(booking.id, room?.room_number)} style={styles.cancelPendingBtn}>Cancel Request</button>}
                    {booking.approval_status === 'approved' && <p style={styles.approvedNote}>You have been approved for this room.</p>}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'myComplaints' && (
            <div>
              <h3>My Complaints</h3>
              {complaints.length === 0 && <div style={styles.emptyState}><p>No complaints yet.</p><button onClick={() => setActiveTab('newComplaint')} style={styles.goBookBtn}>File a Complaint →</button></div>}
              {complaints.map(complaint => (
                <div key={complaint.id} style={styles.complaintCard}>
                  <p>{complaint.description}</p>
                  {complaint.image_url && <img src={complaint.image_url} alt="complaint" style={styles.complaintImage} />}
                  <div style={styles.complaintFooter}>
                    <span style={{...styles.status, background: complaint.status === 'pending' ? '#ff9800' : '#4caf50'}}>
                      {complaint.status === 'pending' ? 'Pending Review' : 'Resolved'}
                    </span>
                    <small>{new Date(complaint.created_at).toLocaleString()}</small>
                    <button onClick={() => handleDeleteComplaint(complaint.id)} style={styles.deleteComplaintBtn}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'newComplaint' && (
            <div>
              <h3>File a Complaint</h3>
              <form onSubmit={handleSubmitComplaint} style={styles.complaintForm}>
                <textarea placeholder="Describe your issue..." value={complaintText} onChange={(e) => setComplaintText(e.target.value)} style={styles.textarea} required />
                <div><label>Upload Image:</label><input type="file" accept="image/*" onChange={(e) => setComplaintImage(e.target.files[0])} style={styles.fileInput} /></div>
                <button type="submit" style={styles.submitBtn} disabled={uploading}>{uploading ? 'Uploading...' : 'Submit Complaint'}</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  appContainer: { minHeight: '100vh', background: '#f5f5f5' },
  nav: { background: '#667eea', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  navTitle: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
  navRight: { display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' },
  userName: { marginRight: '20px' },
  pendingBadge: { background: '#ff9800', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', color: '#fff' },
  approvedBadge: { background: '#4caf50', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', color: '#fff' },
  logoutBtn: { padding: '8px 16px', background: '#fff', color: '#667eea', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  message: { background: '#4caf50', color: 'white', padding: '12px', textAlign: 'center', fontWeight: 'bold' },
  
  mainLayout: { display: 'flex', minHeight: 'calc(100vh - 80px)' },
  
  sidebar: { width: '280px', background: '#fff', borderRight: '1px solid #e0e0e0', padding: '20px 0', flexShrink: 0 },
  sidebarBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#555', textAlign: 'left', borderLeft: '3px solid transparent' },
  sidebarActive: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', background: '#e8eaf6', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#667eea', fontWeight: 'bold', borderLeft: '3px solid #667eea' },
  sidebarIcon: { fontSize: '20px', marginRight: '10px' },
  badge: { marginLeft: 'auto', background: '#e0e0e0', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', color: '#555' },
  
  contentArea: { flex: 1, padding: '30px', background: '#f5f5f5', overflowX: 'auto' },
  subtitle: { color: '#666', marginBottom: '20px' },
  warningBox: { background: '#fff3e0', border: '1px solid #ff9800', color: '#e65100', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' },
  successBox: { background: '#e8f5e9', border: '1px solid #4caf50', color: '#2e7d32', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' },
  filterSection: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  searchInput: { flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', minWidth: '200px' },
  filterSelect: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', background: '#fff' },
  clearBtn: { padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  resultCount: { color: '#666', marginBottom: '15px' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '20px' },
  roomGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' },
  roomCard: { padding: '20px', border: '1px solid #e0e0e0', borderRadius: '12px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  roomNumber: { fontSize: '20px', color: '#667eea', marginBottom: '10px' },
  price: { fontSize: '18px', fontWeight: 'bold', color: '#4caf50' },
  bookBtn: { width: '100%', padding: '10px', marginTop: '15px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  bookingCard: { padding: '20px', border: '2px solid #ff9800', borderRadius: '12px', background: '#fff3e0', marginBottom: '15px' },
  statusBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', color: 'white', fontSize: '12px', marginLeft: '10px' },
  cancelPendingBtn: { padding: '10px 20px', marginTop: '15px', background: '#f44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  approvedNote: { marginTop: '15px', color: '#4caf50', fontWeight: 'bold', textAlign: 'center' },
  complaintCard: { padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px', background: '#fff' },
  complaintImage: { maxWidth: '200px', marginTop: '10px', borderRadius: '5px' },
  complaintFooter: { marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
  status: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', color: 'white', fontSize: '12px' },
  deleteComplaintBtn: { padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
  complaintForm: { maxWidth: '600px' },
  textarea: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', minHeight: '120px', fontFamily: 'inherit' },
  fileInput: { margin: '15px 0', display: 'block' },
  submitBtn: { padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#666', fontSize: '16px' },
  goBookBtn: { marginTop: '15px', padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};

export default Dashboard;

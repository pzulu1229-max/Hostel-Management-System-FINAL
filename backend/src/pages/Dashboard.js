import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('rooms');
  const [complaintText, setComplaintText] = useState('');
  const [complaintImage, setComplaintImage] = useState(null);

  useEffect(() => {
    fetchRooms();
    fetchComplaints();
  }, []);

  const fetchRooms = async () => {
    const response = await api.get('/rooms');
    setRooms(response.data);
  };

  const fetchComplaints = async () => {
    const response = await api.get('/complaints');
    setComplaints(response.data);
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    
    let imageUrl = '';
    if (complaintImage) {
      const formData = new FormData();
      formData.append('image', complaintImage);
      const uploadRes = await api.post('/upload/upload', formData);
      imageUrl = uploadRes.data.imageUrl;
    }
    
    await api.post('/complaints', {
      user_id: user.id,
      description: complaintText,
      image_url: imageUrl,
    });
    
    setComplaintText('');
    setComplaintImage(null);
    fetchComplaints();
    alert('Complaint submitted successfully!');
  };

  return (
    <div>
      <nav style={styles.nav}>
        <h2>🏠 Hostel Management</h2>
        <div>
          <span style={styles.userName}>Welcome, {user.name}</span>
          <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>
      
      <div style={styles.tabs}>
        <button onClick={() => setActiveTab('rooms')} style={{...styles.tab, ...(activeTab === 'rooms' && styles.activeTab)}}>
          Available Rooms
        </button>
        <button onClick={() => setActiveTab('complaints')} style={{...styles.tab, ...(activeTab === 'complaints' && styles.activeTab)}}>
          My Complaints
        </button>
        <button onClick={() => setActiveTab('newComplaint')} style={{...styles.tab, ...(activeTab === 'newComplaint' && styles.activeTab)}}>
          File Complaint
        </button>
      </div>
      
      <div style={styles.content}>
        {activeTab === 'rooms' && (
          <div>
            <h3>Available Rooms</h3>
            <div style={styles.roomGrid}>
              {rooms.map(room => (
                <div key={room.id} style={styles.roomCard}>
                  <h4>Room {room.room_number}</h4>
                  <p>Capacity: {room.capacity} persons</p>
                  <p>Status: {room.status}</p>
                  <p>Price: ${room.price}/month</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'complaints' && (
          <div>
            <h3>My Complaints</h3>
            {complaints.filter(c => c.user_id === user.id).map(complaint => (
              <div key={complaint.id} style={styles.complaintCard}>
                <p>{complaint.description}</p>
                {complaint.image_url && <img src={complaint.image_url} alt="complaint" style={styles.complaintImage} />}
                <span style={{...styles.status, 
                  background: complaint.status === 'pending' ? '#ff9800' : '#4caf50'}}>
                  {complaint.status}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'newComplaint' && (
          <div>
            <h3>File a Complaint</h3>
            <form onSubmit={handleComplaintSubmit}>
              <textarea
                placeholder="Describe your issue..."
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                style={styles.textarea}
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setComplaintImage(e.target.files[0])}
                style={styles.fileInput}
              />
              <button type="submit" style={styles.submitBtn}>Submit Complaint</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  nav: {
    background: '#667eea',
    color: 'white',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    marginRight: '20px',
  },
  logoutBtn: {
    padding: '8px 16px',
    background: '#fff',
    color: '#667eea',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #ddd',
    padding: '0 30px',
  },
  tab: {
    padding: '12px 24px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
  },
  activeTab: {
    borderBottom: '2px solid #667eea',
    color: '#667eea',
  },
  content: {
    padding: '30px',
  },
  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  roomCard: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#f9f9f9',
  },
  complaintCard: {
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    marginBottom: '15px',
  },
  complaintImage: {
    maxWidth: '200px',
    marginTop: '10px',
  },
  status: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    marginTop: '10px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
    minHeight: '100px',
  },
  fileInput: {
    margin: '15px 0',
  },
  submitBtn: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default Dashboard;

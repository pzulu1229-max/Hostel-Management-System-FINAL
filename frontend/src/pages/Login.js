import React, { useState } from 'react';
import api from '../services/api';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      let response;
      if (isLogin) {
        response = await api.post('/auth/login', { email, password });
      } else {
        response = await api.post('/auth/register', { name, email, password, role: 'student' });
      }
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <div style={styles.card}>
          <div style={styles.logoSection}>
            <img src="/zut-logo.png" alt="Zambia University College of Technology" style={styles.logoImage} />
            <h1 style={styles.title}>Hostel Manager</h1>
            <p style={styles.subtitle}>Zambia University College of Technology</p>
          </div>
          
          <div style={styles.formSection}>
            <h2 style={styles.formTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p style={styles.formSubtitle}>
              {isLogin ? 'Login to manage your hostel accommodation' : 'Register to book your room'}
            </p>
            
            {error && <div style={styles.error}>{error}</div>}
            
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div style={styles.inputGroup}>
                  <span style={styles.inputIcon}>👤</span>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
              )}
              
              <div style={styles.inputGroup}>
                <span style={styles.inputIcon}>📧</span>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.inputGroup}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              
              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </form>
            
            <div style={styles.footer}>
              <p style={styles.switchText}>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                style={styles.switchBtn}
                disabled={loading}
              >
                {isLogin ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </div>
          
          <div style={styles.infoSection}>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>🛏️</span>
              <span>35+ Rooms Available</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>👥</span>
              <span>2,4 Person Rooms</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>💰</span>
              <span>From K500/month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#003b48',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    maxWidth: '1100px',
    width: '100%',
    background: '#fff',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexWrap: 'wrap',
  },
  logoSection: {
    flex: 1,
    minWidth: '280px',
    background: '#1a237e',
    padding: '48px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  logoImage: {
    width: '100px',
    height: '100px',
    objectFit: 'contain',
    marginBottom: '20px',
    backgroundColor: '#fff',
    borderRadius: '50%',
    padding: '10px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.5',
  },
  formSection: {
    flex: 1.2,
    minWidth: '320px',
    padding: '48px',
    background: '#fff',
  },
  formTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: '8px',
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '32px',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8f9fa',
  },
  inputIcon: {
    padding: '12px 8px 12px 16px',
    fontSize: '18px',
    color: '#999',
  },
  input: {
    flex: 1,
    padding: '14px 16px 14px 0',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '15px',
    outline: 'none',
    color: '#333',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#1a237e',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '16px',
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center',
  },
  footer: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #e0e0e0',
    textAlign: 'center',
  },
  switchText: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '12px',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#1a237e',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  infoSection: {
    width: '100%',
    background: '#f8f9fa',
    padding: '20px 48px',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '20px',
    borderTop: '1px solid #e0e0e0',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#555',
  },
  infoIcon: {
    fontSize: '18px',
  },
};



export default Login;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiActivity, FiLogIn, FiUserPlus } from 'react-icons/fi';
import api from '../services/api';

function AuthPage({ mode, onLogin }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await api.post('/auth/login', { email, password });
      } else {
        res = await api.post('/auth/signup', { name, email, password });
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <FiActivity className="auth-logo" />
          <h1>OneGeo</h1>
          <p>{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? 'Enter password' : 'Min 6 characters'}
              required
              minLength={6}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : (
              isLogin ? <><FiLogIn /> Sign In</> : <><FiUserPlus /> Sign Up</>
            )}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? (
            <>Don't have an account? <Link to="/signup">Sign Up</Link></>
          ) : (
            <>Already have an account? <Link to="/login">Sign In</Link></>
          )}
        </p>
      </div>
    </div>
  );
}

export default AuthPage;

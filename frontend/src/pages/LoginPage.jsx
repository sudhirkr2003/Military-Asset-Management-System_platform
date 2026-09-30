import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, BookOpen } from 'lucide-react';
import bgImage from '../assets/login_daylight_base.jpg';
import defenseCrest from '../assets/defense_crest.svg';

export const LoginPage = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(usernameOrEmail, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to backend server. Make sure Spring Boot is running on port 8080.');
      } else {
        const errorMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Invalid username or password';
        setError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="military-login-page"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="military-login-overlay" />

      <div className="military-login-card">
        {/* Military Defense Crest Badge Logo */}
        <div className="military-logo-wrapper" style={{ width: '64px', height: '64px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={defenseCrest} alt="MAMS Defense Crest" style={{ width: '56px', height: '56px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))' }} />
        </div>

        {/* Title */}
        <div className="military-title-section">
          <h1 className="military-title-main">Military Asset</h1>
          <h2 className="military-title-sub">Management System</h2>
          <p className="military-tagline">Track. Manage. Secure.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="military-error-banner">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="military-form">
          <div className="military-input-group">
            <label className="military-label" htmlFor="usernameOrEmail">
              Email / Username
            </label>
            <div className="military-input-box">
              <Mail className="military-field-icon" />
              <input
                id="usernameOrEmail"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Enter your email or username"
                required
                className="military-text-input"
              />
            </div>
          </div>

          <div className="military-input-group">
            <label className="military-label" htmlFor="password">
              Password
            </label>
            <div className="military-input-box">
              <Lock className="military-field-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="military-text-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="military-eye-btn"
                tabIndex="-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="military-login-btn"
          >
            {isSubmitting ? (
              <span className="military-login-btn-inner">
                <span className="military-spinner" /> Authenticating...
              </span>
            ) : (
              <span className="military-login-btn-inner">
                <LogIn size={18} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                <span>Login</span>
              </span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid #dce4d9', textAlign: 'center' }}>
          <a
            href="/public-docs"
            style={{
              color: '#1a6b3c',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(26, 107, 60, 0.08)',
              border: '1px solid rgba(26, 107, 60, 0.22)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(26, 107, 60, 0.16)';
              e.currentTarget.style.color = '#0e381d';
              e.currentTarget.style.borderColor = '#1a6b3c';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(26, 107, 60, 0.08)';
              e.currentTarget.style.color = '#1a6b3c';
              e.currentTarget.style.borderColor = 'rgba(26, 107, 60, 0.22)';
            }}
          >
            <BookOpen size={15} style={{ color: '#1a6b3c' }} />
            <span>View Public System Architecture & API Docs →</span>
          </a>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import bgImage from '../assets/military_base_bg.jpg';

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
        {/* Military Chevron Shield Badge Logo */}
        <div className="military-logo-wrapper">
          <svg
            className="military-badge-icon"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Shield Outline */}
            <path
              d="M32 4L54 14V34C54 47.5 44.5 56.5 32 60C19.5 56.5 10 47.5 10 34V14L32 4Z"
              stroke="#34d399"
              strokeWidth="3.5"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Inner Chevron 1 */}
            <path
              d="M20 22L32 29L44 22"
              stroke="#34d399"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner Chevron 2 */}
            <path
              d="M20 31L32 38L44 31"
              stroke="#34d399"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner Chevron 3 */}
            <path
              d="M20 40L32 47L44 40"
              stroke="#34d399"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
              <span className="flex items-center justify-center gap-2">
                <span className="military-spinner" /> Authenticating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" /> Login
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

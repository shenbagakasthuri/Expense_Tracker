import { useState } from 'react';
import { authService } from '../services/authService';
import { Lock, Mail, User, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (response.success) {
        setSuccess(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-card text-center">
        <div className="auth-success-icon">
          <CheckCircle2 size={48} className="text-success" />
        </div>
        <h2 className="auth-title">Registration Successful!</h2>
        <p className="auth-subtitle">
          Your account and 15 default financial categories have been created. You can now sign in.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block mt-4"
          onClick={onSwitchToLogin}
        >
          Proceed to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo-badge">₹</div>
        <h2 className="auth-title">Create an account</h2>
        <p className="auth-subtitle">Get started tracking your income and expenses</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label" htmlFor="register-name">Full Name</label>
          <div className="input-wrapper">
            <User className="input-icon" size={18} />
            <input
              id="register-name"
              type="text"
              name="name"
              className="form-input with-icon"
              placeholder="Arun Kumar"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-email">Email Address</label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={18} />
            <input
              id="register-email"
              type="email"
              name="email"
              className="form-input with-icon"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-password">Password (min 8 characters)</label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={18} />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="form-input with-icon with-action"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="input-action-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-confirm-password">Confirm Password</label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={18} />
            <input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              className="form-input with-icon"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="spinner" size={18} />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Register Now</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <button type="button" className="btn-link" onClick={onSwitchToLogin}>
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

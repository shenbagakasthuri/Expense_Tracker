import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, ShieldCheck, Database, LogOut } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="profile-page">
      <div className="card profile-card">
        <div className="profile-hero">
          <div className="profile-avatar-large">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-hero-info">
            <h2 className="profile-user-name">{user?.name || 'User'}</h2>
            <p className="profile-user-email">{user?.email || 'N/A'}</p>
            <span className="profile-status-badge">Authenticated Student Intern</span>
          </div>
        </div>

        <div className="profile-section mt-4">
          <h3 className="section-title">Account Information</h3>
          <div className="profile-details-grid">
            <div className="detail-item">
              <div className="detail-icon-box">
                <User size={18} />
              </div>
              <div>
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{user?.name || '—'}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon-box">
                <Mail size={18} />
              </div>
              <div>
                <span className="detail-label">Email Address</span>
                <span className="detail-value">{user?.email || '—'}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon-box">
                <Calendar size={18} />
              </div>
              <div>
                <span className="detail-label">Member Since</span>
                <span className="detail-value">
                  {user?.created_at ? formatDate(user.created_at.split('T')[0]) : 'Recently Registered'}
                </span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon-box">
                <ShieldCheck size={18} />
              </div>
              <div>
                <span className="detail-label">Authentication Standard</span>
                <span className="detail-value">JWT Bearer (24h validity) + bcrypt salted hash</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section mt-4">
          <h3 className="section-title">Project & Database Isolation</h3>
          <div className="profile-info-box">
            <div className="flex-center gap-2 mb-2">
              <Database size={18} className="icon-primary" />
              <strong>Multi-Tenant Data Isolation Policy</strong>
            </div>
            <p className="text-muted text-sm">
              Each user operates within an isolated database scope enforced by composite foreign keys
              and row-level authorization queries. Your 15 default financial categories (5 income, 10 expense)
              and all transactions are private to your user ID.
            </p>
          </div>
        </div>

        <div className="profile-actions mt-4 pt-3 border-top">
          <button type="button" className="btn btn-outline btn-danger" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out of Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}

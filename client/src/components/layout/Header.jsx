import { Menu, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ currentTab, onOpenMobile, onOpenAddModal }) {
  const { user } = useAuth();

  const titles = {
    dashboard: 'Financial Dashboard',
    transactions: 'Transaction Management',
    reports: 'Financial Reports & Analytics',
    profile: 'User Profile'
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={onOpenMobile}
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>
        <div className="header-page-info">
          <h1 className="header-page-title">{titles[currentTab] || 'Overview'}</h1>
          <p className="header-page-subtitle">Welcome back, {user?.name || 'User'}</p>
        </div>
      </div>

      <div className="header-right">
        <button
          type="button"
          className="btn btn-primary btn-sm btn-icon"
          onClick={onOpenAddModal}
        >
          <Plus size={16} />
          <span>Add Transaction</span>
        </button>
      </div>
    </header>
  );
}

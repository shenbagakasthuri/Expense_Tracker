import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { transactionService } from './services/transactionService';
import { categoryService } from './services/categoryService';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

// Modals
import TransactionModal from './components/transactions/TransactionModal';
import DeleteConfirmModal from './components/common/DeleteConfirmModal';

import { Loader2 } from 'lucide-react';
import './App.css';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Auth screen toggle (login vs register)
  const [authView, setAuthView] = useState('login');

  // Navigation tab state: 'dashboard' | 'transactions' | 'reports' | 'profile'
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Application Data State
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Transaction Filters
  const [filters, setFilters] = useState({
    type: '',
    category_id: '',
    start_date: '',
    end_date: ''
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch transactions based on current filters
  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setDataLoading(true);
      const res = await transactionService.getTransactions(filters);
      if (res.success && Array.isArray(res.data)) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated, filters]);

  // Fetch user categories
  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await categoryService.getCategories();
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchTransactions();
    }
  }, [isAuthenticated, fetchCategories, fetchTransactions]);

  // Handler for filter changes
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      type: '',
      category_id: '',
      start_date: '',
      end_date: ''
    });
  };

  // Modal handlers
  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (tx) => {
    setEditingTransaction(tx);
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (tx) => {
    setDeletingTransaction(tx);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      setDeleteLoading(true);
      await transactionService.deleteTransaction(deletingTransaction.id);
      setDeleteModalOpen(false);
      setDeletingTransaction(null);
      fetchTransactions();
    } catch (err) {
      console.error('Delete transaction failed:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Auth Loading state
  if (authLoading) {
    return (
      <div className="flex-center full-viewport loading-screen">
        <Loader2 className="spinner icon-primary" size={36} />
        <p className="loading-text mt-2">Connecting to Expense Tracker...</p>
      </div>
    );
  }

  // Unauthenticated: Render Auth Flow
  if (!isAuthenticated) {
    return (
      <div className="auth-viewport">
        <div className="auth-container">
          {authView === 'login' ? (
            <Login onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <Register onSwitchToLogin={() => setAuthView('login')} />
          )}
        </div>
      </div>
    );
  }

  // Authenticated: Render Full SaaS Application
  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="app-main-wrapper">
        <Header
          currentTab={currentTab}
          onOpenMobile={() => setMobileSidebarOpen(true)}
          onOpenAddModal={handleOpenAddModal}
        />

        <main className="app-content-container">
          {currentTab === 'dashboard' && (
            <Dashboard
              transactions={transactions}
              loading={dataLoading}
              onOpenAddModal={handleOpenAddModal}
              onEditTransaction={handleOpenEditModal}
              onDeleteTransaction={handleOpenDeleteModal}
              onNavigateToTransactions={() => setCurrentTab('transactions')}
            />
          )}

          {currentTab === 'transactions' && (
            <Transactions
              transactions={transactions}
              categories={categories}
              loading={dataLoading}
              onOpenAddModal={handleOpenAddModal}
              onEditTransaction={handleOpenEditModal}
              onDeleteTransaction={handleOpenDeleteModal}
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />
          )}

          {currentTab === 'reports' && (
            <Reports transactions={transactions} />
          )}

          {currentTab === 'profile' && <Profile />}
        </main>
      </div>

      {/* Reusable Add/Edit Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchTransactions}
        categories={categories}
        initialData={editingTransaction}
      />

      {/* Reusable Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
}

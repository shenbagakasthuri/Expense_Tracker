import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = 'Delete Transaction',
  message = 'Are you sure you want to delete this transaction? This action cannot be undone.'
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-icon">
          <AlertTriangle size={32} className="text-danger" />
        </div>

        <h3 className="modal-title text-center">{title}</h3>
        <p className="delete-modal-message">{message}</p>

        <div className="modal-actions justify-center mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="spinner" size={16} />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

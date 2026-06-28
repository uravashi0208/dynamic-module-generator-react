const ConfirmDeleteModal = ({
  title     = 'Delete?',
  message,
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  const handleBackdrop = () => { if (!isDeleting) onCancel(); };

  return (
    <div
      className="modal show d-block modal-overlay"
      style={{ zIndex: 1055 }}
      onClick={handleBackdrop}
    >
      <div
        className="modal-dialog modal-dialog-centered confirm-delete-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content rounded-4 border-0 shadow-lg">
          <div className="modal-body text-center confirm-delete-body">

            {/* Icon */}
            <div className="confirm-delete-icon-wrap">
              <i className="ti ti-alert-triangle confirm-delete-icon" />
            </div>

            {/* Title */}
            <h5 className="fw-bold mb-2 confirm-delete-title">{title}</h5>

            {/* Message */}
            <p className="text-muted mb-0 confirm-delete-msg">{message}</p>
            <p className="mb-0 mt-1 confirm-delete-warning">This cannot be undone.</p>

            {/* Actions */}
            <div className="d-flex gap-3 justify-content-center mt-4">
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="btn btn-outline-secondary confirm-delete-btn"
              >
                Cancel
              </button>

              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="btn btn-danger d-flex align-items-center gap-2 confirm-delete-btn"
              >
                {isDeleting ? (
                  <>
                    <span
                      className="spinner-border confirm-delete-spinner"
                      role="status"
                      aria-hidden="true"
                    />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <i className="ti ti-trash fs-15px" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;

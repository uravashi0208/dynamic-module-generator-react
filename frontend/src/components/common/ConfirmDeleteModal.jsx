/**
 * ConfirmDeleteModal — Common reusable delete confirmation popup.
 *
 * Props:
 *  title       — Modal heading (default "Delete?")
 *  message     — JSX or string body text
 *  isDeleting  — boolean — shows spinner on Delete button while true
 *  onConfirm   — async fn called when user clicks Delete
 *  onCancel    — fn called when user clicks Cancel or backdrop
 */
const ConfirmDeleteModal = ({
  title     = 'Delete?',
  message,
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  /* Prevent backdrop click while delete is in-progress */
  const handleBackdrop = () => { if (!isDeleting) onCancel(); };

  return (
    <div
      className="modal show d-block"
      style={{ background: 'rgba(0,0,0,.45)', zIndex: 1055 }}
      onClick={handleBackdrop}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content rounded-4 border-0 shadow-lg">
          <div className="modal-body text-center px-5 py-4">

            {/* Icon */}
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
              style={{ width: 56, height: 56, background: '#FEF2F2' }}
            >
              <i className="ti ti-alert-triangle" style={{ fontSize: 26, color: '#EF4444' }} />
            </div>

            {/* Title */}
            <h5 className="fw-bold mb-2" style={{ fontSize: 18 }}>{title}</h5>

            {/* Body */}
            <p className="text-muted mb-0" style={{ fontSize: 14, lineHeight: 1.6 }}>
              {message}
            </p>
            <p className="mb-0 mt-1" style={{ fontSize: 12, color: '#EF4444' }}>
              This cannot be undone.
            </p>

            {/* Actions */}
            <div className="d-flex gap-3 justify-content-center mt-4">
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="btn btn-outline-secondary px-4"
                style={{ borderRadius: 10, minWidth: 100 }}
              >
                Cancel
              </button>

              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="btn btn-danger px-4 d-flex align-items-center gap-2"
                style={{ borderRadius: 10, minWidth: 100, minHeight: 38 }}
              >
                {isDeleting ? (
                  <>
                    <span
                      className="spinner-border"
                      style={{ width: 15, height: 15, borderWidth: 2 }}
                      role="status"
                      aria-hidden="true"
                    />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <i className="ti ti-trash" style={{ fontSize: 15 }} />
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
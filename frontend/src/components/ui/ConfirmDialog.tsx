import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const buttonStyles = {
    danger: 'btn btn-danger',
    warning: 'btn bg-yellow-500 text-white hover:bg-yellow-600',
    info: 'btn btn-primary',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="btn btn-outline"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={buttonStyles[variant]}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </Modal>
  );
}

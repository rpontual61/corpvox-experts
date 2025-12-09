import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'success' | 'danger' | 'warning';
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'danger':
        return <XCircle className="w-12 h-12 text-red-600" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-12 h-12 text-yellow-600" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
      default:
        return 'bg-yellow-600 hover:bg-yellow-700';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium ${getConfirmButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

import React, { useState } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  evaluationCount: number;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  evaluationCount,
  isDeleting
}) => {
  const [deletionProgress, setDeletionProgress] = useState<{
    current: number;
    total: number;
    status: string;
  }>({ current: 0, total: 0, status: '' });

  const handleConfirm = async () => {
    setDeletionProgress({ current: 0, total: evaluationCount, status: 'Iniciando eliminación...' });
    
    try {
      await onConfirm();
      setDeletionProgress({ current: evaluationCount, total: evaluationCount, status: 'Eliminación completada' });
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onClose();
        setDeletionProgress({ current: 0, total: 0, status: '' });
      }, 1500);
    } catch (error) {
      setDeletionProgress({ current: 0, total: evaluationCount, status: 'Error en la eliminación' });
      console.error('Error durante la eliminación:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Icono de advertencia */}
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
          {title}
        </h3>

        {/* Mensaje */}
        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>

        {/* Información adicional */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-red-800">Esta acción eliminará:</span>
          </div>
          <ul className="text-sm text-red-700 space-y-1 ml-7">
            <li>• {evaluationCount} evaluación{evaluationCount !== 1 ? 'es' : ''}</li>
            <li>• Todos los criterios y puntuaciones</li>
            <li>• Todas las evidencias y archivos adjuntos</li>
            <li>• Los archivos físicos del servidor</li>
          </ul>
        </div>

        {/* Barra de progreso durante eliminación */}
        {isDeleting && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{deletionProgress.status}</span>
              <span>{deletionProgress.current}/{deletionProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${deletionProgress.total > 0 ? (deletionProgress.current / deletionProgress.total) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isDeleting 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isDeleting 
                ? 'bg-red-400 text-white cursor-not-allowed' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Eliminando...
              </div>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 
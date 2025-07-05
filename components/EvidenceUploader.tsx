import React, { useState, useRef, useEffect, FC, ChangeEvent } from 'react';
import { EvidenceFile } from '../services/api';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface EvidenceUploaderProps {
  evaluationId: number;
  competencyId: string;
  conductId: string;
  files?: EvidenceFile[];
  evaluation: any;
  addFiles: Function;
  removeFile: Function;
}

// Toast simple local
const Toast: FC<Toast> = ({ message, type }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded shadow-lg text-white transition-all animate-fade-in-up ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`}
    role="alert"
  >
    {message}
  </div>
);

// ConfirmModal reutilizable (copiado de SummaryPage)
const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}> = ({ open, title, message, confirmText = 'Eliminar', cancelText = 'Cancelar', onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-gray-800 mb-2">{title}</h4>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className="px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const EvidenceUploader: FC<EvidenceUploaderProps> = ({
  evaluationId,
  competencyId,
  conductId,
  files: propFiles,
  evaluation,
  addFiles,
  removeFile
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Obtener archivos directamente del estado global
  const files = evaluation.files[String(conductId).toUpperCase()] || [];

  // LOGS DE DEPURACIÓN
  console.log('EvidenceUploader render:', {
    conductId,
    filesKeys: Object.keys(evaluation.files),
    filesForConduct: evaluation.files[conductId],
    allFiles: evaluation.files
  });

  // Solo mostrar advertencia si hay archivos en la evaluación pero ninguno para esta conducta
  const hasFilesInEvaluation = Object.keys(evaluation.files).length > 0;
  const hasFilesForConduct = Boolean(evaluation.files[conductId]);
  const shouldShowWarning = hasFilesInEvaluation && !hasFilesForConduct && conductId.startsWith('B');

  if (shouldShowWarning) {
    console.warn(`Hay archivos en el estado, pero no para el conductId actual (${conductId}). Keys disponibles:`, Object.keys(evaluation.files));
  }

  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleFiles(files);
      e.target.value = ''; // Reset input
    }
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      // Log para debug: verificar nombres antes de enviar
      console.log('=== ARCHIVOS ANTES DE ENVIAR ===');
      files.forEach((file, index) => {
        // Convertir string a hex sin usar Buffer (compatible con navegador)
        const originalNameHex = Array.from(file.name).map(char => 
          char.charCodeAt(0).toString(16).padStart(2, '0')
        ).join('');
        
        console.log(`Archivo ${index}:`, {
          originalName: file.name,
          originalNameHex: originalNameHex,
          size: file.size,
          type: file.type
        });
      });
      
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await addFiles({
        competencyId,
        conductId,
        fileCount: files.length,
        evaluationId,
        files: files // Pasar directamente el array de File, no DataTransfer
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setToast({
        message: `${files.length} archivo${files.length !== 1 ? 's' : ''} subido${files.length !== 1 ? 's' : ''} correctamente`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      setToast({
        message: error instanceof Error ? error.message : 'Error al subir los archivos',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    setConfirmDeleteId(fileId);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId == null) return;
    try {
      setDeletingFiles(prev => new Set(prev).add(confirmDeleteId));
      await removeFile(competencyId, conductId, confirmDeleteId);
      setToast({ message: 'Archivo eliminado correctamente', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error al eliminar archivo', type: 'error' });
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(confirmDeleteId);
        return newSet;
      });
      setConfirmDeleteId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string | undefined): string => {
    if (!fileType) return '📎';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
    return '📎';
  };

  const canViewInBrowser = (fileType: string | undefined): boolean => {
    if (!fileType) return false;
    // Archivos que se pueden visualizar en el navegador
    return fileType.startsWith('image/') || 
           fileType === 'application/pdf' ||
           fileType === 'text/plain' ||
           fileType === 'text/html';
  };

  const handleFileClick = (file: EvidenceFile) => {
    if (!file.url) return;
    
    // Usar URL absoluta para evitar que el proxy intercepte la petición
    const absoluteUrl = file.url.startsWith('http') ? file.url : `http://localhost:3001${file.url}`;
    
    if (canViewInBrowser(file.file_type)) {
      // Para archivos visualizables, abrir en nueva pestaña
      window.open(absoluteUrl, '_blank');
    } else {
      // Para archivos no visualizables, forzar descarga
      const link = document.createElement('a');
      link.href = absoluteUrl;
      link.download = file.name || 'archivo';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} />}
      
      {/* Mensaje de advertencia si hay archivos pero no para este conductId */}
      {shouldShowWarning && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded p-2 text-xs">
          Hay archivos adjuntos en la evaluación, pero no para esta conducta (<b>{conductId}</b>).<br />
          Conductas con archivos: {Object.keys(evaluation.files).join(', ')}
        </div>
      )}
      
      {/* Área de subida de archivos */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          isDragging 
            ? 'border-indigo-400 bg-indigo-50' 
            : isUploading 
              ? 'border-gray-300 bg-gray-50' 
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Subiendo archivos...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{uploadProgress}% completado</p>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Adjuntar Archivos de Evidencia</span>
            </button>

            <p className="mt-2 text-xs text-gray-500">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-400">
              PDF, Word, Excel, PowerPoint, imágenes (máx. 10MB por archivo)
            </p>
          </>
        )}
      </div>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Archivos adjuntos ({files.length})
          </h4>
          {files.map((file: EvidenceFile) => {
            console.log('Renderizando archivo en EvidenceUploader:', { id: file.id, name: file.name, file_type: file.file_type });
            return (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getFileIcon(file.file_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">
                      {file.file_type || 'Archivo adjunto'}
                    </p>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file_size)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.url && (
                  <button
                    onClick={() => handleFileClick(file)}
                    className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors"
                    title={canViewInBrowser(file.file_type) ? "Ver archivo" : "Descargar archivo"}
                  >
                    {canViewInBrowser(file.file_type) ? (
                      // Icono de ojo para archivos visualizables
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      // Icono de descarga para archivos no visualizables
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleDeleteFile(file.id as number)}
                  disabled={deletingFiles.has(file.id as number)}
                  className={`p-2 rounded-lg transition-colors ${
                    deletingFiles.has(file.id as number)
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                  }`}
                  title="Eliminar archivo"
                >
                  {deletingFiles.has(file.id as number) ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
          })}
        </div>
      )}
      {/* Modal de confirmación para eliminar archivo de evidencia */}
      <ConfirmModal
        open={confirmDeleteId !== null}
        title="¿Eliminar archivo?"
        message={`¿Seguro que quieres eliminar este archivo de evidencia?`}
        loading={confirmDeleteId !== null && deletingFiles.has(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

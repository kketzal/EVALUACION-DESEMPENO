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
  removeAllFilesFromConduct?: Function;
}

// Toast simple local
const Toast: FC<Toast> = ({ message, type }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm border transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-50 text-green-800 border-green-200' 
        : 'bg-red-50 text-red-800 border-red-200'
    }`}
    role="alert"
  >
    <div className="flex items-center gap-3">
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
        type === 'success' ? 'bg-green-100' : 'bg-red-100'
      }`}>
        {type === 'success' ? (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium">{message}</span>
    </div>
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
  'data-testid'?: string;
}> = ({ open, title, message, confirmText = 'Eliminar', cancelText = 'Cancelar', onConfirm, onCancel, loading, 'data-testid': testId }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center" data-testid={testId}>
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
            data-testid="cancel-delete"
          >
            {cancelText}
          </button>
          <button
            className="px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-delete"
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
  removeFile,
  removeAllFilesFromConduct
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // Obtener archivos directamente del estado global
  const files = evaluation.files[String(conductId).toUpperCase()] || [];

  // LOGS DE DEPURACIÓN
  console.log('EvidenceUploader render:', {
    conductId,
    filesKeys: Object.keys(evaluation.files),
    filesForConduct: evaluation.files[conductId],
    allFiles: evaluation.files
  });

  // Comentado: Lógica de advertencia removida por solicitud del usuario
  // const hasFilesInEvaluation = Object.keys(evaluation.files).length > 0;
  // const hasFilesForConduct = Boolean(evaluation.files[conductId]);
  // const shouldShowWarning = hasFilesInEvaluation && !hasFilesForConduct && conductId.startsWith('B');

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
    if (confirmDeleteId === null) return;
    
    try {
      await removeFile(competencyId, conductId, confirmDeleteId.toString());
      setToast({
        message: 'Archivo eliminado correctamente',
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: 'Error al eliminar el archivo',
        type: 'error'
      });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!removeAllFilesFromConduct) return;
    
    try {
      setDeletingAll(true);
      const result = await removeAllFilesFromConduct(competencyId, conductId);
      setToast({
        message: result.message || `${result.deletedCount} archivo${result.deletedCount !== 1 ? 's' : ''} eliminado${result.deletedCount !== 1 ? 's' : ''} correctamente`,
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: 'Error al eliminar los archivos',
        type: 'error'
      });
    } finally {
      setDeletingAll(false);
      setConfirmDeleteAll(false);
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
      

      
      {/* Área de subida de archivos con archivos integrados */}
      <div 
        className={`border-2 border-dashed rounded-lg transition-all duration-200 ${
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
        
        {/* Contenido principal del área de drag & drop */}
        <div className="p-6">
          {isUploading ? (
            <div className="space-y-3 text-center">
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
            <div className="space-y-4">
              {/* Botón de subida y texto informativo */}
              <div className="text-center">
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
              </div>

              {/* Lista de archivos minimalista */}
              {files.length > 0 && (
                <div className="space-y-3" data-testid="file-list">
                  {/* Header con estadísticas */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {files.length} archivo{files.length !== 1 ? 's' : ''} adjunto{files.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {removeAllFilesFromConduct && (
                      <button
                        onClick={() => setConfirmDeleteAll(true)}
                        disabled={deletingAll}
                        data-testid="delete-all-files-button"
                        className={`p-1.5 rounded-md transition-all duration-200 ${
                          deletingAll
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                        }`}
                        title="Eliminar todos los archivos"
                      >
                        {deletingAll ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Grid de archivos compacto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {files.map((file: EvidenceFile) => (
                      <div 
                        key={file.id} 
                        data-testid="file-item"
                        className="group relative flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all duration-200"
                        title={file.name} // Tooltip con nombre completo
                      >
                        {/* Icono del archivo */}
                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-50 rounded flex items-center justify-center">
                          <span className="text-xs">{getFileIcon(file.file_type)}</span>
                        </div>
                        
                        {/* Nombre del archivo truncado */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate group-hover:text-indigo-600 transition-colors">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(file.file_size)}
                          </p>
                        </div>
                        
                        {/* Acciones */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {file.url && (
                            <button
                              onClick={() => handleFileClick(file)}
                              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title={canViewInBrowser(file.file_type) ? "Ver archivo" : "Descargar archivo"}
                            >
                              {canViewInBrowser(file.file_type) ? (
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              ) : (
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteFile(file.id as number)}
                            disabled={deletingFiles.has(file.id as number)}
                            data-testid="delete-file-button"
                            className={`p-1 rounded transition-colors ${
                              deletingFiles.has(file.id as number)
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Eliminar archivo"
                          >
                            {deletingFiles.has(file.id as number) ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                            ) : (
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Modal de confirmación para eliminar archivo de evidencia */}
      <ConfirmModal
        open={confirmDeleteId !== null}
        title="¿Eliminar archivo?"
        message={`¿Seguro que quieres eliminar este archivo de evidencia?`}
        loading={confirmDeleteId !== null && deletingFiles.has(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        data-testid="confirm-delete-modal"
      />

      {/* Modal de confirmación para eliminar todos los archivos */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" data-testid="confirm-delete-all-modal">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">Eliminar todos los archivos</h4>
            <p className="text-gray-600 mb-6">
              Se eliminarán {files.length} archivo{files.length !== 1 ? 's' : ''} de evidencia de esta conducta. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
                onClick={() => setConfirmDeleteAll(false)}
                disabled={deletingAll}
                data-testid="cancel-delete-all"
              >
                Cancelar
              </button>
              <button
                className="px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg disabled:opacity-60"
                onClick={handleDeleteAll}
                disabled={deletingAll}
                data-testid="confirm-delete-all"
              >
                {deletingAll ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto" /> : 'Eliminar todos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

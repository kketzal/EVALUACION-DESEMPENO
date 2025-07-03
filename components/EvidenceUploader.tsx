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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Obtener archivos directamente del estado global
  const files = evaluation.files[conductId] || [];

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
    try {
      // Crear un FileList a partir del array de File
      const dataTransfer = new DataTransfer();
      files.forEach(file => dataTransfer.items.add(file));
      const fileList = dataTransfer.files;
      setIsUploading(true);
      await addFiles({
        competencyId,
        conductId,
        fileCount: fileList.length,
        evaluationId,
        files: fileList
      });
      setToast({
        message: 'Archivos subidos correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      setToast({
        message: 'Error al subir los archivos',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este archivo?')) return;

    try {
      console.log('Eliminando archivo con ID:', fileId);
      await removeFile(competencyId, conductId, fileId);
      console.log('Archivo eliminado exitosamente');
      setToast({ message: 'Archivo eliminado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      setToast({ message: 'Error al eliminar archivo', type: 'error' });
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
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>Adjuntar Archivos de Evidencia</span>
        </button>

        <p className="mt-2 text-xs text-gray-500">
          PDF, Word, Excel, PowerPoint, imágenes (máx. 10MB por archivo)
        </p>
      </div>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file: EvidenceFile) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getFileIcon(file.file_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.original_name || file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file.file_type || 'Archivo adjunto'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.url && (
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className="text-indigo-600 hover:text-indigo-800"
                    title="Ver archivo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Eliminar archivo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

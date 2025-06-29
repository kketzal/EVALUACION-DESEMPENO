import React, { useState, useRef, useEffect, FC, ChangeEvent } from 'react';
import { EvidenceFile } from '../services/api';
import { useEvaluationState } from '../hooks/useEvaluationState';

interface EvidenceUploaderProps {
  evaluationId: number;
  competencyId: string;
  conductId: string;
  files?: EvidenceFile[];
}

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

// Toast simple local
const Toast: FC<ToastProps> = ({ message, type = 'success', onClose }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded shadow-lg text-white transition-all animate-fade-in-up ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`}
    role="alert"
    onClick={onClose}
    style={{ cursor: 'pointer' }}
  >
    {message}
    <span className="ml-2 text-lg font-bold align-middle">×</span>
  </div>
);

export const EvidenceUploader: FC<EvidenceUploaderProps> = ({
  evaluationId,
  competencyId,
  conductId,
  files: propFiles
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFiles, removeFile, evaluation } = useEvaluationState();

  // Obtener archivos directamente del estado global
  const files = evaluation.files[conductId] || [];

  // Log props cuando el componente se monta
  useEffect(() => {
    console.log('EvidenceUploader mounted with props:', {
      evaluationId,
      competencyId,
      conductId,
      propFilesCount: propFiles?.length || 0,
      stateFilesCount: files.length,
      stateFiles: files,
      allEvaluationFiles: evaluation.files
    });
  }, [evaluationId, competencyId, conductId, propFiles, files, evaluation.files]);

  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('=== INICIO DE CARGA DE ARCHIVOS ===');
    console.log('Archivos seleccionados:', files);
    console.log('Props del componente:', { evaluationId, competencyId, conductId });
    console.log('Archivos actuales:', files);

    try {
      // Llamar a addFiles con el evaluationId y los archivos
      await addFiles({ 
        competencyId, 
        conductId, 
        fileCount: files.length,
        evaluationId,
        files
      });

      console.log('Archivos subidos exitosamente');

      // Mostrar toast de éxito
      setToast({ message: 'Archivos subidos exitosamente', type: 'success' });
      setTimeout(() => setToast(null), 3000);

    } catch (error) {
      console.error('Error al subir archivos:', error);
      setToast({ message: 'Error al subir archivos', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }

    // Limpiar el input
    event.target.value = '';
    console.log('=== FIN DE CARGA DE ARCHIVOS ===');
  };

  const handleDeleteFile = async (fileId: string) => {
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

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Botón de debug temporal */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-800 mb-2">Debug: Archivos cargados: {files.length}</p>
        <button
          onClick={() => {
            console.log('Estado actual de archivos:', files);
            console.log('Estado completo de evaluación:', evaluation);
          }}
          className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-300"
        >
          Ver logs de debug
        </button>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">Subiendo archivos... {uploadProgress}%</p>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Adjuntar Archivos de Evidencia</span>
          </button>
        )}
        
        <p className="mt-2 text-xs text-gray-500">
          PDF, Word, Excel, PowerPoint, imágenes (máx. 10MB por archivo)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Archivos adjuntos:</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.type} • Archivo adjunto
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.content && (
                    <a
                      href={file.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Ver archivo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar archivo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

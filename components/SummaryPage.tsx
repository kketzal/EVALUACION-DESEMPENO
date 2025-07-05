import React, { useState, useEffect } from 'react';
import { EvaluationState, Competency } from '../types';
import { ReportActions } from './ReportActions';
import { competencies } from '../data/evaluationData';
import { FileIcon, TrashIcon } from './icons';

interface SummaryPageProps {
  evaluation: EvaluationState;
  onSave: () => void;
  onRemoveFile: (conductId: string, fileId: number) => void;
}

// Función para limpiar archivos sin ID válido
const cleanInvalidFiles = (files: Record<string, any[]>): Record<string, any[]> => {
  const cleanedFiles: Record<string, any[]> = {};
  
  Object.entries(files).forEach(([conductId, fileList]) => {
    const validFiles = fileList.filter(file => {
      if (!file.id || file.id === 'undefined' || file.id === 'null' || file.id === '') {
        console.warn('Archivo sin ID válido encontrado en SummaryPage y removido:', {
          conductId,
          file,
          fileName: file.name
        });
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      cleanedFiles[conductId] = validFiles;
    }
  });
  
  return cleanedFiles;
};

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

export const SummaryPage: React.FC<SummaryPageProps> = ({ evaluation, onSave, onRemoveFile }) => {
  const [deleteTarget, setDeleteTarget] = useState<{conductId: string, file: any} | null>(null);
  const [filesOnDisk, setFilesOnDisk] = useState<string[]>([]);
  const [deletingOrphan, setDeletingOrphan] = useState<string | null>(null);
  const [orphanToast, setOrphanToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmOrphan, setConfirmOrphan] = useState<string | null>(null);

  const canViewInBrowser = (fileType: string | undefined): boolean => {
    if (!fileType) return false;
    // Archivos que se pueden visualizar en el navegador
    return fileType.startsWith('image/') || 
           fileType === 'application/pdf' ||
           fileType === 'text/plain' ||
           fileType === 'text/html';
  };

  const handleFileClick = (file: any, fileUrl: string) => {
    // Usar URL absoluta para evitar que el proxy intercepte la petición
    const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:3001${fileUrl}`;
    
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

  useEffect(() => {
    fetch('/api/evidence-files-on-disk')
      .then(res => res.json())
      .then(data => {
        setFilesOnDisk(data.files || []);
      })
      .catch(() => setFilesOnDisk([]));
  }, []);

  // Limpiar archivos sin ID válido antes de procesar
  const cleanedFiles = cleanInvalidFiles(evaluation.files);

  // Contar el total de archivos (solo archivos válidos)
  const totalFiles = Object.values(cleanedFiles).reduce((sum, files) => sum + files.length, 0);

  // Encuentra archivos en disco que no están en la BD (usar SIEMPRE file_name completo)
  const filesInBD = Object.values(cleanedFiles).flat().map(f => (f as any).file_name);
  const orphanFilesOnDisk = filesOnDisk.filter(filePath => !filesInBD.includes(filePath));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Resumen y Guardado
          </h1>
          <p className="text-gray-600 text-sm">
            Revisa los archivos de evidencia y guarda la evaluación completa
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{totalFiles}</h3>
          <p className="text-sm text-gray-600">Archivos de evidencia</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{Object.keys(cleanedFiles).length}</h3>
          <p className="text-sm text-gray-600">Conductas con archivos</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{orphanFilesOnDisk.length}</h3>
          <p className="text-sm text-gray-600">Archivos huérfanos</p>
        </div>
      </div>

      {/* Archivos de evidencia */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">
              Archivos de Evidencia
              {totalFiles > 0 && (
                <span className="ml-2 text-sm font-normal text-blue-100">
                  ({totalFiles} archivo{totalFiles !== 1 ? 's' : ''} en total)
                </span>
              )}
            </h3>
          </div>
        </div>
        
        <div className="p-6">
          {totalFiles > 0 ? (
            <div className="space-y-6">
              {competencies.map(comp => {
                // Obtener todos los archivos para las conductas de esta competencia
                const competencyFiles = Object.entries(cleanedFiles)
                  .filter(([conductId]) => conductId.startsWith(comp.id))
                  .reduce((acc, [conductId, files]) => {
                    if (files && files.length > 0) {
                      acc[conductId] = files;
                    }
                    return acc;
                  }, {} as Record<string, any[]>);

                const hasFiles = Object.keys(competencyFiles).length > 0;

                if (!hasFiles) return null;

                return (
                  <div key={comp.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-gray-800">{comp.title}</h4>
                    </div>
                    
                    <div className="space-y-4">
                      {Object.entries(competencyFiles).map(([conductId, files]) => {
                        const conduct = comp.conducts.find(c => c.id === conductId);
                        return (
                          <div key={conductId} className="bg-white rounded-lg p-4 border border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
                              Conducta {conductId}: {conduct?.description}
                            </h5>
                            <div className="space-y-2">
                              {files.map(file => {
                                const fileNameOnDisk = (file as any).file_name;
                                const existsOnDisk = filesOnDisk.some(f => f.endsWith(fileNameOnDisk));
                                // LOG DE DEPURACIÓN
                                console.log('[RESUMEN] file_name:', fileNameOnDisk, 'existsOnDisk:', existsOnDisk, 'filesOnDisk:', filesOnDisk);
                                const fileUrl = existsOnDisk ? `/api/files/${fileNameOnDisk}` : undefined;
                                return (
                                  <div key={file.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${!existsOnDisk ? 'bg-red-50 border-red-200 opacity-70' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                                    <div className={`p-2 rounded-lg ${!existsOnDisk ? 'bg-red-100' : 'bg-blue-100'}`}>
                                      <FileIcon className={`h-5 w-5 ${!existsOnDisk ? 'text-red-500' : 'text-blue-500'}`} />
                                    </div>
                                    <button
                                      onClick={() => existsOnDisk && fileUrl ? handleFileClick(file, fileUrl) : null}
                                      disabled={!existsOnDisk}
                                      className={`text-sm truncate flex-1 font-medium text-left ${existsOnDisk ? 'text-gray-700 hover:text-blue-600' : 'text-red-500 line-through cursor-not-allowed'}`}
                                      title={existsOnDisk ? (canViewInBrowser(file.file_type) ? 'Ver archivo' : 'Descargar archivo') : 'Archivo no encontrado en servidor'}
                                      style={{ cursor: existsOnDisk ? 'pointer' : 'not-allowed' }}
                                    >
                                      {(file as any).name}
                                    </button>
                                    
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => existsOnDisk && fileUrl ? handleFileClick(file, fileUrl) : null}
                                        disabled={!existsOnDisk}
                                        className={`p-2 rounded-lg transition-colors ${!existsOnDisk ? 'bg-red-100 text-red-500 opacity-40 cursor-not-allowed' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                                        title={existsOnDisk ? (canViewInBrowser(file.file_type) ? 'Ver archivo' : 'Descargar archivo') : 'Archivo no encontrado en servidor'}
                                      >
                                        {canViewInBrowser(file.file_type) ? (
                                          // Icono de ojo para archivos visualizables
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7z" />
                                          </svg>
                                        ) : (
                                          // Icono de descarga para archivos no visualizables
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                        )}
                                      </button>
                                      
                                      {!existsOnDisk && (
                                        <span className="text-xs text-red-600 font-semibold px-2 py-1 bg-red-100 rounded-full">
                                          No encontrado
                                        </span>
                                      )}
                                      
                                      <button
                                        type="button"
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Eliminar archivo"
                                        onClick={() => {
                                          if (!file.id) {
                                            console.error('El archivo no tiene ID, no se puede eliminar de la BD:', file);
                                            alert('No se puede eliminar este archivo porque no tiene ID en la base de datos.');
                                            return;
                                          }
                                          setDeleteTarget({ conductId, file });
                                        }}
                                      >
                                        <TrashIcon className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay archivos de evidencia</h3>
              <p className="text-gray-600">Aún no se han adjuntado archivos de evidencia a esta evaluación.</p>
            </div>
          )}
        </div>
      </div>

      {/* ReportActions */}
      <div className="mb-8">
        <ReportActions
          evaluation={evaluation}
          onSave={onSave}
          isSavable={evaluation.workerId !== null}
        />
      </div>

      {/* Archivos huérfanos */}
      {orphanFilesOnDisk.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Archivos Huérfanos en el Servidor</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">Estos archivos existen en el servidor pero no están registrados en la base de datos. Puedes eliminarlos físicamente si ya no los necesitas.</p>
            {orphanToast && (
              <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${orphanToast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{orphanToast.message}</div>
            )}
            <div className="space-y-2">
              {orphanFilesOnDisk.map(fileName => (
                <div key={fileName} className="flex items-center gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FileIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span className="text-sm text-yellow-800 flex-1 font-medium">{fileName}</span>
                  <button
                    type="button"
                    className={`p-2 rounded-lg transition-colors ${deletingOrphan === fileName ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700 hover:bg-red-100'}`}
                    title="Eliminar archivo físicamente"
                    disabled={deletingOrphan === fileName}
                    onClick={() => setConfirmOrphan(fileName)}
                  >
                    {deletingOrphan === fileName ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <TrashIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar archivo huérfano */}
      <ConfirmModal
        open={!!confirmOrphan}
        title="¿Eliminar archivo?"
        message={`¿Seguro que quieres eliminar el archivo físico '${confirmOrphan}' del servidor?`}
        loading={!!deletingOrphan}
        onCancel={() => setConfirmOrphan(null)}
        onConfirm={async () => {
          if (!confirmOrphan) return;
          setDeletingOrphan(confirmOrphan);
          setOrphanToast(null);
          try {
            const res = await fetch(`/api/evidence-files-on-disk?file=${encodeURIComponent(confirmOrphan)}`, { method: 'DELETE' });
            if (res.ok) {
              setFilesOnDisk(filesOnDisk.filter(f => f !== confirmOrphan));
              setOrphanToast({ type: 'success', message: 'Archivo eliminado correctamente.' });
            } else {
              setOrphanToast({ type: 'error', message: 'Error al eliminar el archivo.' });
            }
          } catch (e) {
            setOrphanToast({ type: 'error', message: 'Error al eliminar el archivo.' });
          } finally {
            setDeletingOrphan(null);
            setConfirmOrphan(null);
          }
        }}
      />

      {/* Modal de confirmación para eliminar archivo */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">¿Eliminar archivo?</h4>
            <p className="text-gray-600 mb-6">¿Seguro que quieres eliminar <span className='font-semibold text-gray-800'>{(deleteTarget.file as any).name}</span>?</p>
            <div className="flex gap-3 justify-center">
              <button
                className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                className="px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg"
                onClick={() => {
                  if (!deleteTarget.file.id) {
                    console.error('El archivo no tiene ID, no se puede eliminar de la BD:', deleteTarget.file);
                    alert('No se puede eliminar este archivo porque no tiene ID en la base de datos.');
                    setDeleteTarget(null);
                    return;
                  }
                  onRemoveFile(deleteTarget.conductId, deleteTarget.file.id);
                  setDeleteTarget(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

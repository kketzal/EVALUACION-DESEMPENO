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
          fileName: file.name || file.original_name
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

export const SummaryPage: React.FC<SummaryPageProps> = ({ evaluation, onSave, onRemoveFile }) => {
  const [deleteTarget, setDeleteTarget] = useState<{conductId: string, file: any} | null>(null);
  const [filesOnDisk, setFilesOnDisk] = useState<string[]>([]);

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

  // Encuentra archivos en disco que no están en la BD
  const filesInBD = Object.values(cleanedFiles).flat().map(f => (f as any).file_name || f.name);
  const orphanFilesOnDisk = filesOnDisk.filter(fileName => !filesInBD.includes(fileName));

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Resumen y Guardado de la Evaluación</h2>
        <p className="text-sm text-gray-600 italic">Revise los archivos de evidencia y guarde la evaluación completa.</p>
      </div>
      
      <div className="bg-white shadow-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Resumen de Archivos de Evidencia
          {totalFiles > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({totalFiles} archivo{totalFiles !== 1 ? 's' : ''} en total)
            </span>
          )}
        </h3>
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
                <div key={comp.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b">
                    {comp.title}
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(competencyFiles).map(([conductId, files]) => {
                      const conduct = comp.conducts.find(c => c.id === conductId);
                      return (
                        <div key={conductId} className="pl-4">
                          <h5 className="text-sm font-medium text-gray-600 mb-2">
                            Conducta {conductId}: {conduct?.description}
                          </h5>
                          <ul className="space-y-2">
                            {files.map(file => {
                              const fileNameOnDisk = (file as any).file_name || file.name;
                              const existsOnDisk = filesOnDisk.includes(fileNameOnDisk);
                              const fileUrl = `/uploads/evidence/${fileNameOnDisk}`;
                              return (
                                <li key={file.id} className={`flex items-center gap-3 bg-gray-50 p-2 rounded ${!existsOnDisk ? 'opacity-70' : ''}`}>
                                  <FileIcon className="h-5 w-5 text-gray-400" />
                                  <a
                                    href={existsOnDisk ? fileUrl : undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-sm truncate flex-1 ${existsOnDisk ? 'text-gray-700 hover:underline focus:underline' : 'text-red-500 line-through cursor-not-allowed'}`}
                                    title={existsOnDisk ? 'Ver/Descargar archivo' : 'Archivo no encontrado en servidor'}
                                    style={{ cursor: existsOnDisk ? 'pointer' : 'not-allowed' }}
                                    tabIndex={existsOnDisk ? 0 : -1}
                                    onClick={e => { if (!existsOnDisk) e.preventDefault(); }}
                                  >
                                    {(file as any).original_name || (file as any).file_name || file.name}
                                  </a>
                                  <a
                                    href={existsOnDisk ? fileUrl : undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-indigo-600 hover:text-indigo-800 relative group flex items-center justify-center ${!existsOnDisk ? 'pointer-events-none opacity-40' : ''}`}
                                    title={existsOnDisk ? 'Ver/Descargar archivo' : 'Archivo no encontrado en servidor'}
                                    style={{ minWidth: '2.5rem', cursor: existsOnDisk ? 'pointer' : 'not-allowed' }}
                                    tabIndex={existsOnDisk ? 0 : -1}
                                    onClick={e => { if (!existsOnDisk) e.preventDefault(); }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 rounded bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50">{existsOnDisk ? 'Ver/Descargar archivo' : 'Archivo no encontrado en servidor'}</span>
                                  </a>
                                  {!existsOnDisk && (
                                    <span className="text-xs text-red-500 font-semibold ml-2">Archivo no encontrado en servidor</span>
                                  )}
                                  <button
                                    type="button"
                                    className="ml-2 text-red-500 hover:text-red-700 p-1 rounded transition"
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
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic">No se han adjuntado archivos de evidencia.</p>
        )}
      </div>

      <ReportActions
        evaluation={evaluation}
        onSave={onSave}
        isSavable={evaluation.workerId !== null}
      />

      {/* Modal de confirmación para eliminar archivo */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
            <h4 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar archivo?</h4>
            <p className="text-gray-600 mb-4">¿Seguro que quieres eliminar <span className='font-semibold'>{(deleteTarget.file as any).original_name || (deleteTarget.file as any).name}</span>?</p>
            <div className="flex gap-4 justify-center mt-6">
              <button
                className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
                onClick={() => setDeleteTarget(null)}
              >Cancelar</button>
              <button
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition shadow"
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
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Archivos en disco no registrados en la BD */}
      {orphanFilesOnDisk.length > 0 && (
        <div className="bg-white shadow-md rounded-xl p-6 mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Archivos huérfanos en el servidor</h3>
          <p className="text-sm text-gray-600 mb-4">Estos archivos existen en el servidor pero no están registrados en la base de datos. Puedes eliminarlos físicamente si ya no los necesitas.</p>
          <ul className="space-y-2">
            {orphanFilesOnDisk.map(fileName => (
              <li key={fileName} className="flex items-center gap-3 bg-yellow-50 p-2 rounded">
                <FileIcon className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-yellow-800 flex-1">{fileName}</span>
                <button
                  type="button"
                  className="ml-2 text-red-500 hover:text-red-700 p-1 rounded transition"
                  title="Eliminar archivo físicamente"
                  onClick={async () => {
                    if (window.confirm(`¿Seguro que quieres eliminar el archivo físico '${fileName}' del servidor?`)) {
                      await fetch(`/api/evidence-files-on-disk?file=${encodeURIComponent(fileName)}`, { method: 'DELETE' });
                      setFilesOnDisk(filesOnDisk.filter(f => f !== fileName));
                    }
                  }}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

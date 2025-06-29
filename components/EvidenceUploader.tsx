
import React, { useState } from 'react';
import { UploadIcon, FileIcon, TrashIcon } from './icons';
import { EvidenceFile } from '../types';

interface EvidenceUploaderProps {
    files: EvidenceFile[];
    onFilesAdded: (files: FileList) => void;
    onFileRemoved: (fileId: string) => void;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ files, onFilesAdded, onFileRemoved }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesAdded(e.dataTransfer.files);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesAdded(e.target.files);
        }
    };
    
    return (
        <div className="bg-gray-50 rounded-lg p-6 border">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Archivos de Evidencia del Bloque</h3>
            <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                    Arrastre y suelte archivos aquí o{' '}
                    <label htmlFor="file-upload" className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
                        haga clic para buscar
                    </label>
                </p>
                <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} />
                <p className="text-xs text-gray-500 mt-1">Soporta documentos, fotos y otros archivos.</p>
            </div>

            {files.length > 0 && (
                <div className="mt-6">
                    <h4 className="font-semibold text-gray-700 mb-2">Archivos Cargados:</h4>
                    <ul className="space-y-2">
                        {files.map((file) => (
                            <li key={file.id} className="flex items-center justify-between bg-white border p-2 rounded-md">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-800 truncate" title={file.name}>{file.name}</span>
                                </div>
                                <button onClick={() => onFileRemoved(file.id)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full flex-shrink-0" aria-label="Eliminar archivo">
                                    <TrashIcon className="h-5 w-5"/>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

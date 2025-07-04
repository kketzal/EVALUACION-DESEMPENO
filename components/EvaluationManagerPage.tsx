import React, { useState, useEffect } from 'react';
import { Evaluation } from '../types';

interface EvaluationManagerPageProps {
  evaluations: Evaluation[];
  onOpen: (evaluationId: number) => void;
  onDelete: (evaluationIds: number[]) => void;
  onDeleteAll: () => void;
  onCreateNew: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const EvaluationManagerPage: React.FC<EvaluationManagerPageProps> = ({
  evaluations,
  onOpen,
  onDelete,
  onDeleteAll,
  onCreateNew,
  onClose,
  isLoading = false
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'period' | 'worker'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtrar evaluaciones por término de búsqueda
  const filteredEvaluations = evaluations.filter(evaluation => {
    const searchLower = searchTerm.toLowerCase();
    return (
      evaluation.period.toLowerCase().includes(searchLower) ||
      (evaluation as any).worker_name?.toLowerCase().includes(searchLower) ||
      evaluation.version?.toString().includes(searchLower)
    );
  });

  // Ordenar evaluaciones
  const sortedEvaluations = [...filteredEvaluations].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'period':
        comparison = a.period.localeCompare(b.period);
        break;
      case 'worker':
        comparison = ((a as any).worker_name || '').localeCompare((b as any).worker_name || '');
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedEvaluations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedEvaluations.map(e => e.id));
    }
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    
    const message = selectedIds.length === 1 
      ? '¿Seguro que quieres eliminar la evaluación seleccionada?'
      : `¿Seguro que quieres eliminar las ${selectedIds.length} evaluaciones seleccionadas?`;
    
    if (window.confirm(message)) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('¿Seguro que quieres eliminar TODAS las evaluaciones? Esta acción no se puede deshacer.')) {
      onDeleteAll();
      setSelectedIds([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', { 
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Evaluaciones</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onCreateNew}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Nueva Evaluación
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar evaluaciones
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por periodo, trabajador o versión..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'period' | 'worker')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="date">Fecha</option>
                  <option value="period">Periodo</option>
                  <option value="worker">Trabajador</option>
                </select>
              </div>
              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
                  Orden
                </label>
                <select
                  id="order"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-yellow-800">
                {selectedIds.length} evaluación{selectedIds.length !== 1 ? 'es' : ''} seleccionada{selectedIds.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Eliminar seleccionadas
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evaluations List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando evaluaciones...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay evaluaciones</h3>
              <p className="text-gray-600 mb-4">No se han encontrado evaluaciones guardadas.</p>
              <button
                onClick={onCreateNew}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Crear primera evaluación
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === sortedEvaluations.length && sortedEvaluations.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {sortedEvaluations.length} evaluación{sortedEvaluations.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  {evaluations.length > 0 && (
                    <button
                      onClick={handleDeleteAll}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      Eliminar todas
                    </button>
                  )}
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {sortedEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(evaluation.id)}
                          onChange={() => toggleSelect(evaluation.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">
                                {(evaluation as any).worker_name || 'Trabajador no especificado'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Periodo: {evaluation.period} | Versión: {evaluation.version || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Creada: {formatDate(evaluation.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onOpen(evaluation.id)}
                          className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Abrir
                        </button>
                        <button
                          onClick={() => onDelete([evaluation.id])}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 
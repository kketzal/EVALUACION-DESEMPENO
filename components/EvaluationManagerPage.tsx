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
      {/* Header - Móvil optimizado */}
      <div className="flex items-center gap-3 mb-6 px-4 pt-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Gestionar Evaluaciones
          </h1>
          <p className="text-gray-600 text-sm">{evaluations.length} total</p>
        </div>
      </div>

      {/* Content - Móvil optimizado */}
      <div className="px-4 py-4">
        {/* Estadísticas simplificadas */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">Periodos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{new Set(evaluations.map(e => e.period)).size}</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">Trabajadores</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{new Set(evaluations.map(e => (e as any).worker_name)).size}</p>
          </div>
        </div>

        {/* Controles simplificados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          {/* Búsqueda */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar evaluaciones..."
              className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'period' | 'worker')}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="date">Fecha</option>
              <option value="period">Periodo</option>
              <option value="worker">Trabajador</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="desc">↓</option>
              <option value="asc">↑</option>
            </select>
          </div>
        </div>

        {/* Acciones de selección */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">
                {selectedIds.length} seleccionada{selectedIds.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de evaluaciones - Cards móviles */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Cargando...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay evaluaciones</h3>
              <p className="text-sm text-gray-600 mb-4">Crea tu primera evaluación</p>
              <button
                onClick={onCreateNew}
                className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
              >
                Crear evaluación
              </button>
            </div>
          ) : (
            <>
              {/* Header de la lista */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
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
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Eliminar todas
                  </button>
                )}
              </div>

              {/* Cards de evaluaciones */}
              {sortedEvaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    {/* Header de la card */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(evaluation.id)}
                          onChange={() => toggleSelect(evaluation.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {(evaluation as any).worker_name || 'Trabajador no especificado'}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(evaluation.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Badges de información */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {evaluation.period}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        v{evaluation.version || 'N/A'}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => onOpen(evaluation.id)}
                        className="flex-1 px-3 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors font-medium"
                      >
                        Abrir
                      </button>
                      <button
                        onClick={() => onDelete([evaluation.id])}
                        className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 
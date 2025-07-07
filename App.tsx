import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { CompetencyBlock } from './components/CompetencyBlock';
import { useEvaluationState, getVisibleCompetencies as getVisibleCompetenciesFromHook, getInitialState } from './hooks/useEvaluationState';
import { Sidebar } from './components/Sidebar';
import { SummaryPage } from './components/SummaryPage';
import { AddWorkerModal } from './components/AddWorkerModal';
import { UserPlusIcon } from './components/icons';
import { EvidenceFile, apiService } from './services/api';
import { Worker } from './types';
import { EvidenceUploader } from './components/EvidenceUploader';
import ManageUsersModal from './components/ManageUsersModal';
import ManageUsersPanel from './components/ManageUsersPanel';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import { SettingsPage } from './components/SettingsPage';
import { ExportModal } from './components/ExportModal';
import { RevisionSelectorModal } from './components/RevisionSelectorModal';
import { Evaluation as TypesEvaluation } from './types';
import { Evaluation } from './services/api';
import VersionManagerModal from './components/VersionManagerModal';
import { EvaluationManagerPage } from './components/EvaluationManagerPage';

function WorkerSelectorModal({ workers, isOpen, onSelect, onClose, setWorkerSession, isLoading = false, isWorkerSelectorLoading = false }: {
  workers: Worker[];
  isOpen: boolean;
  onSelect: (id: string, token: string) => void;
  onClose: () => void;
  setWorkerSession: (args: { workerId: string, token: string }) => void;
  isLoading?: boolean;
  isWorkerSelectorLoading?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Resetear estado cuando se abre el modal
  React.useEffect(() => {
    if (isOpen) {
      setSelectedWorker(null);
      setPasswordInput('');
      setPasswordError('');
      setSearch('');
      setIsAuthenticating(false);
      setShowPassword(false);
    }
  }, [isOpen]);
  
  const filtered = workers.filter((w: Worker) => w.name.toLowerCase().includes(search.toLowerCase()));
  
  if (!isOpen) return null;

  const handleWorkerSelect = (worker: Worker) => {
    setSelectedWorker(worker);
    setPasswordInput('');
    setPasswordError('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    if (passwordInput.trim().length < 3) {
      setPasswordError('Contraseña incorrecta o demasiado corta.');
      return;
    }
    setIsAuthenticating(true);
    try {
      const result = await apiService.authenticateWorker(selectedWorker.id, passwordInput);
      if (!result.success || !result.token) {
        setPasswordError('Contraseña incorrecta.');
        return;
      }
      setWorkerSession({ workerId: selectedWorker.id, token: result.token });
      onSelect(selectedWorker.id, result.token);
      onClose();
    } catch (error) {
      setPasswordError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCancel = () => {
    setSelectedWorker(null);
    setPasswordInput('');
    setPasswordError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {selectedWorker ? 'Introduce tu contraseña' : 'Seleccionar Trabajador/a'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!selectedWorker ? (
          <>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 1010 17a7 7 0 007-7z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar trabajador/a..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-gray-900 border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-base sm:text-lg transition-all duration-150"
              />
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">
                    {isWorkerSelectorLoading ? 'Preparando lista de trabajadores...' : 'Cargando lista de trabajadores...'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Por favor espera</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-4 text-gray-500 text-center">No hay resultados</div>
              ) : (
                filtered.map((worker: Worker) => (
                  <button
                    key={worker.id}
                    onClick={() => handleWorkerSelect(worker)}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded transition-colors flex items-center gap-2"
                  >
                    <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <div>
                      <div className="text-sm font-medium text-indigo-900 break-words" style={{wordBreak: 'break-word'}}>{worker.name}</div>
                      <div className="text-sm text-indigo-700">{worker.worker_group}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-indigo-900 break-words" style={{wordBreak: 'break-word'}}>{selectedWorker.name}</div>
                  <div className="text-sm text-indigo-700">{selectedWorker.worker_group}</div>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-3 px-4 text-base shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition placeholder-gray-400 pr-12"
                  placeholder="Introduce tu contraseña"
                  autoFocus
                  required
                />
                {passwordInput && (
                  <button
                    type="button"
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none"
                    aria-label="Borrar contraseña"
                    onClick={() => setPasswordInput("")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 focus:outline-none"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m1.664-2.13A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 2.21-.715 4.25-1.925 5.925M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .53-.138 1.03-.38 1.46M6.1 6.1A9.956 9.956 0 002 12c0 5.523 4.477 10 10 10 1.657 0 3.22-.402 4.575-1.125m2.13-1.664A9.956 9.956 0 0022 12c0-2.21-.715-4.25-1.925-5.925" /></svg>
                  )}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="text-red-600 text-sm">{passwordError}</div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAuthenticating ? 'Verificando...' : 'Acceder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function App() {
  const [globalT1SevenPoints, setGlobalT1SevenPoints] = useState<boolean>(true);
  // Al iniciar la app, obtener la configuración global
  useEffect(() => {
    apiService.getGlobalEvaluationSettings().then(cfg => {
      setGlobalT1SevenPoints(cfg.useT1SevenPoints);
    }).catch(() => setGlobalT1SevenPoints(true));
  }, []);

  const { evaluation, ...useEvaluationStateProps } = useEvaluationState(globalT1SevenPoints);

  // Leer valores iniciales de localStorage
  const getInitialActivePage = () => localStorage.getItem('activePage') || 'competency';
  const getInitialActiveCompetencyId = () => localStorage.getItem('activeCompetencyId') || 'B';

  const [activeCompetencyId, setActiveCompetencyId] = useState<string>(getInitialActiveCompetencyId());
  const [activePage, setActivePage] = useState<string>(getInitialActivePage());
  const [isAddWorkerModalOpen, setAddWorkerModalOpen] = useState(false);
  const [isManageUsersModalOpen, setManageUsersModalOpen] = useState(false);
  const [isWorkerSelectorOpen, setIsWorkerSelectorOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarClosing, setSidebarClosing] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [pendingWorkerId, setPendingWorkerId] = useState<string | null>(null);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [dbLoading, setDbLoading] = React.useState(false);
  const [dbMessage, setDbMessage] = React.useState<string | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<number>(60);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [workerSelectorResetKey, setWorkerSelectorResetKey] = useState(0); // Para forzar reset del modal
  const [addWorkerModalKey, setAddWorkerModalKey] = useState(0); // Para forzar reset del modal de añadir trabajador
  const [isWorkerSelectorLoading, setIsWorkerSelectorLoading] = useState(false);

  // --- NUEVO ESTADO PARA EL MODAL DE EVALUACIÓN ---
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [isProcessingEvaluation, setIsProcessingEvaluation] = useState(false);
  // Bandera simple para evitar reapertura inmediata del modal
  const [modalJustClosed, setModalJustClosed] = useState(false);

  // Sincronizar timeout con el servidor
  useEffect(() => {
    const fetchTimeout = async () => {
      try {
        const res = await fetch('/api/settings/session-timeout');
        const data = await res.json();
        setSessionTimeout(data.timeout || 60);
      } catch (error) {
        console.error('Error al obtener timeout:', error);
      }
    };
    fetchTimeout();
  }, []);

  // Establecer la primera competencia activa cuando se carguen los workers
  useEffect(() => {
    console.log('Efecto de inicialización:', {
      workerId: evaluation.workerId,
      workersLength: evaluation.workers.length,
      activeCompetencyId,
      activePage,
      loadingSession
    });
    
    // Solo ejecutar si hay un trabajador seleccionado, workers cargados, no estamos cargando la sesión, y no estamos en una página especial
    if (evaluation.workerId && evaluation.workers.length > 0 && !loadingSession && 
        activePage !== 'settings' && activePage !== 'summary' && activePage !== 'manage-users') {
      const worker = evaluation.workers.find(w => w.id === evaluation.workerId);
      console.log('Worker encontrado:', worker);
      
      if (worker) {
        const visibleCompetencies = getVisibleCompetenciesFromHook(worker.worker_group ?? null);
        console.log('Competencias visibles:', visibleCompetencies);
        
        // Verificar si la competencia activa actual es válida para este trabajador
        const isValidCompetency = visibleCompetencies.find(c => c.id === activeCompetencyId);
        
        if (visibleCompetencies.length > 0) {
          if (!isValidCompetency) {
            // La competencia activa no es válida para este trabajador, usar la primera
            console.log('Competencia activa no válida, estableciendo primera competencia:', visibleCompetencies[0].id);
            setActiveCompetencyId(visibleCompetencies[0].id);
            // Solo cambiar a competency si no estamos en una página especial
            if (activePage !== 'settings' && activePage !== 'summary' && activePage !== 'manage-users' && activePage !== 'evaluation-manager') {
              setActivePage('competency');
            }
          } else {
            // La competencia activa es válida, mantenerla
            console.log('Competencia activa válida, manteniendo:', activeCompetencyId);
            // Solo cambiar a competency si no estamos en una página especial
            if (activePage !== 'settings' && activePage !== 'summary' && activePage !== 'manage-users' && activePage !== 'evaluation-manager') {
              setActivePage('competency');
            }
          }
        }
      }
    }
  }, [evaluation.workerId, evaluation.workers, loadingSession, activeCompetencyId, activePage]);

  const handleWorkerChange = async (workerId: string) => {
    console.log('Seleccionando trabajador:', workerId);
    try {
      await useEvaluationStateProps.setWorkerId(workerId);
      const worker = evaluation.workers.find(w => w.id === workerId);
      // Establecer la primera competencia visible como activa
      if (worker) {
        const visibleCompetencies = getVisibleCompetenciesFromHook(worker.worker_group ?? null);
        if (visibleCompetencies.length > 0) {
          setActiveCompetencyId(visibleCompetencies[0].id);
        }
      }
      // Guardar la evaluación actual
      if (evaluation.evaluationId) {
        saveUserEvaluation(workerId, evaluation.period, evaluation.evaluationId);
      }
      setIsWorkerSelectorOpen(false);
    } catch (error: any) {
      if (error.message === 'NO_EVALUATION_FOUND') {
        // No hay evaluación para este trabajador/periodo, mostrar modal de selección de evaluación
        console.log('No se encontró evaluación al cambiar trabajador, mostrando modal de selección');
        setPendingWorkerId(workerId);
        setPendingToken(evaluation.token || '');
        setShowRevisionModal(true);
        setIsWorkerSelectorOpen(false);
      } else {
        console.error('Error al cambiar trabajador:', error);
        // Mostrar error al usuario si es necesario
      }
    }
  };

  const handleAddWorker = async (name: string, group: 'GRUPO 1-2' | 'GRUPO 3-4', password: string) => {
    const newWorkerId = await useEvaluationStateProps.addWorker(name, group, password);
    setAddWorkerModalOpen(false);
    if (newWorkerId) {
      await useEvaluationStateProps.setWorkerId(newWorkerId);
      // Selecciona la primera competencia visible
      const worker = evaluation.workers.find(w => w.id === newWorkerId);
      const visibleCompetencies = getVisibleCompetenciesFromHook(worker?.worker_group ?? null);
      if (visibleCompetencies.length > 0) {
        setActiveCompetencyId(visibleCompetencies[0].id);
      }
    }
  };

  const handleExitApp = async () => {
    setLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      try {
        await fetch('/api/session/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token },
        });
      } catch (e) { /* ignorar error */ }
    }
    localStorage.removeItem('sessionToken');
    clearUserEvaluation(); // Limpiar la evaluación guardada
    useEvaluationStateProps.setWorkerSession({ workerId: null, token: null });
    setActiveCompetencyId('B');
    setLogoutModalOpen(false);
    setWorkerSelectorResetKey(k => k + 1); // Forzar reset del modal
    // Limpiar banderas del modal de evaluación
    setShowRevisionModal(false);
    setModalJustClosed(false);
  };

  const handleFilesUploaded = (conductId: string, files: EvidenceFile[]) => {
    console.log('Archivos subidos para conducta:', conductId, files);
  };

  const handleFileDeleted = (conductId: string, fileId: number) => {
    console.log('Archivo eliminado de conducta:', conductId, fileId);
  };

  // Encuentra el trabajador actual
  const currentWorker = evaluation.workers.find(w => w.id === evaluation.workerId);

  const visibleCompetencies = useMemo(() => {
    console.log('Calculando competencias visibles:', {
      currentWorker,
      workerGroup: currentWorker?.worker_group,
      evaluationWorkerId: evaluation.workerId,
      workersLength: evaluation.workers.length
    });
    const competencies = getVisibleCompetenciesFromHook(currentWorker?.worker_group ?? null);
    console.log('Competencias visibles resultantes:', competencies);
    return competencies;
  }, [evaluation.workerId, evaluation.workers]);
  
  const activeCompetency = useMemo(() => {
    console.log('Calculando competencia activa:', {
      activeCompetencyId,
      activePage,
      visibleCompetencies: visibleCompetencies.map(c => c.id),
      found: visibleCompetencies.find(c => c.id === activeCompetencyId)
    });
    
    // Si estamos en una página especial, no buscar competencias
    if (activePage === 'settings' || activePage === 'summary' || activePage === 'manage-users' || activePage === 'evaluation-manager') {
      console.log('En página especial, no estableciendo competencia activa');
      return undefined;
    }
    
    // Si no hay competencia activa válida y hay competencias visibles, usar la primera
    const found = visibleCompetencies.find(c => c.id === activeCompetencyId);
    if (!found && visibleCompetencies.length > 0 && evaluation.workerId && !loadingSession && activePage === 'competency') {
      console.log('No se encontró competencia activa, usando la primera:', visibleCompetencies[0].id);
      // Usar setTimeout para evitar actualizaciones durante el render
      setTimeout(() => {
        setActiveCompetencyId(visibleCompetencies[0].id);
      }, 0);
      return visibleCompetencies[0];
    }
    
    return found;
  }, [activeCompetencyId, activePage, visibleCompetencies, evaluation.workerId, loadingSession]);

  // Cambiar periodo y recargar evaluación
  const handlePeriodChange = async (newPeriod: string) => {
    if (evaluation.workerId) {
      await useEvaluationStateProps.setWorkerId(evaluation.workerId, newPeriod);
    }
  };

  // Función local para cambiar periodo
  const setPeriod = async (period: string) => {
    if (evaluation.workerId) {
      await useEvaluationStateProps.setWorkerId(evaluation.workerId, period);
    }
  };

  React.useEffect(() => {
    const handler = () => setManageUsersModalOpen(true);
    window.addEventListener('open-manage-users', handler);
    return () => window.removeEventListener('open-manage-users', handler);
  }, []);

  // Persistencia de sesión y timeout global
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let timeoutMinutes = 60;
    let isLoggingOut = false;

    const logoutByTimeout = () => {
      if (isLoggingOut) return; // Evitar múltiples logout
      isLoggingOut = true;
      
      localStorage.removeItem('sessionToken');
      clearUserEvaluation(); // Limpiar la evaluación guardada
      useEvaluationStateProps.setWorkerSession({ workerId: null, token: null });
      setActiveCompetencyId('B');
      
      // Mostrar mensaje más elegante en lugar de alert
      const messageDiv = document.createElement('div');
      messageDiv.className = 'fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white bg-red-600 animate-fade-in-up';
      messageDiv.textContent = 'Sesión cerrada por inactividad';
      document.body.appendChild(messageDiv);
      
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 3000);
    };

    const updateActivity = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logoutByTimeout();
      }, timeoutMinutes * 60 * 1000);
    };

    // Al autenticar, guardar token y usuario
    if (evaluation.workerId && evaluation.token) {
      localStorage.setItem('sessionToken', evaluation.token);
      updateActivity();
      setLoadingSession(false);
    }

    // Restaurar sesión por token
    const restoreSession = async () => {
      if (sessionRestored) {
        console.log('Sesión ya restaurada, saltando...');
        setLoadingSession(false);
        return;
      }
      
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        setLoadingSession(false);
        setSessionRestored(true);
        return;
      }
      try {
        const res = await fetch('/api/session/validate', {
          headers: { Authorization: token }
        });
        if (!res.ok) throw new Error('Sesión inválida');
        const data = await res.json();
        
        // Establecer la sesión del trabajador inmediatamente
        useEvaluationStateProps.setWorkerSession({ workerId: data.id, token });
        
        // Cargar el histórico de evaluaciones primero
        await useEvaluationStateProps.loadWorkerEvaluations(data.id);
        
        // Intentar restaurar la evaluación específica del usuario
        const savedEvaluation = getUserEvaluation();
        let evaluationLoaded = false;
        
        if (savedEvaluation && savedEvaluation.workerId === data.id) {
          // Intentar cargar la evaluación específica guardada
          try {
            console.log('Intentando cargar evaluación guardada:', savedEvaluation);
            await useEvaluationStateProps.setWorkerId(data.id, savedEvaluation.period);
            evaluationLoaded = true;
            console.log('Evaluación guardada cargada exitosamente');
          } catch (error: any) {
            console.log('No se pudo cargar la evaluación guardada:', error.message);
            // Continuar con la lógica de fallback
          }
        }
        
        if (!evaluationLoaded) {
          // Intentar cargar la evaluación más reciente del trabajador
          try {
            // Obtener las evaluaciones del trabajador para determinar qué periodo cargar
            const workerEvaluations = await apiService.getEvaluationsByWorker(data.id);
            console.log('Evaluaciones encontradas en restoreSession:', workerEvaluations);
            
            if (workerEvaluations && workerEvaluations.length > 0) {
              // Usar la evaluación más reciente (primera en la lista)
              const latestEvaluation = workerEvaluations[0];
              console.log('Cargando evaluación más reciente:', latestEvaluation);
              await useEvaluationStateProps.setWorkerId(data.id, latestEvaluation.period);
              
              // Guardar esta evaluación como la del usuario
              saveUserEvaluation(data.id, latestEvaluation.period, latestEvaluation.id);
              console.log('Evaluación más reciente cargada exitosamente');
            } else {
              // No hay evaluaciones, mostrar modal de selección para crear nueva
              console.log('No hay evaluaciones previas, mostrando modal de selección');
              if (!modalJustClosed) {
                setPendingWorkerId(data.id);
                setPendingToken(token);
                setShowRevisionModal(true);
              }
            }
          } catch (error: any) {
            console.log('Error en restoreSession:', error);
            if (error.message === 'NO_EVALUATION_FOUND') {
              // No hay evaluación para este trabajador/periodo, mostrar modal de selección de evaluación
              console.log('No se encontró evaluación, mostrando modal de selección');
              if (!modalJustClosed) {
                setPendingWorkerId(data.id);
                setPendingToken(token);
                setShowRevisionModal(true);
              }
            } else {
              // Para otros errores, también mostrar el modal para dar opción al usuario
              console.log('Error inesperado, mostrando modal de selección como fallback');
              if (!modalJustClosed) {
                setPendingWorkerId(data.id);
                setPendingToken(token);
                setShowRevisionModal(true);
              }
            }
          }
        }
        
        // Obtener timeout global
        try {
          const resTimeout = await fetch('/api/settings/session-timeout');
          const dataTimeout = await resTimeout.json();
          timeoutMinutes = dataTimeout.timeout || 60;
        } catch {}
        updateActivity();
        setSessionRestored(true);
      } catch {
        localStorage.removeItem('sessionToken');
        useEvaluationStateProps.setWorkerSession({ workerId: null, token: null });
        setActiveCompetencyId('B');
        setSessionRestored(true);
      }
      setLoadingSession(false);
    };
    restoreSession();

    // Escuchar actividad del usuario
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, updateActivity));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(ev => window.removeEventListener(ev, updateActivity));
    };
    // eslint-disable-next-line
  }, []); // Solo ejecutar una vez al montar el componente

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Detecta si estamos en Electron
  const isElectron = Boolean((window as any).electronAPI);

  // Función para abrir el modal de exportación
  const handleExportDB = () => {
    setIsExportModalOpen(true);
  };

  // Exportar como JSON
  const handleExportJSON = async () => {
    if (dbLoading) return;
    setDbMessage(null);
    setDbLoading(true);
    try {
      const dataStr = JSON.stringify(evaluation, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluacion-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDbMessage('Backup JSON exportado correctamente.');
      setIsExportModalOpen(false);
    } catch (err) {
      setDbMessage('Error al exportar el backup JSON.');
    } finally {
      setDbLoading(false);
    }
  };

  // Exportar como SQLite
  const handleExportSQLite = async () => {
    if (dbLoading) return;
    setDbMessage(null);
    setDbLoading(true);
    try {
      if (isElectron) {
        await (window as any).electronAPI.exportSQLite();
        setDbMessage('Base de datos SQLite exportada correctamente.');
      } else {
        const response = await fetch('/api/export-db');
        if (!response.ok) throw new Error('No se pudo exportar la base de datos');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evaluacion.sqlite`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDbMessage('Base de datos SQLite exportada correctamente.');
      }
      setIsExportModalOpen(false);
    } catch (err) {
      setDbMessage('Error al exportar la base de datos SQLite.');
    } finally {
      setDbLoading(false);
    }
  };

  // Exportar como ZIP completo
  const handleExportZIP = async () => {
    if (dbLoading) return;
    setDbMessage(null);
    setDbLoading(true);
    try {
      const response = await fetch('/api/export-zip');
      if (!response.ok) throw new Error('No se pudo exportar el ZIP completo');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluacion-completa-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDbMessage('ZIP completo exportado correctamente.');
      setIsExportModalOpen(false);
    } catch (err) {
      setDbMessage('Error al exportar el ZIP completo.');
    } finally {
      setDbLoading(false);
    }
  };

  // Importar BD: lee un archivo JSON o SQLite y lo carga en el estado o reemplaza la BD
  const handleImportDB = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (dbLoading) return;
    setDbMessage(null);
    const file = event.target.files?.[0];
    if (!file) return;
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    // Detectar tipo de archivo por extensión
    if (ext === 'json') {
      if (!window.confirm('¿Seguro que quieres importar este backup JSON? Se sobrescribirá el estado actual.')) {
        event.target.value = '';
        return;
      }
      setDbLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (json && typeof json === 'object' && 'workerId' in json && 'scores' in json) {
            useEvaluationStateProps.setEvaluation(json);
            setDbMessage('Backup JSON importado correctamente.');
          } else {
            setDbMessage('El archivo no tiene el formato esperado.');
          }
        } catch {
          setDbMessage('Error al leer el archivo JSON.');
        } finally {
          setDbLoading(false);
        }
      };
      reader.readAsText(file);
    } else if (ext === 'sqlite' || ext === 'db') {
      if (!window.confirm('¿Seguro que quieres importar esta base de datos SQLite? Se sobrescribirá la base de datos actual.')) {
        event.target.value = '';
        return;
      }
      setDbLoading(true);
      try {
        if (isElectron) {
          await (window as any).electronAPI.importSQLite(file.path || file.name);
          setDbMessage('Base de datos SQLite importada correctamente. La aplicación se recargará.');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/import-db', { method: 'POST', body: formData });
          if (!response.ok) throw new Error('No se pudo importar la base de datos');
          setDbMessage('Base de datos SQLite importada correctamente. La aplicación se recargará.');
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) {
        setDbMessage('Error al importar la base de datos SQLite.');
      } finally {
        setDbLoading(false);
      }
    } else if (ext === 'zip') {
      if (!window.confirm('¿Seguro que quieres importar este ZIP completo? Se sobrescribirá la base de datos y archivos actuales.')) {
        event.target.value = '';
        return;
      }
      setDbLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/import-zip', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('No se pudo importar el ZIP');
        setDbMessage('ZIP completo importado correctamente. La aplicación se recargará.');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setDbMessage('Error al importar el ZIP completo.');
      } finally {
        setDbLoading(false);
      }
    } else {
      setDbMessage('Formato de archivo no soportado. Usa .json, .sqlite, .db o .zip');
    }
    event.target.value = '';
  };

  const closeSidebar = () => {
    setSidebarClosing(true);
    setTimeout(() => {
      setSidebarOpen(false);
      setSidebarClosing(false);
    }, 220); // Duración de la animación
  };

  const handleSidebarChange = (id: string) => {
    if (isSidebarOpen) closeSidebar();
    if (id === 'settings') {
      setActivePage('settings');
      setActiveCompetencyId('settings');
    } else if (id === 'summary') {
      setActivePage('summary');
      setActiveCompetencyId('summary');
    } else if (id === 'manage-users') {
      setActivePage('manage-users');
      setActiveCompetencyId('manage-users');
    } else if (id === 'evaluation-manager') {
      setActivePage('evaluation-manager');
      setActiveCompetencyId('evaluation-manager');
    } else {
      setActivePage('competency');
      setActiveCompetencyId(id);
    }
  };

  // Función para actualizar el timeout de sesión
  const handleSessionTimeoutChange = async (timeout: number) => {
    try {
      const response = await fetch('/api/settings/session-timeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeout })
      });
      if (response.ok) {
        setSessionTimeout(timeout);
      }
    } catch (error) {
      console.error('Error al actualizar timeout:', error);
    }
  };



  // Wrapper para eliminar archivos desde la página de resumen
  const handleRemoveFileFromSummary = (conductId: string, fileId: number | string) => {
    useEvaluationStateProps.removeFile('', conductId, fileId.toString());
  };

  // Handler para seleccionar una evaluación concreta
  const handleSelectVersion = async (period: string, version: number) => {
    // Buscar la evaluación con ese periodo y versión
    const ev = evaluation.workerEvaluations.find(e => e.period === period && e.version === version);
    if (ev) {
      try {
        await useEvaluationStateProps.loadEvaluationById(ev.id);
        console.log('Evaluación cargada correctamente:', { id: ev.id, period, version });
      } catch (error) {
        console.error('Error al cargar la evaluación:', error);
      }
    } else {
      console.error('No se encontró la evaluación:', { period, version, availableEvaluations: evaluation.workerEvaluations });
    }
  };

  // Handler para crear nueva evaluación
  const handleNewVersion = async (period: string) => {
    if (!evaluation.workerId) return;
    // Crear nueva evaluación
    const res = await fetch('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId: evaluation.workerId, period })
    });
    if (res.ok) {
      const data = await res.json();
      await useEvaluationStateProps.setWorkerId(evaluation.workerId, period); // Cargar la nueva evaluación
      setPeriod(period);
      useEvaluationStateProps.loadWorkerEvaluations(evaluation.workerId);
    }
  };

  // Guardar en localStorage cada vez que cambian
  useEffect(() => {
    localStorage.setItem('activePage', activePage);
  }, [activePage]);

  useEffect(() => {
    localStorage.setItem('activeCompetencyId', activeCompetencyId);
  }, [activeCompetencyId]);

  // --- MODIFICAR FLUJO DE LOGIN ---
  const handleLoginSuccess = async (workerId: string, token: string) => {
    console.log('Login exitoso, estableciendo sesión y cargando evaluaciones del trabajador:', workerId);
    useEvaluationStateProps.setWorkerSession({ workerId, token });
    try {
      console.log('Cargando evaluaciones del trabajador...');
      await useEvaluationStateProps.loadWorkerEvaluations(workerId);
      
      // Mostrar modal si no hay evaluación cargada y no se acaba de cerrar
      if (!evaluation.evaluationId && !modalJustClosed) {
        setPendingWorkerId(workerId);
        setPendingToken(token);
        setShowRevisionModal(true);
      }
    } catch (error) {
      console.error('Error al cargar evaluaciones desde login:', error);
      // Mostrar modal en caso de error también
      if (!modalJustClosed) {
        setPendingWorkerId(workerId);
        setPendingToken(token);
        setShowRevisionModal(true);
      }
    }
  };

  // --- HANDLERS PARA EL MODAL DE EVALUACIÓN ---
  const handleContinue = async (evaluation: Evaluation) => {
    console.log('Continuando con evaluación:', evaluation);
    setIsProcessingEvaluation(true);
    try {
      await useEvaluationStateProps.loadEvaluationById(evaluation.id);
      saveUserEvaluation(evaluation.worker_id, evaluation.period, evaluation.id);
      setShowRevisionModal(false);
      setModalJustClosed(true); // Bloquear reapertura inmediata
      setTimeout(() => setModalJustClosed(false), 500); // Permitir futuras aperturas tras 500ms
      console.log('Evaluación continuada exitosamente');
    } catch (error) {
      console.error('Error al continuar evaluación:', error);
    } finally {
      setIsProcessingEvaluation(false);
    }
  };

  const handleSelect = async (selectedEval: Evaluation) => {
    console.log('🔄 handleSelect - Iniciando selección de evaluación:', selectedEval);
    setIsProcessingEvaluation(true);
    try {
      await useEvaluationStateProps.loadEvaluationById(selectedEval.id);
      setTimeout(() => {
        saveUserEvaluation(selectedEval.worker_id, selectedEval.period, selectedEval.id);
        setShowRevisionModal(false);
        setModalJustClosed(true); // Bloquear reapertura inmediata
        setTimeout(() => setModalJustClosed(false), 500);
        console.log('✅ Evaluación seleccionada y cargada exitosamente');
      }, 200);
    } catch (error) {
      console.error('❌ Error al seleccionar evaluación:', error);
    } finally {
      setIsProcessingEvaluation(false);
    }
  };

  // Generar periodos bienales posibles (igual que en Header)
  const generateBiennialPeriods = (startYear: number, count: number): string[] => {
    const periods: string[] = [];
    let currentStartYear = startYear;
    for (let i = 0; i < count; i++) {
      periods.push(`${currentStartYear}-${currentStartYear + 1}`);
      currentStartYear += 2;
    }
    return periods;
  };

  const biennialPeriods = generateBiennialPeriods(2023, 10);

  // Nuevo handler: recibe el periodo seleccionado
  const handleNew = async (period: string) => {
    if (!pendingWorkerId) return;
    console.log('Creando nueva evaluación para trabajador:', pendingWorkerId, 'y periodo:', period);
    setIsProcessingEvaluation(true);
    setShowRevisionModal(false);
    try {
      // Inicializar estado de evaluación nueva sin cargar desde el backend
      const initialState = getInitialState(globalT1SevenPoints);
      const newState = {
        ...initialState,
        workerId: pendingWorkerId,
        period: period,
        evaluationId: null,
        isNewEvaluation: true,
        lastSavedAt: null,
        lastSavedAtFull: null,
        version: null,
        // Mantener la lista de trabajadores existente
        workers: evaluation.workers,
        workerEvaluations: evaluation.workerEvaluations,
        // Inicializar criterios por defecto para todas las conductas
        criteriaChecks: {},
        scores: {},
        realEvidences: {},
        files: {},
        openAccordions: {}
      };
      
      // Inicializar criterios para todas las conductas según el grupo del trabajador
      const worker = evaluation.workers.find(w => w.id === pendingWorkerId);
      if (worker) {
        const visibleCompetencies = getVisibleCompetenciesFromHook(worker.worker_group);
        for (const competency of visibleCompetencies) {
          for (const conduct of competency.conducts) {
            (newState.criteriaChecks as any)[conduct.id] = {
              t1: globalT1SevenPoints ? [true, true, true, false] : Array(6).fill(true),
              t2: Array(4).fill(false),
            };
            (newState.scores as any)[conduct.id] = {
              t1: globalT1SevenPoints ? 3 : 6,
              t2: 0,
              final: globalT1SevenPoints ? 3 : 6,
            };
          }
        }
      }
      
      useEvaluationStateProps.setEvaluation(newState);
      saveUserEvaluation(pendingWorkerId, period, null);
      
      // Establecer la página activa a competency (primera página de preguntas)
      setActivePage('competency');
      localStorage.setItem('activePage', 'competency');
      localStorage.setItem('activeCompetencyId', 'B');
      
      console.log('Evaluación nueva inicializada en frontend:', newState);
    } catch (error) {
      console.error('Error al preparar nueva evaluación:', error);
    } finally {
      setIsProcessingEvaluation(false);
    }
  };

  // Eliminar una o varias evaluaciones
  const handleDeleteEvaluations = async (ids: number[]) => {
    for (const id of ids) {
      await apiService.deleteEvaluation(id);
    }
    if (evaluation.workerId) await useEvaluationStateProps.loadWorkerEvaluations(evaluation.workerId);

    // Resetear si la evaluación activa fue borrada o si ya no hay evaluaciones
    const remaining = evaluation.workerEvaluations.filter(ev => !ids.includes(ev.id));
    if (
      (evaluation.evaluationId && ids.includes(evaluation.evaluationId)) ||
      remaining.length === 0
    ) {
      clearUserEvaluation();
      // Mantener el workerId y workers cuando se eliminan todas las evaluaciones
      const currentWorkerId = evaluation.workerId;
      const currentWorkers = evaluation.workers;
      const initialState = getInitialState(globalT1SevenPoints);
      useEvaluationStateProps.setEvaluation({
        ...initialState,
        workerId: currentWorkerId,
        workers: currentWorkers
      });
      
      // Si se eliminaron todas las evaluaciones, mostrar el modal para crear una nueva
      if (remaining.length === 0) {
        setShowRevisionModal(true);
        setPendingWorkerId(currentWorkerId);
      } else {
        // Si estamos en la página de gestión, no redirigir; solo limpiar el estado.
        if (activePage !== 'evaluation-manager') {
          setActivePage('competency');
        }
      }
    }
  };

  // Eliminar todas las evaluaciones
  const handleDeleteAllEvaluations = async () => {
    if (evaluation.workerEvaluations.length > 0) {
      for (const ev of evaluation.workerEvaluations) {
        await apiService.deleteEvaluation(ev.id);
      }
      if (evaluation.workerId) await useEvaluationStateProps.loadWorkerEvaluations(evaluation.workerId);
      
      // Mantener el workerId y workers cuando se eliminan todas las evaluaciones
      const currentWorkerId = evaluation.workerId;
      const currentWorkers = evaluation.workers;
      const initialState = getInitialState(globalT1SevenPoints);
      useEvaluationStateProps.setEvaluation({
        ...initialState,
        workerId: currentWorkerId,
        workers: currentWorkers
      });
      
      // Mostrar el modal para crear una nueva evaluación
      setShowRevisionModal(true);
      setPendingWorkerId(currentWorkerId);
    }
  };

  const handleOpenEvaluation = async (evaluationId: number) => {
    try {
      console.log('🔍 handleOpenEvaluation - Iniciando:', evaluationId);
      console.log('🔍 Estado antes de cargar:', { workerId: evaluation.workerId, period: evaluation.period, evaluationId: evaluation.evaluationId });
      
      await useEvaluationStateProps.loadEvaluationById(evaluationId);
      
      console.log('🔍 loadEvaluationById completado');
      console.log('🔍 Estado después de cargar:', { workerId: evaluation.workerId, period: evaluation.period, evaluationId: evaluation.evaluationId });
      
      // Esperar un poco para que el estado se actualice
      setTimeout(() => {
        console.log('🔍 setTimeout ejecutado');
        console.log('🔍 Estado en setTimeout:', { workerId: evaluation.workerId, period: evaluation.period, evaluationId: evaluation.evaluationId });
        
        // Guardar la evaluación abierta después de que se haya cargado
        if (evaluation.workerId && evaluation.period) {
          saveUserEvaluation(evaluation.workerId, evaluation.period, evaluationId);
          console.log('✅ Evaluación guardada en localStorage:', { workerId: evaluation.workerId, period: evaluation.period, evaluationId });
        } else {
          console.log('❌ No se pudo guardar - datos faltantes:', { workerId: evaluation.workerId, period: evaluation.period });
        }
        setActivePage('competency');
      }, 100);
    } catch (error) {
      console.error('❌ Error al abrir evaluación:', error);
    }
  };

  const [nextEvaluationIsNew, setNextEvaluationIsNew] = useState(false);

  // Modificar handleCreateNewEvaluation para marcar el flag
  const handleCreateNewEvaluation = async () => {
    if (evaluation.workerId && evaluation.period) {
      setNextEvaluationIsNew(true);
      await handleNewVersion(evaluation.period);
      setActivePage('competency');
      localStorage.setItem('activePage', 'competency');
      localStorage.setItem('activeCompetencyId', 'B');
    }
  };

  // Efecto para colapsar todos los accordions si la evaluación es nueva
  useEffect(() => {
    if (nextEvaluationIsNew && evaluation && evaluation.evaluationId) {
      // Colapsar todos los accordions
      if (evaluation.openAccordions && Object.keys(evaluation.openAccordions).length > 0) {
        // Si ya hay estado, lo reseteamos
        evaluation.openAccordions = {};
      }
      // Forzar re-render
      useEvaluationStateProps.setWorkerId(evaluation.workerId, evaluation.period);
      setNextEvaluationIsNew(false);
    }
  }, [nextEvaluationIsNew, evaluation, useEvaluationStateProps.setWorkerId]);

  const [isVersionManagerOpen, setVersionManagerOpen] = useState(false);

  // Funciones para guardar y restaurar la evaluación específica del usuario
  const saveUserEvaluation = (workerId: string, period: string, evaluationId: number | null) => {
    localStorage.setItem('userEvaluation', JSON.stringify({ workerId, period, evaluationId }));
  };

  const getUserEvaluation = () => {
    const saved = localStorage.getItem('userEvaluation');
    return saved ? JSON.parse(saved) : null;
  };

  const clearUserEvaluation = () => {
    localStorage.removeItem('userEvaluation');
  };

  // Al cambiar la configuración global desde SettingsPage
  const handleGlobalT1SevenPointsChange = async (value: boolean) => {
    setGlobalT1SevenPoints(value);
    try {
      await apiService.setGlobalEvaluationSettings({ useT1SevenPoints: value });
    } catch {}
  };

  const handleOpenRevisionModal = () => {
    setShowRevisionModal(true);
    setPendingWorkerId(evaluation.workerId); // workerId actual
  };

  // Efecto para mostrar automáticamente el modal cuando no hay evaluación cargada
  useEffect(() => {
    // Solo mostrar si hay un trabajador, no hay evaluación cargada, hay evaluaciones disponibles, y no se acaba de cerrar
    if (evaluation.workerId && 
        !evaluation.evaluationId && 
        evaluation.workerEvaluations.length > 0 && 
        !modalJustClosed && 
        !showRevisionModal) {
      console.log('Mostrando modal automáticamente - no hay evaluación cargada');
      setPendingWorkerId(evaluation.workerId);
      setShowRevisionModal(true);
    }
  }, [evaluation.workerId, evaluation.evaluationId, evaluation.workerEvaluations.length, modalJustClosed, showRevisionModal]);

  // Efecto para cerrar automáticamente el modal cuando se cargue una evaluación
  useEffect(() => {
    if (evaluation.evaluationId && showRevisionModal) {
      console.log('Evaluación cargada, cerrando modal automáticamente');
      setShowRevisionModal(false);
    }
  }, [evaluation.evaluationId, showRevisionModal]);

  // Log para depurar el estado del modal
  useEffect(() => {
    console.log('Estado del modal de revisión:', {
      showRevisionModal,
      pendingWorkerId,
      workerEvaluationsLength: evaluation.workerEvaluations.length,
      evaluationId: evaluation.evaluationId,
      workerId: evaluation.workerId,
      isProcessingEvaluation,
      modalJustClosed
    });
  }, [showRevisionModal, pendingWorkerId, evaluation.workerEvaluations.length, evaluation.evaluationId, evaluation.workerId, isProcessingEvaluation, modalJustClosed]);

  if (loadingSession) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100 z-50">
        <div className="text-lg text-gray-600 animate-pulse">Cargando sesión...</div>
      </div>
    );
  }

  return (
    <>
      {/* Pantalla de login centrada, fuera del dashboard */}
      {!evaluation.workerId && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-100 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center w-full max-w-md">
            <div className="flex justify-center items-center gap-6 mb-6">
              <img src="/logos/logo_uco-3.png" alt="Logo UCO" className="h-14 w-auto" />
              <img src="/logos/logo_scai.png" alt="Logo SCAI" className="h-14 w-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Bienvenido/a al Sistema de Evaluación del Desempeño</h2>
            <p className="text-gray-600 mb-8 text-center">Para comenzar, seleccione un trabajador existente o añada uno nuevo.</p>
            <div className="flex flex-col gap-4 w-full">
              <button
                onClick={() => setIsWorkerSelectorOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Seleccionar Trabajador
              </button>
              <button
                onClick={() => {
                  setAddWorkerModalKey(k => k + 1);
                  setAddWorkerModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 mt-2 mb-2 rounded-2xl shadow-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-lg font-semibold hover:scale-105 hover:shadow-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
              >
                <UserPlusIcon className="h-8 w-8 mr-2 text-white drop-shadow-lg" />
                Añadir Nuevo Trabajador
              </button>
              <p className="text-center text-sm text-gray-500 mt-2 mb-4">
                ¿Es tu primera vez? Crea un trabajador para empezar a usar la aplicación.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Dashboard layout solo si hay trabajador */}
      {evaluation.workerId && (
        <div className="min-h-screen bg-gray-100 flex flex-col w-full overflow-x-hidden">
          {/* Header fijo */}
          <Header
            workers={evaluation.workers}
            selectedWorkerId={evaluation.workerId}
            onWorkerChange={handleWorkerChange}
            onChangeWorkerClick={() => {
          console.log('Abriendo modal de selección de trabajador');
          setIsWorkerSelectorLoading(true);
          setIsWorkerSelectorOpen(true);
          // Simular un pequeño delay para mostrar el spinner
          setTimeout(() => {
            setIsWorkerSelectorLoading(false);
          }, 500);
        }}
            period={evaluation.period}
            onPeriodChange={handlePeriodChange}
            onAddWorkerClick={() => {
              setAddWorkerModalKey(k => k + 1);
              setAddWorkerModalOpen(true);
            }}
            onExitApp={() => setLogoutModalOpen(true)}
            useT1SevenPoints={evaluation.useT1SevenPoints}
            onT1SevenPointsChange={useEvaluationStateProps.setUseT1SevenPoints}
            isSaving={evaluation.isSaving}
            lastSavedAt={evaluation.lastSavedAt}
            lastSavedAtFull={evaluation.lastSavedAtFull}
            version={evaluation.version}
            isNewEvaluation={evaluation.isNewEvaluation}
            onHamburgerClick={() => setSidebarOpen(true)}
            workerEvaluations={evaluation.workerEvaluations}
            onSelectVersion={handleSelectVersion}
            onNewVersion={handleCreateNewEvaluation}
            isLoading={useEvaluationStateProps.isLoading}
          />
          
          {/* Log para depurar el estado de evaluación nueva */}
          {(() => {
            console.log('Header - Estado de evaluación nueva:', {
              isNewEvaluation: evaluation.isNewEvaluation,
              lastSavedAt: evaluation.lastSavedAt,
              lastSavedAtFull: evaluation.lastSavedAtFull,
              version: evaluation.version
            });
            return null;
          })()}

          {/* Sidebar móvil */}
          {isSidebarOpen && (
            <>
              <div className="fixed inset-0 z-50 bg-black bg-opacity-40" onClick={closeSidebar} />
              <aside className={`fixed top-0 left-0 z-50 w-64 h-full bg-white shadow-xl flex flex-col ${isSidebarClosing ? 'animate-slideOutFade' : 'animate-slideIn'}`}>
                <button
                  className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-200"
                  onClick={closeSidebar}
                  aria-label="Cerrar menú"
                >
                  <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <Sidebar
                  competencies={visibleCompetencies}
                  activeCompetencyId={activePage === 'settings' ? 'settings' : activePage === 'summary' ? 'summary' : activePage === 'manage-users' ? 'manage-users' : activePage === 'evaluation-manager' ? 'evaluation-manager' : activeCompetencyId}
                  onCompetencyChange={handleSidebarChange}
                  fixedDesktop={false}
                  onOpenSettings={() => { setManageUsersModalOpen(true); closeSidebar(); }}
                  onOpenEvaluationManager={() => { setActivePage('evaluation-manager'); closeSidebar(); }}
                  onSetActivePage={(page) => { setActivePage(page); closeSidebar(); }}
                  activePage={activePage}
                  className="block lg:hidden h-full overflow-y-auto pt-16"
                  handleExportDB={handleExportDB}
                  handleImportDB={handleImportDB}
                  fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                  dbLoading={dbLoading}
                  dbMessage={dbMessage}
                />
              </aside>
              <style>{`
                @keyframes slideIn { from { transform: translateX(-100%); opacity: 0.7; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideOutFade { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-100%); opacity: 0; } }
                .animate-slideIn { animation: slideIn 0.22s cubic-bezier(0.4,0,0.2,1); }
                .animate-slideOutFade { animation: slideOutFade 0.22s cubic-bezier(0.4,0,0.2,1); }
              `}</style>
            </>
          )}
          {/* Layout principal responsive: apilado en móvil, columnas en desktop */}
          <div className="flex flex-col lg:flex-row flex-1 w-full">
            {/* Sidebar fijo desktop */}
            <Sidebar
              competencies={visibleCompetencies}
              activeCompetencyId={activePage === 'settings' ? 'settings' : activePage === 'summary' ? 'summary' : activePage === 'manage-users' ? 'manage-users' : activePage === 'evaluation-manager' ? 'evaluation-manager' : activeCompetencyId}
              onCompetencyChange={handleSidebarChange}
              fixedDesktop={true}
              onOpenSettings={() => setManageUsersModalOpen(true)}
              onOpenVersionManager={() => setVersionManagerOpen(true)}
              onOpenEvaluationManager={() => setActivePage('evaluation-manager')}
              onSetActivePage={setActivePage}
              activePage={activePage}
              className="hidden lg:block lg:fixed lg:left-0 lg:top-[96px] lg:bottom-0 lg:w-80 lg:h-auto lg:z-30"
              handleExportDB={handleExportDB}
              handleImportDB={handleImportDB}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              dbLoading={dbLoading}
              dbMessage={dbMessage}
            />
            {/* Panel principal scrollable, padding-top según header */}
            <main className="flex-1 min-h-0 flex flex-col overflow-y-auto px-2 sm:px-6 lg:px-10 pb-24 pt-[120px] lg:pt-[96px] lg:ml-80">
              {activePage === 'evaluation-manager' ? (
                <div className="bg-white shadow-md rounded-xl p-6">
                  <EvaluationManagerPage
                    evaluations={evaluation.workerEvaluations}
                    onOpen={handleOpenEvaluation}
                    onDelete={handleDeleteEvaluations}
                    onDeleteAll={handleDeleteAllEvaluations}
                    onCreateNew={handleOpenRevisionModal}
                    onClose={() => setActivePage('competency')}
                    isLoading={useEvaluationStateProps.isLoading}
                  />
                </div>
              ) : activePage === 'settings' ? (
                <div className="bg-white shadow-md rounded-xl p-6">
                  <SettingsPage
                    sessionTimeout={sessionTimeout}
                    onSessionTimeoutChange={handleSessionTimeoutChange}
                    handleExportDB={handleExportDB}
                    handleImportDB={handleImportDB}
                    fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                    dbLoading={dbLoading}
                    dbMessage={dbMessage}
                    useT1SevenPoints={globalT1SevenPoints}
                    onT1SevenPointsChange={handleGlobalT1SevenPointsChange}
                    autoSave={evaluation.autoSave}
                    onAutoSaveChange={useEvaluationStateProps.setAutoSave}
                  />
                </div>
              ) : activePage === 'summary' ? (
                <div className="bg-white shadow-md rounded-xl p-6">
                  <SummaryPage 
                    evaluation={evaluation} 
                    onSave={useEvaluationStateProps.saveEvaluation} 
                    onRemoveFile={handleRemoveFileFromSummary}
                    onRemoveAllFilesFromConduct={useEvaluationStateProps.removeAllFilesFromConduct}
                  />
                </div>
              ) : activePage === 'manage-users' ? (
                <div className="bg-white shadow-md rounded-xl p-6">
                  <ManageUsersPanel currentWorker={currentWorker ?? null} />
                </div>
              ) : activeCompetency ? (
                <div className="bg-white shadow-md rounded-xl p-6">
                  <CompetencyBlock
                    competency={activeCompetency}
                    evaluation={evaluation}
                    onCriteriaChange={(conductId, tramo, index, isChecked) => useEvaluationStateProps.updateCriteriaCheck(conductId, tramo, index, isChecked)}
                    onEvidenceChange={useEvaluationStateProps.updateRealEvidence}
                    addFiles={useEvaluationStateProps.addFiles}
                    removeFile={useEvaluationStateProps.removeFile}
                    removeAllFilesFromConduct={useEvaluationStateProps.removeAllFilesFromConduct}
                    onToggleAccordion={useEvaluationStateProps.toggleAccordion}
                  />
                </div>
              ) : (
                <div className="bg-white shadow-md rounded-xl p-6 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                      Cargando competencias... 
                      <br />
                      <span className="text-xs text-gray-400">
                        Worker: {evaluation.workerId} | 
                        Active: {activeCompetencyId} | 
                        Page: {activePage} |
                        Visible: {visibleCompetencies.length}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </main>
          </div>
          {/* Footer fijo solo en escritorio, estático en móvil */}
          <footer className="w-full py-4 bg-gradient-to-r from-gray-50 to-indigo-50 border-t border-gray-200 text-center text-xs text-gray-500 shadow-inner lg:fixed lg:bottom-0 lg:left-0 lg:right-0 lg:z-40">
            © {new Date().getFullYear()} Desarrollado para el Servicio Central de Apoyo a la Investigación (SCAI) - Universidad de Córdoba. Todos los derechos reservados.
          </footer>
        </div>
      )}

      <AddWorkerModal
        key={addWorkerModalKey}
        isOpen={isAddWorkerModalOpen}
        onClose={() => setAddWorkerModalOpen(false)}
        onSave={handleAddWorker}
      />

      <WorkerSelectorModal
        key={`worker-selector-${workerSelectorResetKey}`}
        workers={evaluation.workers}
        isOpen={isWorkerSelectorOpen}
        onSelect={handleLoginSuccess}
        onClose={() => setIsWorkerSelectorOpen(false)}
        setWorkerSession={useEvaluationStateProps.setWorkerSession}
        isLoading={isWorkerSelectorLoading || loadingSession || !evaluation.workers.length}
        isWorkerSelectorLoading={isWorkerSelectorLoading}
      />

      <ManageUsersModal
        isOpen={isManageUsersModalOpen}
        onClose={() => setManageUsersModalOpen(false)}
        workers={evaluation.workers}
        onUpdateWorker={useEvaluationStateProps.updateWorker}
        isLoading={useEvaluationStateProps.isLoading}
      />

      <LogoutConfirmModal open={isLogoutModalOpen} onConfirm={confirmLogout} onCancel={() => setLogoutModalOpen(false)} />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportJSON={handleExportJSON}
        onExportSQLite={handleExportSQLite}
        onExportZIP={handleExportZIP}
        loading={dbLoading}
      />

      {dbMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded shadow-lg text-white bg-indigo-600 animate-fade-in-up">
          {dbMessage}
        </div>
      )}

      <RevisionSelectorModal
        isOpen={showRevisionModal}
        evaluations={evaluation.workerEvaluations}
        onContinue={handleContinue}
        onNew={handleNew}
        onSelect={handleSelect}
        onClose={() => {
          setShowRevisionModal(false);
        }}
        isLoading={useEvaluationStateProps.isLoadingEvaluations || isProcessingEvaluation}
        periods={biennialPeriods}
      />
      
      {/* Log para depurar el modal */}
      {console.log('Renderizando RevisionSelectorModal:', {
        showRevisionModal,
        workerEvaluationsLength: evaluation.workerEvaluations.length,
        isLoadingEvaluations: useEvaluationStateProps.isLoadingEvaluations,
        isProcessingEvaluation
      })}

      <VersionManagerModal
        isOpen={isVersionManagerOpen}
        onClose={() => setVersionManagerOpen(false)}
        evaluations={evaluation.workerEvaluations}
        onOpen={useEvaluationStateProps.loadEvaluationById}
        onDelete={handleDeleteEvaluations}
        onDeleteAll={handleDeleteAllEvaluations}
        onCreateNewVersion={() => {
          if (evaluation.workerId && evaluation.period) {
            handleNewVersion(evaluation.period);
            setVersionManagerOpen(false);
          }
        }}
        isLoading={useEvaluationStateProps.isLoading}
      />
    </>
  );
}

export default App;

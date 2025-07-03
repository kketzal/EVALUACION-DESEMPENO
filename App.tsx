import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { CompetencyBlock } from './components/CompetencyBlock';
import { useEvaluationState, getVisibleCompetencies } from './hooks/useEvaluationState';
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

function WorkerSelectorModal({ workers, isOpen, onSelect, onClose, setWorkerSession }: {
  workers: Worker[];
  isOpen: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
  setWorkerSession: (args: { workerId: string, token: string }) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      onSelect(selectedWorker.id);
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
            <input
              type="text"
              placeholder="Buscar trabajador/a..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-4 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {filtered.length === 0 && <div className="py-4 text-gray-500 text-center">No hay resultados</div>}
              {filtered.map((worker: Worker) => (
                <button
                  key={worker.id}
                  onClick={() => handleWorkerSelect(worker)}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded transition-colors flex items-center gap-2"
                >
                  <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <div>
                    <span className="truncate block">{worker.name}</span>
                    <span className="text-sm text-gray-500">{worker.worker_group}</span>
                  </div>
                </button>
              ))}
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
                  <div className="font-medium text-indigo-900">{selectedWorker.name}</div>
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
                <button
                  type="button"
                  tabIndex={-1}
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
  const {
    evaluation,
    isLoading,
    setWorkerId,
    setWorkerSession,
    setPeriod,
    updateCriteriaCheck,
    updateRealEvidence,
    addFiles,
    removeFile,
    saveEvaluation,
    addWorker,
    updateWorkerGroup,
    setUseT1SevenPoints,
    setAutoSave,
    toggleAccordion,
    updateWorker,
    getVisibleCompetencies,
    setEvaluation
  } = useEvaluationState();

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
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [dbLoading, setDbLoading] = React.useState(false);
  const [dbMessage, setDbMessage] = React.useState<string | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<number>(60);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [workerSelectorResetKey, setWorkerSelectorResetKey] = useState(0); // Para forzar reset del modal

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
        const visibleCompetencies = getVisibleCompetencies(worker.worker_group ?? null);
        console.log('Competencias visibles:', visibleCompetencies);
        
        // Si no hay competencia activa válida, establecer la primera
        if (visibleCompetencies.length > 0 && (!activeCompetencyId || activeCompetencyId === 'B' || !visibleCompetencies.find(c => c.id === activeCompetencyId))) {
          console.log('Estableciendo primera competencia:', visibleCompetencies[0].id);
          setActiveCompetencyId(visibleCompetencies[0].id);
          setActivePage('competency');
        }
      }
    }
  }, [evaluation.workerId, evaluation.workers, loadingSession, activeCompetencyId, activePage]);

  const handleWorkerChange = async (workerId: string) => {
    console.log('Seleccionando trabajador:', workerId);
    await setWorkerId(workerId);
    const worker = evaluation.workers.find(w => w.id === workerId);
    // Establecer la primera competencia visible como activa
    if (worker) {
      const visibleCompetencies = getVisibleCompetencies(worker.worker_group ?? null);
      if (visibleCompetencies.length > 0) {
        setActiveCompetencyId(visibleCompetencies[0].id);
      }
    }
    setIsWorkerSelectorOpen(false);
  };

  const handleAddWorker = async (name: string, group: 'GRUPO 1-2' | 'GRUPO 3-4', password: string) => {
    const newWorkerId = await addWorker(name, group, password);
    setAddWorkerModalOpen(false);
    if (newWorkerId) {
      await setWorkerId(newWorkerId);
      // Selecciona la primera competencia visible
      const worker = evaluation.workers.find(w => w.id === newWorkerId);
      const visibleCompetencies = getVisibleCompetencies(worker?.worker_group ?? null);
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
    setWorkerSession({ workerId: null, token: null });
    setActiveCompetencyId('B');
    setLogoutModalOpen(false);
    setWorkerSelectorResetKey(k => k + 1); // Forzar reset del modal
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
    const competencies = getVisibleCompetencies(currentWorker?.worker_group ?? null);
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
    if (activePage === 'settings' || activePage === 'summary' || activePage === 'manage-users') {
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
        setActivePage('competency');
      }, 0);
      return visibleCompetencies[0];
    }
    
    return found;
  }, [activeCompetencyId, activePage, visibleCompetencies, evaluation.workerId, loadingSession]);

  // Cambiar periodo y recargar evaluación
  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    if (evaluation.workerId) {
      await setWorkerId(evaluation.workerId, newPeriod);
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
      setWorkerSession({ workerId: null, token: null });
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
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        setLoadingSession(false);
        return;
      }
      try {
        const res = await fetch('/api/session/validate', {
          headers: { Authorization: token }
        });
        if (!res.ok) throw new Error('Sesión inválida');
        const data = await res.json();
        setWorkerSession({ workerId: data.id, token });
        // Cargar los datos de la evaluación después de restaurar la sesión
        await setWorkerId(data.id);
        // Obtener timeout global
        try {
          const resTimeout = await fetch('/api/settings/session-timeout');
          const dataTimeout = await resTimeout.json();
          timeoutMinutes = dataTimeout.timeout || 60;
        } catch {}
        updateActivity();
      } catch {
        localStorage.removeItem('sessionToken');
        setWorkerSession({ workerId: null, token: null });
        setActiveCompetencyId('B');
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
  }, [evaluation.workerId, evaluation.token]);

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
            setEvaluation(json);
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
    removeFile('', conductId, fileId.toString());
  };

  // Guardar en localStorage cada vez que cambian
  useEffect(() => {
    localStorage.setItem('activePage', activePage);
  }, [activePage]);

  useEffect(() => {
    localStorage.setItem('activeCompetencyId', activeCompetencyId);
  }, [activeCompetencyId]);

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
                onClick={() => setAddWorkerModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <UserPlusIcon className="h-5 w-5 mr-2 text-gray-500" />
                Añadir Nuevo Trabajador
              </button>
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
            onChangeWorkerClick={() => setIsWorkerSelectorOpen(true)}
            period={evaluation.period}
            onPeriodChange={handlePeriodChange}
            onAddWorkerClick={() => setAddWorkerModalOpen(true)}
            onExitApp={handleExitApp}
            useT1SevenPoints={evaluation.useT1SevenPoints}
            onT1SevenPointsChange={setUseT1SevenPoints}
            isSaving={evaluation.isSaving}
            lastSavedAt={evaluation.lastSavedAt}
            onHamburgerClick={() => setSidebarOpen(true)}
          />
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
                  activeCompetencyId={activePage === 'settings' ? 'settings' : activePage === 'summary' ? 'summary' : activePage === 'manage-users' ? 'manage-users' : activeCompetencyId}
                  onCompetencyChange={handleSidebarChange}
                  fixedDesktop={false}
                  onOpenSettings={() => { setManageUsersModalOpen(true); closeSidebar(); }}
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
          <div className="flex flex-col lg:flex-row flex-1 w-full pt-[96px]">
            {/* Sidebar fijo desktop */}
            <Sidebar
              competencies={visibleCompetencies}
              activeCompetencyId={activePage === 'settings' ? 'settings' : activePage === 'summary' ? 'summary' : activePage === 'manage-users' ? 'manage-users' : activeCompetencyId}
              onCompetencyChange={handleSidebarChange}
              fixedDesktop={true}
              onOpenSettings={() => setManageUsersModalOpen(true)}
              className="hidden lg:block lg:fixed lg:left-0 lg:top-[64px] lg:bottom-[56px] lg:w-80 lg:h-auto lg:z-30"
              handleExportDB={handleExportDB}
              handleImportDB={handleImportDB}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              dbLoading={dbLoading}
              dbMessage={dbMessage}
            />
            {/* Main content */}
            <main className="flex-1 w-full pt-0 lg:pl-80 lg:pt-[96px] pb-56">
              {activePage === 'settings' ? (
                <div className="bg-white shadow-md rounded-xl p-6 lg:-mt-[96px]">
                  <SettingsPage
                    sessionTimeout={sessionTimeout}
                    onSessionTimeoutChange={handleSessionTimeoutChange}
                    handleExportDB={handleExportDB}
                    handleImportDB={handleImportDB}
                    fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                    dbLoading={dbLoading}
                    dbMessage={dbMessage}
                    useT1SevenPoints={evaluation.useT1SevenPoints}
                    onT1SevenPointsChange={setUseT1SevenPoints}
                    autoSave={evaluation.autoSave}
                    onAutoSaveChange={setAutoSave}
                  />
                </div>
              ) : activePage === 'summary' ? (
                <div className="bg-white shadow-md rounded-xl p-6 lg:-mt-[96px]">
                  <SummaryPage evaluation={evaluation} onSave={saveEvaluation} onRemoveFile={handleRemoveFileFromSummary} />
                </div>
              ) : activePage === 'manage-users' ? (
                <div className="bg-white shadow-md rounded-xl p-6 lg:-mt-[96px]">
                  <ManageUsersPanel currentWorker={currentWorker ?? null} />
                </div>
              ) : activeCompetency ? (
                <div className="bg-white shadow-md rounded-xl p-6 lg:-mt-[96px]">
                  <CompetencyBlock
                    competency={activeCompetency}
                    evaluation={evaluation}
                    onCriteriaChange={(conductId, tramo, index, isChecked) => updateCriteriaCheck(conductId, tramo, index, isChecked)}
                    onEvidenceChange={updateRealEvidence}
                    addFiles={addFiles}
                    removeFile={removeFile}
                    onToggleAccordion={toggleAccordion}
                  />
                </div>
              ) : (
                <div className="bg-white shadow-md rounded-xl p-6 lg:-mt-[96px] flex items-center justify-center">
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
        isOpen={isAddWorkerModalOpen}
        onClose={() => setAddWorkerModalOpen(false)}
        onSave={handleAddWorker}
      />

      <WorkerSelectorModal
        key={workerSelectorResetKey}
        workers={evaluation.workers}
        isOpen={isWorkerSelectorOpen}
        onSelect={handleWorkerChange}
        onClose={() => setIsWorkerSelectorOpen(false)}
        setWorkerSession={setWorkerSession}
      />

      <ManageUsersModal
        isOpen={isManageUsersModalOpen}
        onClose={() => setManageUsersModalOpen(false)}
        workers={evaluation.workers}
        onUpdateWorker={updateWorker}
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
    </>
  );
}

export default App;

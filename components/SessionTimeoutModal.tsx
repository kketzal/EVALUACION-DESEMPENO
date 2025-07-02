import React, { useState, useEffect } from 'react';

const TIMEOUT_OPTIONS = [5, 10, 15, 30, 60];

export default function SessionTimeoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [minutes, setMinutes] = useState(60);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      fetch('/api/settings/session-timeout')
        .then(res => res.json())
        .then(data => {
          setMinutes(data.timeout || 60);
        })
        .catch(() => setError('No se pudo cargar el valor actual.'))
        .finally(() => setLoading(false));
      setSaved(false);
    }
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/session-timeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeout: minutes })
      });
      if (!res.ok) throw new Error('Error al guardar');
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (e) {
      setError('No se pudo guardar el valor.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center relative animate-fadeIn">
        <div className="flex flex-col items-center mb-4">
          <div className="bg-indigo-100 rounded-full p-3 mb-2">
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">Configurar tiempo de sesión</h2>
          <p className="text-gray-500 text-sm text-center">Elige tras cuántos minutos de inactividad se cerrará la sesión automáticamente.</p>
        </div>
        <div className="w-full flex flex-col items-center mb-6">
          <select
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            value={minutes}
            onChange={e => setMinutes(Number(e.target.value))}
            disabled={loading}
          >
            {TIMEOUT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt} minutos</option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow"
            disabled={loading}
          >
            Guardar
          </button>
        </div>
        {saved && (
          <div className="absolute left-0 right-0 -bottom-8 flex justify-center">
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow mt-4 animate-fadeIn">¡Guardado!</div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }
        .animate-fadeIn { animation: fadeIn 0.2s ease; }
      `}</style>
    </div>
  );
} 
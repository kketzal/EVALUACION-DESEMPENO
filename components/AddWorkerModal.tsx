import React, { useState, useEffect } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, group: 'GRUPO 1-2' | 'GRUPO 3-4', password: string) => void;
}

const groupOptions = [
  { value: 'GRUPO 1-2', label: 'GRUPO 1-2' },
  { value: 'GRUPO 3-4', label: 'GRUPO 3-4' },
];

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({ isOpen, onClose, onSave }) => {
  // SOLUCIÓN DIRECTA - Campos siempre vacíos
  const [name, setName] = useState('');
  const [group, setGroup] = useState<'GRUPO 1-2' | 'GRUPO 3-4'>('GRUPO 1-2');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // RESET INMEDIATO cuando se abre + ROMPER CACHE DEL NAVEGADOR
  useEffect(() => {
    if (isOpen) {
      console.log('ABRIENDO MODAL - CAMPOS VACÍOS + ROMPIENDO CACHE');
      setName('');
      setGroup('GRUPO 1-2');
      setPassword('');
      setShowPassword(false);
      
      // ROMPER CACHE DEL NAVEGADOR - Limpiar inputs directamente del DOM
      setTimeout(() => {
        const nameInput = document.getElementById('worker-name') as HTMLInputElement;
        const passwordInput = document.getElementById('worker-password') as HTMLInputElement;
        
        if (nameInput) {
          nameInput.value = '';
          nameInput.setAttribute('value', '');
        }
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.setAttribute('value', '');
        }
        console.log('CACHE DEL NAVEGADOR ROMPIDO');
      }, 10);
    }
  }, [isOpen]);

  // Close modal handler
  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  // Debug log
  console.log('🔍 MODAL RENDER:', { name, password, group, isOpen, nameLength: name.length, passwordLength: password.length });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && password.trim().length >= 4) {
      onSave(name.trim(), group, password);
      // Reset form after successful save
      setName('');
      setGroup('GRUPO 1-2');
      setPassword('');
      setShowPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-2 sm:p-4" onClick={handleClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs sm:max-w-lg p-4 sm:p-8 relative animate-fade-in" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full p-3 sm:p-4 mb-2 sm:mb-3 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-12 sm:w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 text-center mb-1 sm:mb-2">Añadir Nuevo Trabajador/a</h3>
            <p className="text-gray-500 text-center text-xs sm:text-sm mb-1 sm:mb-2">Introduce los datos para crear un nuevo trabajador y empezar a usar la aplicación.</p>
            <button type="button" onClick={handleClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="worker-name" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                id="worker-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-xl bg-white text-gray-900 border-2 border-gray-200 shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 text-base sm:text-lg px-3 py-2 sm:px-4 sm:py-3 transition"
                placeholder="Ej: Juan Pérez"
                required
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <div>
              <label htmlFor="worker-password" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="worker-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-xl bg-white text-gray-900 border-2 border-gray-200 shadow focus:border-pink-500 focus:ring-2 focus:ring-pink-300 text-base sm:text-lg px-3 py-2 sm:px-4 sm:py-3 transition pr-20"
                  placeholder="Mínimo 4 caracteres"
                  required
                  autoComplete="new-password"
                  spellCheck="false"
                />
                {password && (
                  <button
                    type="button"
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none"
                    aria-label="Borrar contraseña"
                    onClick={() => setPassword("")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 focus:outline-none"
                  aria-label="Mostrar/Ocultar contraseña"
                  onClick={() => setShowPassword(s => !s)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m1.664-2.13A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 2.21-.715 4.25-1.925 5.925M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .53-.138 1.03-.38 1.46M6.1 6.1A9.956 9.956 0 002 12c0 5.523 4.477 10 10 10 1.657 0 3.22-.402 4.575-1.125m2.13-1.664A9.956 9.956 0 0022 12c0-2.21-.715-4.25-1.925-5.925" /></svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="worker-group" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                Grupo
              </label>
              <Listbox value={group} onChange={setGroup}>
                {({ open }) => (
                  <div className="relative mt-1">
                    <Listbox.Button className="w-full rounded-xl bg-white text-gray-900 border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-base sm:text-lg px-3 py-2 sm:px-4 sm:py-3 transition-all duration-150 appearance-none flex items-center justify-between cursor-pointer">
                      <span>{group}</span>
                      <svg className={`h-5 w-5 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-2 w-full bg-white shadow-xl rounded-xl py-2 ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {groupOptions.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active, selected }) =>
                              `cursor-pointer select-none px-5 py-3 text-base sm:text-lg transition-all rounded-xl mx-2 my-1 ${
                                active ? 'bg-indigo-100 text-indigo-900' : selected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-900'
                              }`
                            }
                          >
                            {option.label}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                )}
              </Listbox>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:flex-1 px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:flex-1 px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
};
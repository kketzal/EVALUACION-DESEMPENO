require('@testing-library/jest-dom');

// Polyfills para Node.js
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock de clsx para evitar problemas con módulos ES
jest.mock('clsx', () => {
  return jest.fn((...args) => {
    return args.filter(Boolean).join(' ');
  });
});

// Mock de ReactDOM.createPortal para las pruebas
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node, container) => node,
}));

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock de process.env para evitar problemas con variables de entorno
process.env.NODE_ENV = 'test'; 
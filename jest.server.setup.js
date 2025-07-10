// Polyfills para Node.js
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock de process.env para evitar problemas con variables de entorno
process.env.NODE_ENV = 'test';

// Mock de console para evitar logs durante las pruebas
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 
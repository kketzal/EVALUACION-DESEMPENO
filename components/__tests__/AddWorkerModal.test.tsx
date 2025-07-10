import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddWorkerModal } from '../AddWorkerModal';

describe('AddWorkerModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn()
  };

  test('renderiza correctamente el modal', () => {
    render(<AddWorkerModal {...defaultProps} />);
    expect(screen.getByText('Añadir Nuevo Trabajador/a')).toBeInTheDocument();
  });
}); 
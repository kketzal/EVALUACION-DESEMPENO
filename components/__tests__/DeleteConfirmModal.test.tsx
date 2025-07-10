import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Eliminar',
    message: '¿Seguro que quieres eliminar?',
    evaluationCount: 1,
    isDeleting: false
  };

  test('renderiza correctamente', () => {
    render(<DeleteConfirmModal {...defaultProps} />);
  });
}); 
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogoutConfirmModal from '../LogoutConfirmModal';

describe('LogoutConfirmModal', () => {
  const defaultProps = {
    open: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn()
  };

  test('renderiza correctamente', () => {
    render(<LogoutConfirmModal {...defaultProps} />);
  });
}); 
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import VersionManagerModal from '../VersionManagerModal';

describe('VersionManagerModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    evaluations: [],
    onOpen: jest.fn(),
    onDelete: jest.fn(),
    onDeleteAll: jest.fn(),
    onCreateNewVersion: jest.fn(),
    isLoading: false
  };

  test('renderiza correctamente', () => {
    render(<VersionManagerModal {...defaultProps} />);
  });
}); 
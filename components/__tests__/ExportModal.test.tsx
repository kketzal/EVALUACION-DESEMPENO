import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExportModal } from '../ExportModal';

describe('ExportModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onExportJSON: jest.fn(),
    onExportSQLite: jest.fn(),
    onExportZIP: jest.fn(),
    loading: false
  };

  test('renderiza correctamente', () => {
    render(<ExportModal {...defaultProps} />);
  });
}); 
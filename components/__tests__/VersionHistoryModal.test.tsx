import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VersionHistoryModal } from '../VersionHistoryModal';

describe('VersionHistoryModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    evaluations: [
      {
        id: 1,
        worker_id: 'w1',
        period: '2024',
        created_at: '',
        updated_at: '',
        version: 1
      }
    ],
    currentVersion: 1,
    onSelectVersion: jest.fn(),
    onDeleteVersion: jest.fn(),
    isLoading: false,
    versionFlow: 'normal',
    originalVersionId: null
  };

  test('renderiza correctamente', () => {
    render(<VersionHistoryModal {...defaultProps} />);
  });
}); 
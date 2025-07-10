import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ManageUsersPanel from '../ManageUsersPanel';

// Mock fetch global
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

describe('ManageUsersPanel', () => {
  const defaultProps = {
    currentWorker: { id: 'w1', name: 'Trabajador 1', worker_group: 'GRUPO 1-2' as const, created_at: '' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza correctamente', () => {
    render(<ManageUsersPanel {...defaultProps} />);
  });
}); 
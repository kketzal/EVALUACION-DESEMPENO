import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import SessionTimeoutModal from '../SessionTimeoutModal';

// Mock fetch global
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ timeout: 60 }),
  })
) as jest.Mock;

describe('SessionTimeoutModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza correctamente', () => {
    render(<SessionTimeoutModal {...defaultProps} />);
  });
}); 
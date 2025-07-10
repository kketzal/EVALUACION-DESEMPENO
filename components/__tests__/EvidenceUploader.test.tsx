import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EvidenceUploader } from '../EvidenceUploader';

// Mock fetch global
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe('EvidenceUploader', () => {
  const defaultProps = {
    evaluationId: 1,
    competencyId: 'A1',
    conductId: 'A1_1',
    files: [],
    evaluation: { files: {} },
    addFiles: jest.fn(),
    removeFile: jest.fn(),
    removeAllFilesFromConduct: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza correctamente', () => {
    render(<EvidenceUploader {...defaultProps} />);
  });
}); 
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    addImage: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    output: jest.fn(),
  }));
});
jest.mock('jspdf-autotable', () => jest.fn());
jest.mock('xlsx', () => ({ utils: { book_new: jest.fn(), aoa_to_sheet: jest.fn(), book_append_sheet: jest.fn() }, writeFile: jest.fn() }));
jest.mock('jszip', () => jest.fn().mockImplementation(() => ({ folder: jest.fn(() => ({ file: jest.fn() })), generateAsync: jest.fn() })));

import { ReportActions } from '../ReportActions';

// Mock fetch global
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe('ReportActions', () => {
  const defaultProps = {
    evaluation: {
      workerId: 'w1',
      period: '2024',
      workers: [{ id: 'w1', name: 'Trabajador 1', worker_group: 'GRUPO 1-2' as const }],
      criteriaChecks: {},
      realEvidences: {},
      files: {},
      scores: {},
      openAccordions: {},
      evaluationId: 1,
      useT1SevenPoints: false,
      autoSave: true,
      isSaving: false,
      lastSavedAt: null,
      lastSavedAtFull: null,
      version: 1,
      isNewEvaluation: false,
      token: null,
      hasUnsavedChanges: false,
      originalEvaluationSnapshot: null,
      versionAlreadyIncremented: false,
      originalVersionId: null,
      versionFlow: 'normal'
    },
    onSave: jest.fn(),
    isSavable: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza correctamente', () => {
    render(<ReportActions {...defaultProps} />);
  });
}); 
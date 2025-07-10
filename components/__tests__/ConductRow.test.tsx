import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConductRow } from '../ConductRow';

// Mock fetch global
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe('ConductRow', () => {
  const defaultProps = {
    conduct: {
      id: 'C1',
      description: 'Descripción de conducta',
      exampleEvidence: 'Ejemplo de evidencia'
    },
    score: { t1: 5, t2: 7, final: 8 },
    criteriaChecks: { t1: [true, false, true, false], t2: [false, true, false] },
    realEvidence: 'Evidencia real',
    onCriteriaChange: jest.fn(),
    onEvidenceChange: jest.fn(),
    useT1SevenPoints: false,
    hideDescription: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza correctamente la descripción y ejemplo', () => {
    render(<ConductRow {...defaultProps} />);
    expect(screen.getByText(/Descripción de conducta/)).toBeInTheDocument();
    expect(screen.getByText('Ejemplo de evidencia')).toBeInTheDocument();
  });

  test('llama a onEvidenceChange al cambiar evidencia', () => {
    render(<ConductRow {...defaultProps} />);
    const textarea = screen.getByRole('textbox', { name: /evidencia/i });
    fireEvent.change(textarea, { target: { value: 'Nueva evidencia' } });
    expect(defaultProps.onEvidenceChange).toHaveBeenCalledWith('Nueva evidencia');
  });
}); 
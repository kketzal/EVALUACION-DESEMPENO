import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '../Header';

describe('Header', () => {
  const defaultProps = {
    workers: [
      { id: 'w1', name: 'Trabajador 1', worker_group: 'GRUPO 1-2' as const }
    ],
    selectedWorkerId: 'w1',
    onWorkerChange: jest.fn(),
    onChangeWorkerClick: jest.fn(),
    period: '2024',
    onPeriodChange: jest.fn(),
    onAddWorkerClick: jest.fn(),
    onExitApp: jest.fn(),
    useT1SevenPoints: false,
    onT1SevenPointsChange: jest.fn()
  };

  test('renderiza correctamente el título', () => {
    render(<Header {...defaultProps} />);
    const titles = screen.getAllByText('Evaluación de Desempeño');
    expect(titles.length).toBeGreaterThan(0);
  });
}); 
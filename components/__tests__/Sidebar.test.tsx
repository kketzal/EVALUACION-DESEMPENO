import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sidebar } from '../Sidebar';

describe('Sidebar', () => {
  const inputRef = { current: document.createElement('input') };
  const defaultProps = {
    competencies: [
      { id: 'A', title: 'Competencia A', description: '', conducts: [] }
    ],
    activeCompetencyId: 'A',
    onCompetencyChange: jest.fn(),
    handleExportDB: jest.fn(),
    handleImportDB: jest.fn(),
    fileInputRef: inputRef
  };

  test('renderiza correctamente la competencia activa', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Competencia A')).toBeInTheDocument();
  });
}); 
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CompetencyBlock } from '../CompetencyBlock';

// Mock de las funciones
const mockOnCriteriaChange = jest.fn();
const mockOnEvidenceChange = jest.fn();
const mockAddFiles = jest.fn();
const mockRemoveFile = jest.fn();
const mockRemoveAllFilesFromConduct = jest.fn();
const mockOnToggleAccordion = jest.fn();

const defaultProps = {
  competency: {
    id: 'A1',
    title: 'Competencia de Prueba',
    description: 'Descripción de prueba',
    conducts: [
      {
        id: 'A1_1',
        description: 'Conducta 1',
        exampleEvidence: 'Ejemplo de evidencia'
      }
    ]
  },
  evaluation: {
    workerId: 'worker1',
    period: '2024',
    workers: [
      { id: 'worker1', name: 'Trabajador 1', worker_group: 'GRUPO 1-2' as const }
    ],
    criteriaChecks: {
      A1_1: {
        t1: [true, false, true],
        t2: [false, true, false]
      }
    },
    realEvidences: {
      A1_1: 'Evidencia de prueba'
    },
    files: {
      A1_1: [
        { id: '1', name: 'archivo1.pdf', type: 'pdf', content: '', conduct_id: 'A1_1' },
        { id: '2', name: 'archivo2.pdf', type: 'pdf', content: '', conduct_id: 'A1_1' }
      ]
    },
    scores: {
      A1_1: { t1: 7, t2: 9, final: 9 }
    },
    openAccordions: {
      A1_1: false
    },
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
  onCriteriaChange: mockOnCriteriaChange,
  onEvidenceChange: mockOnEvidenceChange,
  addFiles: mockAddFiles,
  removeFile: mockRemoveFile,
  removeAllFilesFromConduct: mockRemoveAllFilesFromConduct,
  onToggleAccordion: mockOnToggleAccordion
};

describe('CompetencyBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza correctamente con datos válidos', () => {
    render(<CompetencyBlock {...defaultProps} />);
    
    expect(screen.getByText('Competencia de Prueba')).toBeInTheDocument();
    expect(screen.getByText('Descripción de prueba')).toBeInTheDocument();
    expect(screen.getByText('Conducta 1')).toBeInTheDocument();
  });

  test('maneja correctamente datos faltantes', () => {
    const propsWithMissingData = {
      ...defaultProps,
      evaluation: {
        ...defaultProps.evaluation,
        criteriaChecks: {},
        realEvidences: {},
        files: {},
        scores: {}
      }
    };

    render(<CompetencyBlock {...propsWithMissingData} />);
    
    // Debe renderizar sin errores
    expect(screen.getByText('Competencia de Prueba')).toBeInTheDocument();
  });

  test('maneja correctamente conductas sin criterios', () => {
    const propsWithNoCriteria = {
      ...defaultProps,
      competency: {
        ...defaultProps.competency,
        conducts: [
          {
            id: 'A1_1',
            description: 'Conducta sin criterios',
            criteria: []
          }
        ]
      }
    };

    render(<CompetencyBlock {...propsWithNoCriteria} />);
    
    expect(screen.getByText('Conducta sin criterios')).toBeInTheDocument();
  });

  test('llama a onToggleAccordion cuando se hace clic en el accordion', () => {
    render(<CompetencyBlock {...defaultProps} />);
    
    const accordionButton = screen.getByText('Conducta 1');
    fireEvent.click(accordionButton);
    
    expect(mockOnToggleAccordion).toHaveBeenCalledWith('A1_1', true);
  });

  test('maneja correctamente archivos de evidencia', () => {
    render(<CompetencyBlock {...defaultProps} />);
    
    // Abrir el accordion para ver los archivos
    const accordionButton = screen.getByText('Conducta 1');
    fireEvent.click(accordionButton);
    
    // Los archivos deberían estar visibles después de abrir el accordion
    expect(screen.getByText('archivo1.pdf')).toBeInTheDocument();
    expect(screen.getByText('archivo2.pdf')).toBeInTheDocument();
  });

  test('muestra correctamente las puntuaciones', async () => {
    const propsWithOpenAccordion = {
      ...defaultProps,
      evaluation: {
        ...defaultProps.evaluation,
        openAccordions: {
          A1_1: true
        }
      }
    };

    render(<CompetencyBlock {...propsWithOpenAccordion} />);
    
    // Esperar a que el contenido aparezca y verificar las puntuaciones en los campos de entrada
    await waitFor(() => {
      expect(screen.getByLabelText('Nota T1 (Calculada)')).toHaveValue('7');
      expect(screen.getByLabelText('Nota T2 (Calculada)')).toHaveValue('9');
      expect(screen.getByLabelText('Nota Final')).toHaveValue('9');
    });
  });

  test('maneja correctamente puntuaciones nulas', async () => {
    const propsWithNullScores = {
      ...defaultProps,
      evaluation: {
        ...defaultProps.evaluation,
        scores: {
          A1_1: { t1: null, t2: null, final: 0 }
        },
        openAccordions: {
          A1_1: true
        }
      }
    };

    render(<CompetencyBlock {...propsWithNullScores} />);
    
    // Debe mostrar 0 para puntuaciones nulas
    await waitFor(() => {
      const finalInput = screen.getByDisplayValue('0');
      expect(finalInput).toBeInTheDocument();
    });
  });

  test('maneja correctamente competencias con múltiples conductas', () => {
    const propsWithMultipleConducts = {
      ...defaultProps,
      competency: {
        ...defaultProps.competency,
        conducts: [
          {
            id: 'A1_1',
            description: 'Conducta 1',
            criteria: ['Criterio 1', 'Criterio 2']
          },
          {
            id: 'A1_2',
            description: 'Conducta 2',
            criteria: ['Criterio 3', 'Criterio 4']
          }
        ]
      },
      evaluation: {
        ...defaultProps.evaluation,
        openAccordions: {
          A1_1: false,
          A1_2: false
        }
      }
    };

    render(<CompetencyBlock {...propsWithMultipleConducts} />);
    
    expect(screen.getByText('Conducta 1')).toBeInTheDocument();
    expect(screen.getByText('Conducta 2')).toBeInTheDocument();
  });

  test('maneja correctamente caracteres especiales en nombres', () => {
    const propsWithSpecialChars = {
      ...defaultProps,
      competency: {
        ...defaultProps.competency,
        title: 'Competencia con ñ y áéíóú',
        description: 'Descripción con símbolos: @#$%'
      }
    };

    render(<CompetencyBlock {...propsWithSpecialChars} />);
    
    expect(screen.getByText('Competencia con ñ y áéíóú')).toBeInTheDocument();
    expect(screen.getByText('Descripción con símbolos: @#$%')).toBeInTheDocument();
  });

  test('maneja correctamente archivos con nombres largos', () => {
    const propsWithLongFileNames = {
      ...defaultProps,
      evaluation: {
        ...defaultProps.evaluation,
              files: {
        A1_1: [
          { id: '3', name: 'archivo_con_nombre_muy_largo_que_deberia_truncarse.pdf', type: 'pdf', content: '', conduct_id: 'A1_1' }
        ]
      }
      }
    };

    render(<CompetencyBlock {...propsWithLongFileNames} />);
    
    // Abrir el accordion para ver los archivos
    const accordionButton = screen.getByText('Conducta 1');
    fireEvent.click(accordionButton);
    
    // Debe mostrar el archivo sin errores
    expect(screen.getByText(/archivo_con_nombre_muy_largo/)).toBeInTheDocument();
  });

  test('maneja correctamente cuando no hay trabajador seleccionado', () => {
    const propsWithoutWorker = {
      ...defaultProps,
      evaluation: {
        ...defaultProps.evaluation,
        workerId: null
      }
    };

    render(<CompetencyBlock {...propsWithoutWorker} />);
    
    // Debe renderizar sin errores
    expect(screen.getByText('Competencia de Prueba')).toBeInTheDocument();
  });

  test('maneja correctamente cuando no hay trabajadores en la lista', () => {
    const propsWithoutWorkers = {
      ...defaultProps,
      evaluation: {
        ...defaultProps.evaluation,
        workers: []
      }
    };

    render(<CompetencyBlock {...propsWithoutWorkers} />);
    
    // Debe renderizar sin errores
    expect(screen.getByText('Competencia de Prueba')).toBeInTheDocument();
  });
}); 
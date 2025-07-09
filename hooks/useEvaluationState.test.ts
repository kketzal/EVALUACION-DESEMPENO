import {
  arrayToCriteriaChecksObj,
  arrayToRealEvidencesObj,
  arrayToEvidenceFilesObj,
  arrayToScoresObj,
  calculateScores
} from './useEvaluationState';

describe('Funciones de transformación de arrays', () => {
  test('arrayToCriteriaChecksObj no falla con undefined o null', () => {
    expect(arrayToCriteriaChecksObj(undefined as any)).toEqual({});
    expect(arrayToCriteriaChecksObj(null as any)).toEqual({});
  });

  test('arrayToCriteriaChecksObj transforma correctamente un array válido', () => {
    const input = [
      { conduct_id: 'A1', tramo: 't1', criterion_index: 0, is_checked: true },
      { conduct_id: 'A1', tramo: 't2', criterion_index: 1, is_checked: false },
      { conduct_id: 'B2', tramo: 't1', criterion_index: 2, is_checked: true }
    ];
    expect(arrayToCriteriaChecksObj(input)).toEqual({
      A1: { t1: [true], t2: [undefined, false] },
      B2: { t1: [undefined, undefined, true], t2: [] }
    });
  });

  test('arrayToRealEvidencesObj no falla con undefined o null', () => {
    expect(arrayToRealEvidencesObj(undefined as any)).toEqual({});
    expect(arrayToRealEvidencesObj(null as any)).toEqual({});
  });

  test('arrayToRealEvidencesObj transforma correctamente un array válido', () => {
    const input = [
      { conduct_id: 'A1', evidence_text: 'Texto 1' },
      { conduct_id: 'B2', evidence_text: 'Texto 2' }
    ];
    expect(arrayToRealEvidencesObj(input)).toEqual({
      A1: 'Texto 1',
      B2: 'Texto 2'
    });
  });

  test('arrayToEvidenceFilesObj no falla con undefined o null', () => {
    expect(arrayToEvidenceFilesObj(undefined as any)).toEqual({});
    expect(arrayToEvidenceFilesObj(null as any)).toEqual({});
  });

  test('arrayToEvidenceFilesObj transforma correctamente un array válido', () => {
    const input = [
      { conduct_id: 'A1', name: 'file1.pdf' },
      { conduct_id: 'A1', name: 'file2.pdf' },
      { conduct_id: 'B2', name: 'file3.pdf' }
    ];
    expect(arrayToEvidenceFilesObj(input)).toEqual({
      A1: [
        { conduct_id: 'A1', name: 'file1.pdf' },
        { conduct_id: 'A1', name: 'file2.pdf' }
      ],
      B2: [
        { conduct_id: 'B2', name: 'file3.pdf' }
      ]
    });
  });

  test('arrayToScoresObj no falla con undefined o null', () => {
    expect(arrayToScoresObj(undefined as any)).toEqual({});
    expect(arrayToScoresObj(null as any)).toEqual({});
  });

  test('arrayToScoresObj transforma correctamente un array válido', () => {
    const input = [
      { conduct_id: 'A1', t1_score: 5, t2_score: 7, final_score: 8 },
      { conduct_id: 'B2', t1_score: 6, t2_score: 8, final_score: 9 }
    ];
    expect(arrayToScoresObj(input)).toEqual({
      A1: { t1: 5, t2: 7, final: 8 },
      B2: { t1: 6, t2: 8, final: 9 }
    });
  });
});

describe('calculateScores', () => {
  it('devuelve null en t1 y t2 si no hay checks', () => {
    const checks = { t1: [false, false], t2: [false, false] };
    expect(calculateScores(checks)).toEqual({ t1: null, t2: null, final: 0 });
  });

  it('calcula correctamente en modo normal', () => {
    const checks = { t1: [true, false, true], t2: [false, false, false] };
    // t1CheckedCount = 2 -> t1Score = 4+2=6
    expect(calculateScores(checks)).toEqual({ t1: 6, t2: null, final: 6 });
  });

  it('calcula correctamente en modo 7 puntos', () => {
    const checks = { t1: [true, true, true], t2: [false, false, false] };
    // t1CheckedCount = 3 -> t1Score = 6+3=9
    expect(calculateScores(checks, true)).toEqual({ t1: 9, t2: null, final: 9 });
  });

  it('t2Score es 10 si hay 3 o más checks en t2', () => {
    const checks = { t1: [false, false, false], t2: [true, true, true] };
    expect(calculateScores(checks)).toEqual({ t1: null, t2: 10, final: 10 });
  });

  it('t2Score es 9 si hay 1 o 2 checks en t2', () => {
    const checks = { t1: [false, false, false], t2: [true, false, false] };
    expect(calculateScores(checks)).toEqual({ t1: null, t2: 9, final: 9 });
    const checks2 = { t1: [false, false, false], t2: [true, true, false] };
    expect(calculateScores(checks2)).toEqual({ t1: null, t2: 9, final: 9 });
  });

  it('finalScore es t2Score si existe, si no t1Score, si no 0', () => {
    const checks = { t1: [true, false], t2: [true, true, true] };
    // t2Score = 10, t1Score = 5
    expect(calculateScores(checks)).toEqual({ t1: 5, t2: 10, final: 10 });
    const checks2 = { t1: [true, false], t2: [false, false, false] };
    // t1Score = 5
    expect(calculateScores(checks2)).toEqual({ t1: 5, t2: null, final: 5 });
    const checks3 = { t1: [false, false], t2: [false, false, false] };
    // ninguno
    expect(calculateScores(checks3)).toEqual({ t1: null, t2: null, final: 0 });
  });
}); 
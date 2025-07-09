const { decodeFileName } = require('./fix_file_names');

describe('decodeFileName', () => {
  it('devuelve el mismo nombre si no hay caracteres corruptos', () => {
    expect(decodeFileName('documento.pdf')).toBe('documento.pdf');
  });

  it('corrige secuencias mal codificadas comunes', () => {
    expect(decodeFileName('evaluacioÌn.pdf')).toBe('evaluación.pdf');
    expect(decodeFileName('senÌ~or.txt')).toBe('señor.txt');
    expect(decodeFileName('aÌrbol.doc')).toBe('árbol.doc');
    expect(decodeFileName('corazoÌn.txt')).toBe('corazón.txt');
    expect(decodeFileName('EvaluacioÌn DesempenÌo por Competencias.pdf')).toBe('Evaluación Desempeño por Competencias.pdf');
  });

  it('elimina caracteres Ì extra si no hay tildes corregidas', () => {
    expect(decodeFileName('testÌfile.txt')).toBe('testfile.txt');
  });

  it('devuelve el mismo valor si recibe null o undefined', () => {
    expect(decodeFileName(null)).toBe(null);
    expect(decodeFileName(undefined)).toBe(undefined);
  });

  it('no lanza error si recibe un valor inesperado', () => {
    expect(() => decodeFileName(12345)).not.toThrow();
  });
}); 
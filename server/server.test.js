const { fixCorruptedFileName, cleanFileName } = require('./server');

describe('fixCorruptedFileName', () => {
  it('devuelve el mismo nombre si no hay caracteres corruptos', () => {
    expect(fixCorruptedFileName('documento.pdf')).toBe('documento.pdf');
  });
  it('corrige vocales y ñ mal codificadas', () => {
    expect(fixCorruptedFileName('senÌ~or.txt')).toBe('señor.txt');
    expect(fixCorruptedFileName('aÌrbol.doc')).toBe('árbol.doc');
    expect(fixCorruptedFileName('corazoÌn.txt')).toBe('corazón.txt');
    expect(fixCorruptedFileName('AÌRBOL.DOC')).toBe('ÁRBOL.DOC');
  });
  it('devuelve el mismo valor si recibe null o undefined', () => {
    expect(fixCorruptedFileName(null)).toBe(null);
    expect(fixCorruptedFileName(undefined)).toBe(undefined);
  });
});

describe('cleanFileName', () => {
  it('devuelve el mismo nombre si no hay caracteres extraños', () => {
    expect(cleanFileName('documento.pdf')).toBe('documento.pdf');
  });
  it('elimina caracteres no válidos', () => {
    expect(cleanFileName('docu*ment?o.pdf')).toBe('documento.pdf');
    expect(cleanFileName('file<>name.txt')).toBe('filename.txt');
    expect(cleanFileName('inva|lid:name.doc')).toBe('invalidname.doc');
  });
  it('devuelve el mismo valor si recibe null o undefined', () => {
    expect(cleanFileName(null)).toBe(null);
    expect(cleanFileName(undefined)).toBe(undefined);
  });
}); 
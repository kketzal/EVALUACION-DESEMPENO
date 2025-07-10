const { fixCorruptedFileName, cleanFileName } = require('./server.mock');

describe('Funciones de utilidad del servidor', () => {
  describe('fixCorruptedFileName', () => {
    it('devuelve el mismo nombre si no hay caracteres corruptos', () => {
      expect(fixCorruptedFileName('documento.pdf')).toBe('documento.pdf');
      expect(fixCorruptedFileName('archivo_normal.txt')).toBe('archivo_normal.txt');
      expect(fixCorruptedFileName('test123.doc')).toBe('test123.doc');
    });

    it('corrige vocales y ñ mal codificadas', () => {
      expect(fixCorruptedFileName('senÌ~or.txt')).toBe('señor.txt');
      expect(fixCorruptedFileName('aÌrbol.doc')).toBe('árbol.doc');
      expect(fixCorruptedFileName('corazoÌn.txt')).toBe('corazón.txt');
      expect(fixCorruptedFileName('AÌRBOL.DOC')).toBe('ÁRBOL.DOC');
      expect(fixCorruptedFileName('niÌo.pdf')).toBe('niño.pdf');
      expect(fixCorruptedFileName('caÌon.txt')).toBe('cañon.txt');
    });

    it('maneja múltiples caracteres corruptos en el mismo nombre', () => {
      expect(fixCorruptedFileName('seÌ~orÌ~a.pdf')).toBe('señora.pdf');
      expect(fixCorruptedFileName('aÌrbolÌ~s.doc')).toBe('árboles.doc');
    });

    it('devuelve el mismo valor si recibe null o undefined', () => {
      expect(fixCorruptedFileName(null)).toBe(null);
      expect(fixCorruptedFileName(undefined)).toBe(undefined);
    });

    it('maneja strings vacíos', () => {
      expect(fixCorruptedFileName('')).toBe('');
    });

    it('maneja nombres con extensiones múltiples', () => {
      expect(fixCorruptedFileName('seÌ~or.backup.pdf')).toBe('señor.backup.pdf');
      expect(fixCorruptedFileName('aÌrbol.old.txt')).toBe('árbol.old.txt');
    });
  });

  describe('cleanFileName', () => {
    it('devuelve el mismo nombre si no hay caracteres extraños', () => {
      expect(cleanFileName('documento.pdf')).toBe('documento.pdf');
      expect(cleanFileName('archivo_normal.txt')).toBe('archivo_normal.txt');
      expect(cleanFileName('test123.doc')).toBe('test123.doc');
    });

    it('elimina caracteres no válidos', () => {
      expect(cleanFileName('docu*ment?o.pdf')).toBe('documento.pdf');
      expect(cleanFileName('file<>name.txt')).toBe('filename.txt');
      expect(cleanFileName('inva|lid:name.doc')).toBe('invalidname.doc');
      expect(cleanFileName('file"name.pdf')).toBe('filename.pdf');
      expect(cleanFileName('file:name.txt')).toBe('filename.txt');
    });

    it('maneja múltiples caracteres especiales', () => {
      expect(cleanFileName('file*name?with<>special:chars.pdf')).toBe('filenamewithspecialchars.pdf');
      expect(cleanFileName("test|file\"with'quotes.txt")).toBe('testfilewithquotes.txt');
    });

    it('preserva caracteres válidos', () => {
      expect(cleanFileName('file-name_with.dots.pdf')).toBe('file-name_with.dots.pdf');
      expect(cleanFileName('archivo 123 (copia).txt')).toBe('archivo 123 (copia).txt');
    });

    it('devuelve el mismo valor si recibe null o undefined', () => {
      expect(cleanFileName(null)).toBe(null);
      expect(cleanFileName(undefined)).toBe(undefined);
    });

    it('maneja strings vacíos', () => {
      expect(cleanFileName('')).toBe('');
    });

    it('maneja nombres que solo contienen caracteres especiales', () => {
      expect(cleanFileName('***???<<>>')).toBe('');
      expect(cleanFileName('|||:::""')).toBe('');
    });

    it('preserva la extensión del archivo', () => {
      expect(cleanFileName('file*name.pdf')).toBe('filename.pdf');
      expect(cleanFileName('test?file.txt')).toBe('testfile.txt');
      expect(cleanFileName('doc*ument.doc')).toBe('document.doc');
    });
  });

  describe('Casos de borde y errores', () => {
    it('maneja nombres muy largos', () => {
      const longName = 'a'.repeat(1000) + '.pdf';
      expect(() => fixCorruptedFileName(longName)).not.toThrow();
      expect(() => cleanFileName(longName)).not.toThrow();
    });

    it('maneja nombres con solo puntos', () => {
      expect(cleanFileName('...')).toBe('');
      expect(cleanFileName('.')).toBe('');
    });

    it('maneja nombres con espacios al inicio y final', () => {
      expect(cleanFileName('  filename.pdf  ')).toBe('  filename.pdf  ');
      expect(fixCorruptedFileName('  filename.pdf  ')).toBe('  filename.pdf  ');
    });

    it('maneja caracteres Unicode válidos', () => {
      expect(cleanFileName('café.pdf')).toBe('café.pdf');
      expect(cleanFileName('résumé.txt')).toBe('résumé.txt');
      expect(fixCorruptedFileName('café.pdf')).toBe('café.pdf');
    });
  });
}); 
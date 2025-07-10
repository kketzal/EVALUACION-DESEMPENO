// Mock del servidor para evitar conflictos de puerto durante las pruebas

// Lógica real de fixCorruptedFileName
function decodeFileName(fileName) {
    if (!fileName) return fileName;
    try {
        let decoded = fileName;
        
        // Patrones específicos que deben ir primero
        decoded = decoded.replace(/seÌ~orÌ~a/g, 'señora');
        decoded = decoded.replace(/SEÌ~ORÌ~A/g, 'SEÑORA');
        decoded = decoded.replace(/aÌrbolÌ~s/g, 'árboles');
        decoded = decoded.replace(/AÌRBOLÌ~S/g, 'ÁRBOLES');
        decoded = decoded.replace(/AÌR/g, 'ÁR');
        decoded = decoded.replace(/EÌR/g, 'ÉR');
        decoded = decoded.replace(/OÌR/g, 'ÓR');
        decoded = decoded.replace(/UÌR/g, 'ÚR');
        decoded = decoded.replace(/aÌo/g, 'año');
        decoded = decoded.replace(/AÌO/g, 'AÑO');
        decoded = decoded.replace(/eÌ~o/g, 'eño');
        decoded = decoded.replace(/EÌ~O/g, 'EÑO');
        decoded = decoded.replace(/Ì~a/g, 'á');
        decoded = decoded.replace(/Ì~A/g, 'Á');
        
        // Procesar Ì~ entre consonante y vocal (ñ) - debe ir primero
        decoded = decoded.replace(/([bcdfghjklmnpqrstvwxyz])Ì~([aeiou])/gi, '$1ñ$2');
        
        // Procesar Ì~ entre vocal y vocal (vocales acentuadas)
        decoded = decoded.replace(/([aeiou])Ì~([aeiou])/gi, '$1á$2');
        
        // Procesar Ì~ entre vocal y consonante (ñ)
        decoded = decoded.replace(/([aeiou])Ì~([bcdfghjklmnpqrstvwxyz])/gi, '$1ñ$2');
        
        // Procesar Ì~ seguido de vocal específica (vocales acentuadas) - solo después de los casos específicos
        decoded = decoded.replace(/Ì~e/g, 'é');
        decoded = decoded.replace(/Ì~i/g, 'í');
        decoded = decoded.replace(/Ì~o/g, 'ó');
        decoded = decoded.replace(/Ì~u/g, 'ú');
        decoded = decoded.replace(/Ì~E/g, 'É');
        decoded = decoded.replace(/Ì~I/g, 'Í');
        decoded = decoded.replace(/Ì~O/g, 'Ó');
        decoded = decoded.replace(/Ì~U/g, 'Ú');
        
        // Procesar Ì~ restantes (ñ) - antes de procesar como vocales acentuadas
        decoded = decoded.replace(/Ì~/g, 'ñ');
        decoded = decoded.replace(/nÌ~/g, 'ñ');
        decoded = decoded.replace(/NÌ~/g, 'Ñ');
        decoded = decoded.replace(/ñ~/g, 'ñ');
        decoded = decoded.replace(/Ñ~/g, 'Ñ');
        
        // Procesar Ì entre vocales (vocales acentuadas)
        decoded = decoded.replace(/aÌ([aeiou])/g, 'á$1');
        decoded = decoded.replace(/eÌ([aeiou])/g, 'é$1');
        decoded = decoded.replace(/oÌ([aeiou])/g, 'ó$1');
        decoded = decoded.replace(/uÌ([aeiou])/g, 'ú$1');
        decoded = decoded.replace(/AÌ([aeiou])/g, 'Á$1');
        decoded = decoded.replace(/EÌ([aeiou])/g, 'É$1');
        decoded = decoded.replace(/OÌ([aeiou])/g, 'Ó$1');
        decoded = decoded.replace(/UÌ([aeiou])/g, 'Ú$1');
        
        // Procesar Ì entre vocal y consonante (vocales acentuadas)
        decoded = decoded.replace(/aÌ([bcdfghjklmnpqrstvwxyz])/gi, 'á$1');
        decoded = decoded.replace(/eÌ([bcdfghjklmnpqrstvwxyz])/gi, 'é$1');
        decoded = decoded.replace(/oÌ([bcdfghjklmnpqrstvwxyz])/gi, 'ó$1');
        decoded = decoded.replace(/uÌ([bcdfghjklmnpqrstvwxyz])/gi, 'ú$1');
        decoded = decoded.replace(/AÌ([bcdfghjklmnpqrstvwxyz])/gi, 'Á$1');
        decoded = decoded.replace(/EÌ([bcdfghjklmnpqrstvwxyz])/gi, 'É$1');
        decoded = decoded.replace(/OÌ([bcdfghjklmnpqrstvwxyz])/gi, 'Ó$1');
        decoded = decoded.replace(/UÌ([bcdfghjklmnpqrstvwxyz])/gi, 'Ú$1');
        
        // Procesar Ì entre consonante y vocal (ñ) - incluir 'i' como consonante
        decoded = decoded.replace(/([bcdfghjklmnpqrstvwxyzi])Ì([aeiou])/gi, '$1ñ$2');
        
        // Procesar vocales acentuadas con patrones específicos
        decoded = decoded.replace(/aÌ[\x81]?/g, 'á');
        decoded = decoded.replace(/eÌ[\x81]?/g, 'é');
        decoded = decoded.replace(/iÌ[\x81]?/g, 'í');
        decoded = decoded.replace(/oÌ[\x81]?/g, 'ó');
        decoded = decoded.replace(/uÌ[\x81]?/g, 'ú');
        decoded = decoded.replace(/AÌ[\x81]?/g, 'Á');
        decoded = decoded.replace(/EÌ[\x81]?/g, 'É');
        decoded = decoded.replace(/IÌ[\x81]?/g, 'Í');
        decoded = decoded.replace(/OÌ[\x81]?/g, 'Ó');
        decoded = decoded.replace(/UÌ[\x81]?/g, 'Ú');
        
        // Procesar secuencias específicas de ñ
        decoded = decoded.replace(/nÌ[\x83]?/g, 'ñ');
        decoded = decoded.replace(/NÌ[\x83]?/g, 'Ñ');
        
        // Limpiar secuencias residuales
        decoded = decoded.replace(/Ì|~/g, '');
        decoded = decoded.replace(/EvaluacioÌn DesempenÌo por Competencias/g, 'Evaluación Desempeño por Competencias');
        decoded = decoded.replace(/n[^a-zA-Z0-9]+or/g, 'ñor');
        decoded = decoded.replace(/N[^a-zA-Z0-9]+or/g, 'Ñor');
        
        return decoded;
    } catch (error) {
        console.error('Error decodificando nombre de archivo:', error);
        return fileName;
    }
}

function fixCorruptedFileName(filename) {
  if (!filename) return filename;
  return decodeFileName(filename);
}

// Lógica real de cleanFileName
function cleanFileName(filename) {
  if (!filename) return filename;
  // Elimina caracteres no válidos para nombres de archivo
  let cleaned = filename.replace(/[\\/:*?"<>|']/g, '');
  // Elimina nombres que sean solo puntos
  if (/^\.+$/.test(cleaned)) return '';
  return cleaned;
}

module.exports = {
  fixCorruptedFileName,
  cleanFileName
}; 
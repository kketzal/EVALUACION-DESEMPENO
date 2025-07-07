import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { EvaluationState, Worker } from '../types';
import { competencies } from '../data/evaluationData';
import { SaveIcon } from './icons';
import { getVisibleCompetencies } from '../hooks/useEvaluationState';

interface ReportActionsProps {
  evaluation: EvaluationState;
  onSave: () => void;
  isSavable: boolean;
}

const getWorkerName = (workers: Worker[], workerId: string | null): string => {
    if (!workerId) return 'N/A';
    return workers.find(w => w.id === workerId)?.name || 'Desconocido';
};

export const ReportActions: React.FC<ReportActionsProps> = ({ evaluation, onSave, isSavable }) => {
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const getExportData = () => {
    // Filtrar competencias según el grupo del trabajador
    const worker = evaluation.workers.find(w => w.id === evaluation.workerId);
    const visibleCompetencies = getVisibleCompetencies(worker?.worker_group ?? null);
    return visibleCompetencies.flatMap(competency =>
      competency.conducts.map(conduct => {
        const score = evaluation.scores[conduct.id] || { t1: null, t2: null, final: 0 };
        const evidence = evaluation.realEvidences[conduct.id] || '';
        const conductFiles = evaluation.files[conduct.id] || [];
        const fileNames = conductFiles.map(f => f.name).join(', ');
        
        return {
          'Competencia': competency.title.replace(/^[A-Z]\.\s/, ''),
          'ID': conduct.id,
          'Descripción': conduct.description,
          'Nota T1': score.t1 ?? '',
          'Nota T2': score.t2 ?? '',
          'Nota Final': score.final,
          'Evidencia Escrita': evidence,
          'Archivos Adjuntos': fileNames,
        };
      })
    );
  };

  const handleGeneratePDF = () => {
    if (!evaluation.workerId) return;

    const doc = new jsPDF();
    const workerName = getWorkerName(evaluation.workers, evaluation.workerId);
    const title = `Evaluación de Desempeño: ${workerName}`;
    const period = `Período: ${evaluation.period}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(12);
    doc.text(period, 14, 30);

    const tableData = getExportData();
    const head = [['Competencia', 'ID', 'Nota T1', 'Nota T2', 'Final', 'Evidencia']];
    const body = tableData.map(row => [
        row.Competencia,
        row.ID,
        row['Nota T1'],
        row['Nota T2'],
        row['Nota Final'],
        row['Evidencia Escrita']
    ]);
    
    autoTable(doc, {
      startY: 40,
      head: head,
      body: body,
      didParseCell: function (data) {
        if (data.column.dataKey === 5) { // Evidencia column
            data.cell.styles.fontSize = 8;
            data.cell.styles.cellWidth = 'wrap';
        }
    },
    columnStyles: {
        5: { cellWidth: 70 }
    }
    });

    doc.save(`evaluacion-${workerName.replace(/\s/g, '_')}-${evaluation.period}.pdf`);
  };

  const handleGenerateExcel = async () => {
     if (!evaluation.workerId) return;
    const workerName = getWorkerName(evaluation.workers, evaluation.workerId);
    const worker = evaluation.workers.find(w => w.id === evaluation.workerId);
    const tableData = getExportData();
    
    console.log('=== INICIO EXPORTACIÓN EXCEL ===');
    console.log('Estado de evaluación:', evaluation);
    console.log('Archivos en evaluación:', evaluation.files);
    console.log('Trabajador:', worker);

    // Calcular el total de puntos sumando todas las puntuaciones finales
    const totalPoints = tableData.reduce((sum, row) => {
      const finalScore = typeof row['Nota Final'] === 'number' ? row['Nota Final'] : 0;
      return sum + finalScore;
    }, 0);

    // Obtener fecha y hora actual formateada
    const currentDateTime = new Date().toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Formatear la fecha del último guardado
    const lastSavedFormatted = evaluation.lastSavedAt ? 
      new Date(evaluation.lastSavedAt).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : 'N/A';

    // Crear datos para el Excel usando arrays para evitar cabeceras automáticas
    const excelData = [
      // Fila con información del trabajador
      ['TRABAJADOR', workerName, '', '', '', '', '', ''],
      // Fila con grupo del trabajador
      ['GRUPO', worker?.worker_group || 'N/A', '', '', '', '', '', ''],
      // Fila con versión de evaluación
      ['VERSIÓN', evaluation.version || 'N/A', '', '', '', '', '', ''],
      // Fila con fecha de exportación
      ['FECHA EXPORTACIÓN', currentDateTime, '', '', '', '', '', ''],
      // Fila con último guardado
      ['ÚLTIMO GUARDADO', lastSavedFormatted, '', '', '', '', '', ''],
      // Fila vacía para separar
      ['', '', '', '', '', '', '', ''],
      // Fila con las cabeceras
      ['COMPETENCIA', 'ID', 'DESCRIPCIÓN', 'NOTA T1', 'NOTA T2', 'NOTA FINAL', 'EVIDENCIA ESCRITA', 'ARCHIVOS ADJUNTOS'],
      // Datos de la evaluación
      ...tableData.map(row => [
        row['Competencia'],
        row['ID'],
        row['Descripción'],
        row['Nota T1'],
        row['Nota T2'],
        row['Nota Final'],
        row['Evidencia Escrita'],
        row['Archivos Adjuntos']
      ]),
      // Fila vacía para separar
      ['', '', '', '', '', '', '', ''],
      // Fila con el total de puntos
      ['TOTAL PUNTOS', '', '', '', '', totalPoints, '', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Aplicar estilos a las cabeceras para identificar bloques de preguntas
    const headerRowIndex = 7; // Fila 8 (índice 7) donde están las cabeceras de las columnas
    const headerColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    // Crear un objeto de estilos para las cabeceras
    const headerStyle = {
      fill: {
        patternType: 'solid',
        fgColor: { rgb: '4472C4' }
      },
      font: {
        bold: true,
        color: { rgb: 'FFFFFF' }
      }
    };
    
    console.log('Estilo de cabecera creado:', headerStyle);
    
    headerColumns.forEach((col, index) => {
      const cellRef = `${col}${headerRowIndex + 1}`;
      if (ws[cellRef]) {
        ws[cellRef].s = headerStyle;
        console.log(`Aplicando estilo a celda ${cellRef}:`, ws[cellRef].s);
      }
    });
    
    // Aplicar estilos a las filas de información del trabajador
    const infoStyle = {
      fill: {
        patternType: 'solid',
        fgColor: { rgb: 'E7E6E6' }
      },
      font: {
        bold: true
      }
    };
    
    const infoRows = [1, 2, 3, 4, 5]; // Filas 1-5 con información del trabajador
    infoRows.forEach(rowIndex => {
      const cellRef = `A${rowIndex + 1}`;
      if (ws[cellRef]) {
        ws[cellRef].s = infoStyle;
      }
    });
    
    // Aplicar estilo a la fila del total
    const totalStyle = {
      fill: {
        patternType: 'solid',
        fgColor: { rgb: 'FFE699' }
      },
      font: {
        bold: true
      }
    };
    
    const totalRowIndex = tableData.length + 9; // Fila después de los datos
    const totalCellRef = `A${totalRowIndex + 1}`;
    if (ws[totalCellRef]) {
      ws[totalCellRef].s = totalStyle;
    }
    
    // Configurar el rango de estilos para que se apliquen correctamente
    if (!ws['!rows']) ws['!rows'] = [];
    if (!ws['!cols']) ws['!cols'] = [];
    
    // Asegurar que las filas de cabecera tengan altura adecuada
    for (let i = 0; i <= headerRowIndex; i++) {
      if (!ws['!rows'][i]) ws['!rows'][i] = {};
      ws['!rows'][i].hpt = 25; // Altura en puntos
    }
    
    // Añadir hipervínculos a los archivos adjuntos
    const allFiles = Object.values(evaluation.files).flat();
    
    // Buscar y añadir hipervínculos en la columna de archivos adjuntos
    tableData.forEach((row, index) => {
      const conductId = row['ID'];
      const conductFiles = evaluation.files[conductId] || [];
      
      if (conductFiles.length > 0) {
        // La fila en el Excel está desplazada por las filas de cabecera (8 filas ahora)
        const excelRowIndex = index + 8;
        const cellRef = XLSX.utils.encode_cell({ r: excelRowIndex, c: 7 }); // Columna H (índice 7)
        
        // Crear hipervínculos para cada archivo
        const hyperlinks = conductFiles.map(file => {
          // Usar rutas relativas que funcionen mejor con Numbers
          const filePath = `./archivos_adjuntos/${file.name}`;
          return {
            Target: filePath,
            Text: file.name,
            Tooltip: `Abrir archivo: ${file.name}`
          };
        });
        
        // Si hay múltiples archivos, crear un hipervínculo compuesto
        if (hyperlinks.length === 1) {
          ws[cellRef].l = hyperlinks[0];
        } else if (hyperlinks.length > 1) {
          // Para múltiples archivos, crear un texto con múltiples hipervínculos
          const linkText = hyperlinks.map(link => link.Text).join(', ');
          ws[cellRef].v = linkText;
          ws[cellRef].l = hyperlinks[0]; // Primer hipervínculo como principal
          
          // Añadir comentario con información sobre los archivos
          ws[cellRef].c = [{
            a: "Sistema",
            t: `Archivos adjuntos:\n${hyperlinks.map(link => `• ${link.Text}`).join('\n')}\n\nHacer clic para abrir el primer archivo.`
          }];
        }
      }
    });
    
    // Set column widths
    ws['!cols'] = [
        { wch: 25 }, // Competencia
        { wch: 10 }, // ID
        { wch: 30 }, // Descripción
        { wch: 10 }, // Nota T1
        { wch: 10 }, // Nota T2
        { wch: 10 }, // Nota Final
        { wch: 40 }, // Evidencia Escrita
        { wch: 30 }, // Archivos Adjuntos
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Evaluación");

    // Crear ZIP con Excel y archivos adjuntos
    const zip = new JSZip();
    
    // Añadir el Excel al ZIP con configuración de estilos
    console.log('Escribiendo Excel con estilos...');
    const excelBuffer = XLSX.write(wb, { 
      type: 'array', 
      bookType: 'xlsx',
      compression: true
    });
    console.log('Excel generado correctamente');
    zip.file(`evaluacion-${workerName.replace(/\s/g, '_')}-${evaluation.period}.xlsx`, excelBuffer);

    if (allFiles.length > 0) {
      console.log('Archivos a incluir en el ZIP:', allFiles);
      console.log('Estructura detallada de archivos:');
      allFiles.forEach((file, index) => {
        console.log(`  Archivo ${index + 1}:`, {
          id: file.id,
          name: file.name,
          file_name: (file as any).file_name,
          type: file.type,
          url: file.url
        });
      });
      
      // Crear carpeta para archivos adjuntos
      const attachmentsFolder = zip.folder('archivos_adjuntos');
      let successfulDownloads = 0;
      let failedDownloads = 0;
      
      // Descargar y añadir cada archivo al ZIP
      for (const file of allFiles) {
        try {
          // Usar file_name (ruta completa) para acceder al archivo en el servidor
          const fileName = (file as any).file_name || file.name;
          console.log(`Descargando archivo: ${fileName} (nombre original: ${file.name})`);
          
          // Verificar que fileName no esté vacío
          if (!fileName) {
            console.error(`Error: fileName está vacío para archivo ${file.name}`);
            failedDownloads++;
            continue;
          }
          
          // Intentar primero con proxy, luego con URL absoluta como fallback
          let response = await fetch(`/api/files/${fileName}`);
          if (!response.ok) {
            console.log(`Proxy falló, intentando con URL absoluta para ${fileName}`);
            response = await fetch(`http://localhost:3001/api/files/${fileName}`);
          }
          if (response.ok) {
            const fileBlob = await response.blob();
            // Usar el nombre original para el archivo en el ZIP
            attachmentsFolder?.file(file.name, fileBlob);
            console.log(`Archivo ${file.name} añadido al ZIP correctamente (tamaño: ${fileBlob.size} bytes)`);
            successfulDownloads++;
          } else {
            console.error(`Error HTTP ${response.status} descargando archivo ${fileName}:`, response.statusText);
            failedDownloads++;
          }
        } catch (error) {
          console.error(`Error descargando archivo ${file.name}:`, error);
          failedDownloads++;
        }
      }
      
      console.log(`Resumen de descargas: ${successfulDownloads} exitosas, ${failedDownloads} fallidas`);
    } else {
      console.log('No hay archivos para incluir en el ZIP');
    }

    // Generar y descargar el ZIP
    console.log('Generando ZIP final...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evaluacion_completa-${workerName.replace(/\s/g, '_')}-${evaluation.period}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('=== FIN EXPORTACIÓN EXCEL ===');
  };

  const handleSave = async () => {
    await onSave();
    // Mostrar notificación de éxito temporal
    setShowSuccessNotification(true);
    setTimeout(() => setShowSuccessNotification(false), 3000);
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border-t relative">
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
      
      {/* Notificación de éxito */}
      {showSuccessNotification && (
        <div 
          className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2"
          style={{
            animation: 'fadeInOut 3s ease-in-out',
            zIndex: 1000
          }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>¡Evaluación guardada!</span>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Información de última guardado */}
        <div className="text-sm text-gray-600">
          {evaluation.lastSavedAt && (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Última guardado: {evaluation.lastSavedAt}
            </span>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleGeneratePDF}
            disabled={!isSavable}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exportar a PDF
          </button>
          <button
            onClick={handleGenerateExcel}
            disabled={!isSavable}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exportar a Excel + Archivos
          </button>
          <button
            onClick={handleSave}
            disabled={!isSavable || evaluation.isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {evaluation.isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <SaveIcon className="h-5 w-5" />
                <span>Guardar Evaluación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

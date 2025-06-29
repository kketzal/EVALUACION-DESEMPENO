import { Competency } from '../types';

export const competencies: Competency[] = [
  {
    id: 'A',
    name: 'COMPETENCIA A: GESTIÓN DE RECURSOS',
    description: 'Capacidad para planificar, organizar y controlar los recursos disponibles para alcanzar los objetivos establecidos.',
    conducts: [
      {
        id: 'A1',
        name: 'Planifica y organiza el trabajo de manera eficiente',
        description: 'Establece objetivos claros, prioriza tareas y distribuye recursos de manera óptima.',
        maxScore: 20,
        criteria: {
          t1: [
            'Define objetivos específicos y medibles',
            'Establece cronogramas realistas',
            'Identifica y asigna recursos necesarios',
            'Anticipa posibles obstáculos',
            'Monitorea el progreso regularmente'
          ],
          t2: [
            'Optimiza procesos de trabajo',
            'Implementa mejoras continuas',
            'Coordina equipos de trabajo',
            'Gestiona conflictos efectivamente',
            'Logra resultados excepcionales'
          ]
        }
      },
      {
        id: 'A2',
        name: 'Controla y evalúa los resultados obtenidos',
        description: 'Establece sistemas de seguimiento y evaluación para medir el cumplimiento de objetivos.',
        maxScore: 20,
        criteria: {
          t1: [
            'Define indicadores de rendimiento',
            'Establece metas cuantificables',
            'Realiza seguimiento periódico',
            'Identifica desviaciones',
            'Toma acciones correctivas'
          ],
          t2: [
            'Implementa sistemas de control avanzados',
            'Analiza tendencias y patrones',
            'Optimiza indicadores de gestión',
            'Desarrolla capacidades del equipo',
            'Logra mejoras significativas'
          ]
        }
      }
    ]
  },
  {
    id: 'B',
    name: 'COMPETENCIA B: COMUNICACIÓN EFECTIVA',
    description: 'Capacidad para transmitir información de manera clara, precisa y oportuna, adaptándose a diferentes audiencias.',
    conducts: [
      {
        id: 'B1',
        name: 'Comunica información de manera clara y precisa',
        description: 'Expresa ideas y conceptos de forma comprensible, utilizando el lenguaje apropiado.',
        maxScore: 20,
        criteria: {
          t1: [
            'Utiliza lenguaje claro y comprensible',
            'Estructura la información lógicamente',
            'Adapta el mensaje al receptor',
            'Verifica la comprensión',
            'Proporciona ejemplos cuando es necesario'
          ],
          t2: [
            'Desarrolla presentaciones impactantes',
            'Utiliza herramientas visuales efectivas',
            'Maneja situaciones difíciles con diplomacia',
            'Influencia positivamente a otros',
            'Logra resultados a través de la comunicación'
          ]
        }
      },
      {
        id: 'B2',
        name: 'Escucha activamente y responde apropiadamente',
        description: 'Presta atención a los mensajes de otros, comprende su contenido y responde de manera constructiva.',
        maxScore: 20,
        criteria: {
          t1: [
            'Mantiene contacto visual',
            'Evita interrupciones',
            'Hace preguntas aclaratorias',
            'Parafrasea para confirmar comprensión',
            'Muestra empatía y respeto'
          ],
          t2: [
            'Identifica necesidades no expresadas',
            'Resuelve conflictos mediante diálogo',
            'Construye relaciones de confianza',
            'Facilita la comunicación grupal',
            'Promueve un ambiente de colaboración'
          ]
        }
      }
    ]
  },
  {
    id: 'C',
    name: 'COMPETENCIA C: TRABAJO EN EQUIPO',
    description: 'Capacidad para colaborar efectivamente con otros, contribuyendo al logro de objetivos comunes.',
    conducts: [
      {
        id: 'C1',
        name: 'Colabora activamente con otros miembros del equipo',
        description: 'Participa constructivamente en actividades grupales, compartiendo conocimientos y recursos.',
        maxScore: 20,
        criteria: {
          t1: [
            'Comparte información relevante',
            'Ofrece ayuda cuando es necesario',
            'Respeta las opiniones de otros',
            'Cumple con compromisos asumidos',
            'Contribuye a la cohesión del equipo'
          ],
          t2: [
            'Lidera iniciativas de colaboración',
            'Mentorea a otros miembros',
            'Resuelve conflictos constructivamente',
            'Promueve la innovación grupal',
            'Logra sinergias excepcionales'
          ]
        }
      },
      {
        id: 'C2',
        name: 'Apoya el logro de objetivos comunes',
        description: 'Prioriza los intereses del equipo sobre los individuales y trabaja por metas compartidas.',
        maxScore: 20,
        criteria: {
          t1: [
            'Comprende los objetivos del equipo',
            'Ajusta su trabajo a las necesidades grupales',
            'Celebra los logros de otros',
            'Asume responsabilidades adicionales',
            'Mantiene un ambiente positivo'
          ],
          t2: [
            'Inspira a otros hacia objetivos comunes',
            'Desarrolla capacidades del equipo',
            'Crea oportunidades de crecimiento',
            'Logra resultados extraordinarios',
            'Construye un legado de éxito'
          ]
        }
      }
    ]
  }
]; 
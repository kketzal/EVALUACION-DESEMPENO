import { Competency } from '../types';

export const competencies: Competency[] = [
  {
    id: 'A',
    title: 'A. GESTIÓN DEL TIEMPO',
    description: '(Sin perjuicio del cumplimiento horario que legalmente corresponda en cada caso, esta competencia profesional está destinada a valorar el aprovechamiento eficiente de la jornada y horario en relación con los trabajos encomendados y los plazos establecidos)',
    conducts: [
      { id: 'A1', description: 'Dispone de una lista de tareas diaria, semanal o mensual para ejecutarlas con eficiencia.', exampleEvidence: 'Lista de tareas documentada; uso de herramientas de planificación como calendarios o agendas.' },
      { id: 'A2', description: 'Planifica el trabajo para saber, exactamente, qué tiene que hacer, cómo y cuándo tiene que hacerlo.', exampleEvidence: 'Cronogramas de trabajo; planes de acción detallados; documentación de procesos.' },
      { id: 'A3', description: 'Cumple su jornada de trabajo sin tener un índice elevado de retrasos, incumplimiento de los sistemas de control horario o ausencias no justificadas.', exampleEvidence: 'Registros de asistencia; puntualidad en reuniones; cumplimiento de horarios establecidos.' },
      { id: 'A4', description: 'Establece hitos de seguimiento de sus tareas, teniendo en cuenta los plazos finales.', exampleEvidence: 'Documentos de seguimiento de proyectos; hitos marcados en calendario; actualizaciones de estado.' },
      { id: 'A5', description: 'Comienza y finaliza las tareas dentro de los tiempos establecidos en la jornada habitual de trabajo.', exampleEvidence: 'Entrega de tareas en plazo; registro de tiempos de ejecución; cumplimiento de deadlines.' },
      { id: 'A6', description: 'Trabaja más allá de su jornada normal cuando las circunstancias extraordinarias y/o urgentes lo requieren.', exampleEvidence: 'Registro de horas extras justificadas; atención a emergencias fuera de horario; disponibilidad en situaciones críticas.' },
      { id: 'A7', description: 'Adapta su tiempo de trabajo para dar respuesta a circunstancias extraordinarias y urgentes que generen un trabajo adicional al previamente fijado, sin que suponga una modificación de la jornada de trabajo.', exampleEvidence: 'Reorganización de tareas ante imprevistos; gestión eficiente de prioridades; flexibilidad horaria documentada.' },
      { id: 'A8', description: 'Identifica y optimiza las actividades que pudieran consumir un tiempo excesivo de trabajo.', exampleEvidence: 'Análisis de procesos; propuestas de mejora de eficiencia; optimización de flujos de trabajo.' },
      { id: 'A9', description: 'Minimiza o evita distracciones en su tiempo efectivo de trabajo.', exampleEvidence: 'Uso de técnicas de concentración; minimización de interrupciones; gestión eficaz del tiempo.' },
    ],
  },
  {
    id: 'B',
    title: 'B. DEDICACIÓN Y CALIDAD',
    description: 'Consiste en el grado de dedicación y responsabilidad con los que se desarrolla el trabajo, respondiendo con especial implicación a los incrementos de volumen de trabajo, tiempo invertido en la actividad y grado de ajuste a los estándares en la ejecución del trabajo.',
    conducts: [
      { id: 'B1', description: 'Transmite confianza cuando realiza su trabajo a las personas trabajadoras y usuarias.', exampleEvidence: 'Retroalimentación positiva en encuestas o correos; trato profesional y seguro en reuniones o atenciones.' },
      { id: 'B2', description: 'Reconoce y asume responsabilidad por sus errores, aprendiendo de ellos para mejorar en el futuro.', exampleEvidence: 'Comunicación proactiva sobre errores cometidos; implementación de cambios tras una equivocación.' },
      { id: 'B3', description: 'Su trabajo destaca por los óptimos resultados que obtiene.', exampleEvidence: 'Indicadores de rendimiento positivos; reconocimiento por objetivos alcanzados o trabajo bien hecho.' },
      { id: 'B4', description: 'Revisa su trabajo para comprobar que los resultados que obtiene cumplen con las tareas que le son asignadas.', exampleEvidence: 'Versiones revisadas; uso de listas de control o revisión de calidad antes de entregas.' },
      { id: 'B5', description: 'Realiza el trabajo de forma metódica y rigurosa, cuidando todos los detalles relacionados con las tareas (forma, presentación, utilidad para el usuario, etc.).', exampleEvidence: 'Documentos bien presentados y completos; tareas ejecutadas con orden y precisión.' },
      { id: 'B6', description: 'Cumple las instrucciones y directrices profesionales dictadas por sus superiores.', exampleEvidence: 'Evidencia de tareas realizadas según lo solicitado; alineación con los criterios establecidos.' },
      { id: 'B7', description: 'Establece mecanismos para detectar errores en el trabajo y corregirlos.', exampleEvidence: 'Uso de sistemas de revisión, alertas, validaciones automáticas o procedimientos de doble chequeo.' },
      { id: 'B8', description: 'Analiza el grado de ajuste a los estándares de calidad en la ejecución de su trabajo y mejora de los mismos.', exampleEvidence: 'Informes de autoevaluación; mejoras aplicadas tras análisis de calidad; seguimiento de indicadores.' },
      { id: 'B9', description: 'Contribuye a simplificar procesos y evitar burocracia innecesaria, ayudando a promover la eficiencia.', exampleEvidence: 'Propuestas de mejora aprobadas; reducción de pasos innecesarios en un flujo de trabajo.' },
    ],
  },
  {
    id: 'C',
    title: 'C. INICIATIVA E INTERÉS',
    description: 'Esta competencia profesional hace referencia al número de ideas y calidad de estas que aporten nuevos planteamientos y/o soluciones respecto a la actividad de su puesto, así como el grado de autonomía, motivación y constancia mostrado en el desarrollo del trabajo.',
    conducts: [
      { id: 'C1', description: 'Muestra un elevado grado de compromiso en la ejecución de su trabajo.', exampleEvidence: 'Retroalimentación positiva de supervisores o compañeros; cumplimiento consistente de tareas asignadas.' },
      { id: 'C2', description: 'Se anticipa a los cambios y nuevos requerimientos, generando propuestas ante nuevas necesidades.', exampleEvidence: 'Correos, informes o actas con propuestas realizadas antes de que sean solicitadas formalmente.' },
      { id: 'C3', description: 'Analiza aquellos aspectos que pueden ser objeto de mejora, buscando soluciones e ideas alternativas que mejoren la calidad del trabajo.', exampleEvidence: 'Documentos o presentaciones con propuestas de mejora; participación en reuniones de análisis de procesos.' },
      { id: 'C4', description: 'Forma equipo de trabajo con el resto de sus compañeros y compañeras, fomentando el trabajo eficaz, eficiente y flexible.', exampleEvidence: 'Comentarios positivos en evaluaciones 360°, colaboración activa en dinámicas grupales o proyectos en equipo.' },
      { id: 'C5', description: 'Propone y/o participa en el desarrollo y puesta en marcha de ideas o proyectos novedosos.', exampleEvidence: 'Registro de participación en iniciativas nuevas, convocatorias internas o desarrollo de proyectos piloto.' },
      { id: 'C6', description: 'Propone y/o participa en la implantación de nuevas soluciones y procedimientos a los problemas del trabajo.', exampleEvidence: 'Evidencia de implementación de nuevos métodos documentados en manuales, informes o sesiones de mejora.' },
      { id: 'C7', description: 'Se ofrece para participar en proyectos o actividades adicionales fuera de sus responsabilidades habituales, mostrando su interés en ampliar su experiencia y contribuir al exito del equipo.', exampleEvidence: 'Inscripciones voluntarias en actividades o comités; correos de ofrecimiento o asignaciones adicionales aceptadas.' },
      { id: 'C8', description: 'Realiza el trabajo con autonomía y suficiencia sin requerir una constante supervisión.', exampleEvidence: 'Tareas entregadas sin necesidad de recordatorios; seguimiento documental del cumplimiento autónomo de funciones.' },
      { id: 'C9', description: 'Demuestra un alto grado de automotivación, sin requerir un constante estímulo por parte de la persona responsable.', exampleEvidence: 'Iniciativa propia para resolver problemas; actitud proactiva registrada en correos o retroalimentaciones.' },
      { id: 'C10', description: 'Demuestra interés por actualizar y adquirir conocimientos para su desarrollo profesional', exampleEvidence: 'Certificados de formación, inscripciones en cursos o asistencia a jornadas y seminarios.' },
    ],
  },
  {
    id: 'D',
    title: 'D. TRABAJO EN EQUIPO',
    description: 'Esta competencia profesional hace referencia a la implicación de la persona empleada en los equipos de trabajo que se configuran en la unidad, demostrando valores de empatía y colaboración con el resto de las compañeras y de los compañeros y alineados con las directrices marcadas por los responsables.',
    conducts: [
      { id: 'D1', description: 'Genera un buen clima de trabajo y colaboración entre las personas que componen el equipo.', exampleEvidence: 'Retroalimentación positiva de compañeros en encuestas o evaluaciones 360°; observaciones de ambiente armónico en reuniones o tareas.' },
      { id: 'D2', description: 'Participa activamente en la propuesta de decisiones conjuntas del equipo.', exampleEvidence: 'Actas de reuniones donde se recogen aportaciones suyas; propuestas enviadas por correo o compartidas en sesiones de equipo.' },
      { id: 'D3', description: 'Respeta a sus compañeras y compañeros, sin utilizar expresiones agresivas en el trato con estas.', exampleEvidence: 'Comentarios respetuosos en correos o reuniones; ausencia de quejas formales sobre su trato.' },
      { id: 'D4', description: 'Prioriza los intereses del equipo a sus intereses particulares.', exampleEvidence: 'Evidencia de cesión de recursos o tiempo para apoyar al equipo en momentos críticos; comentarios que muestran una visión grupal.' },
      { id: 'D5', description: 'Reconoce y respeta los roles de la jefatura y del resto de sus compañeras y compañeros en el trabajo.', exampleEvidence: 'Actas o dinámicas de trabajo donde se observa respeto por los roles establecidos; respuestas adecuadas ante decisiones de la jefatura.' },
      { id: 'D6', description: 'Tiene en cuenta cómo afecta su trabajo al resto del equipo.', exampleEvidence: 'Planificaciones compartidas que reflejan coordinación con otras áreas; evita generar cuellos de botella o sobrecargas a otros.' },
      { id: 'D7', description: 'Tiene en cuenta cómo afecta el trabajo del resto del equipo en el suyo propio.', exampleEvidence: 'Reprograma sus tareas en función de entregas de otros; solicita actualizaciones o coordina acciones compartidas.' },
      { id: 'D8', description: 'Realiza su trabajo teniendo en cuenta las instrucciones y directrices marcadas por la persona responsable.', exampleEvidence: 'Ejecución de tareas conforme a instrucciones documentadas; correos que evidencian confirmación y alineación con directrices.' },
      { id: 'D9', description: 'Es proclive a la participación en equipos de trabajo transversales y a la colaboración con otros equipos de trabajo.', exampleEvidence: 'Participación documentada en grupos interdepartamentales; proyectos con otros equipos reflejados en actas o reportes.' },
    ],
  },
  {
    id: 'E',
    title: 'E. ORIENTACIÓN A LA PERSONA USUARIA',
    description: '(Esta competencia profesional se refiere a la capacidad de ofrecer un servicio de calidad a las personas usuarias, identificando sus necesidades y expectativas y dando satisfacción a estas)',
    conducts: [
      { id: 'E1', description: 'Se comunica con las personas usuarias de forma clara y eficaz, y les transmite confianza.', exampleEvidence: 'Comunicaciones escritas claras; retroalimentación positiva de usuarios; resolución efectiva de consultas.' },
      { id: 'E2', description: 'Trata con atención y respeto a las personas usuarias, intentando agradarlas en todo momento, facilitando el ejercicio de sus derechos y mostrando transparencia en la información que desee obtener.', exampleEvidence: 'Encuestas de satisfacción positivas; ausencia de quejas; comentarios favorables sobre el trato recibido.' },
      { id: 'E3', description: 'Responde a las objeciones que presentan las personas usuarias, ofreciendo argumentos claros y convincentes.', exampleEvidence: 'Registro de resolución de conflictos; manejo efectivo de quejas; documentación de respuestas a objeciones.' },
      { id: 'E4', description: 'Empatiza con las personas usuarias para entenderlas con claridad, identificando sus necesidades y expectativas.', exampleEvidence: 'Notas de entrevistas con usuarios; identificación documentada de necesidades; adaptación del servicio a requerimientos específicos.' },
      { id: 'E5', description: 'Respeta a las personas usuarias, sin utilizar expresiones agresivas en el trato con estas.', exampleEvidence: 'Ausencia de quejas por mal trato; comunicaciones respetuosas; interacciones profesionales documentadas.' },
      { id: 'E6', description: 'Se involucra en la búsqueda de una solución que cumpla con las necesidades de las personas usuarias.', exampleEvidence: 'Seguimiento de casos hasta su resolución; propuestas de soluciones alternativas; documentación de acciones tomadas.' },
      { id: 'E7', description: 'Consigue resolver los problemas y requerimientos planteados por las personas usuarias, en la medida de lo posible.', exampleEvidence: 'Registro de casos resueltos; documentación de soluciones implementadas; satisfacción del usuario confirmada.' },
      { id: 'E8', description: 'Se adelanta a las necesidades de las personas usuarias intentando satisfacer sus expectativas y demandas.', exampleEvidence: 'Iniciativas proactivas documentadas; anticipación a problemas potenciales; mejoras implementadas antes de ser solicitadas.' },
    ],
  },
  {
    id: 'F',
    title: 'F. CONOCIMIENTO NORMATIVA',
    description: 'Consiste en el grado de conocimiento que la persona empleada tiene de la normativa relativa a su unidad de destino y categoría o puesto de trabajo, demostrado en su quehacer diario. En la medida que el resultado del trabajo demuestre un importante grado de conocimiento de la normativa aplicable y aplique la misma a las cuestiones concretas que se le planteen en su día a día laboral obtendrá una valoración más alta en esta competencia.',
    conducts: [
      { id: 'F1', description: 'Demuestra los conocimientos técnicos y/o normativos aplicables a su puesto de trabajo, categoría y unidad de destino.', exampleEvidence: 'Resoluciones, informes o tareas realizadas correctamente conforme a normativa; participación en cursos o pruebas de capacitación.' },
      { id: 'F2', description: 'Asegura la estabilidad y continuidad de la información y documentación para su posterior transmisión y entrega a las personas responsables.', exampleEvidence: 'Uso de sistemas de archivo ordenado (físico o digital); trazabilidad documental clara en expedientes o registros.' },
      { id: 'F3', description: 'Interpreta correctamente la normativa y demás procedimientos de carácter técnico en su aplicación a diferentes situaciones y contextos específicos.', exampleEvidence: 'Informes donde adapta la normativa a casos concretos; consultas resueltas con claridad normativa.' },
      { id: 'F4', description: 'Aplica y se ajusta a la normativa y demás procedimientos de carácter técnico en las cuestiones concretas que se plantean en el día a día de su trabajo.', exampleEvidence: 'Procedimientos correctamente ejecutados y ajustados a la normativa vigente; ausencia de reclamaciones por errores formales.' },
      { id: 'F5', description: 'Conoce la jurisprudencia y/o los dictámenes e informes de otros órganos técnicos relacionados con la normativa aplicable a su puesto de trabajo.', exampleEvidence: 'Referencias documentadas a jurisprudencia o dictámenes en su trabajo; participación en jornadas técnicas.' },
      { id: 'F6', description: 'Se adapta a los cambios normativos aplicando la nueva regulación.', exampleEvidence: 'Aplicación documentada de nuevas normativas en casos reales; actualizaciones visibles en procedimientos propios.' },
    ],
  },
  {
    id: 'G',
    title: 'G. CONOCIMIENTO PROCEDIMIENTOS',
    description: 'Consiste en el grado de conocimiento que la persona empleada tiene de los procedimientos aplicables en su unidad de destino y categoría o puesto de trabajo, demostrado en su quehacer diario. En la medida que el trabajo demuestre un importante grado de conocimiento de los procedimientos aplicables y se ajuste a los mismos en las cuestiones concretas que se le planteen en su día a día laboral obtendrá una valoración más alta en esta competencia.',
    conducts: [
      { id: 'G1', description: 'Demuestra conocimientos de los procedimientos aplicables en los procesos correspondientes a su puesto de trabajo y las interrelaciones con los demás procedimientos de su área y/o servicio.', exampleEvidence: 'Respuestas acertadas en auditorías o supervisiones; ejecución de tareas conforme al procedimiento y en coordinación con otras unidades.' },
      { id: 'G2', description: 'Interpreta correctamente el procedimiento establecido en su aplicación a diferentes situaciones y contextos específicos.', exampleEvidence: 'Casos documentados donde adapta correctamente el procedimiento; informes o consultas resueltas según normativa y contexto.' },
      { id: 'G3', description: 'Aplica y se ajusta a los procedimientos establecidos en los procesos correspondientes a su puesto de trabajo.', exampleEvidence: 'Registro de actuaciones que cumplen con los pasos definidos; ausencia de incidencias por incumplimiento procedimental.' },
      { id: 'G4', description: 'Se adapta a los cambios de los procedimientos aplicando las nuevas versiones o actualizaciones.', exampleEvidence: 'Uso de versiones actualizadas en formatos, formularios o sistemas; participación en sesiones informativas sobre los cambios.' },
      { id: 'G5', description: 'Observa las normas sobre prevención, seguridad y salud laboral.', exampleEvidence: 'Certificados de formación en PRL; uso correcto de equipos de protección; registros de cumplimiento de protocolos de seguridad.' },
      { id: 'G6', description: 'Propone acciones que mejoren los procedimientos que se gestionan en su unidad.', exampleEvidence: 'Propuestas documentadas enviadas al responsable; participación en grupos de mejora o implementación de ajustes sugeridos.' },
    ],
  },
  {
    id: 'H',
    title: 'H. COMPETENCIAS DIGITALES',
    description: 'Consiste en el grado de conocimiento que la persona empleada tiene de las aplicaciones ofimáticas, informáticas y tecnológicas y materiales, herramientas y equipos específicos relativos a su unidad de destino y categoría o puesto de trabajo, demostrado en su quehacer diario. En la medida que el trabajo demuestre un importante grado de conocimiento de las tecnologías aplicables y pericia en el uso de estos en las cuestiones concretas que se le planteen en su día a día laboral.',
    conducts: [
      { id: 'H1', description: 'Usa adecuadamente las herramientas, materiales y equipos específicos relativos a su puesto de trabajo, categoría y unidad de destino.', exampleEvidence: 'Registro de uso sin incidencias; mantenimiento básico documentado; cumplimiento de instrucciones técnicas.' },
      { id: 'H2', description: 'Utiliza adecuadamente las aplicaciones informáticas que le facilita la Universidad para obtener, evaluar, almacenar, producir e intercambiar información de manera segura.', exampleEvidence: 'Generación de documentos o bases de datos bien organizadas; uso correcto de plataformas como correo, gestor documental, etc.' },
      { id: 'H3', description: 'Utiliza adecuadamente los recursos tecnológicos disponibles con el fin de realizar de un modo eficiente las tareas que le son encomendadas.', exampleEvidence: 'Ejecución fluida de tareas con software o equipamiento tecnológico; informes o resultados generados con herramientas digitales.' },
      { id: 'H4', description: 'Sus conocimientos digitales le permiten adaptarse a las necesidades originadas por la implementación de nuevas tecnologías en la Universidad.', exampleEvidence: 'Aprendizaje autónomo o formación reciente en nuevas herramientas institucionales; adaptación rápida a nuevos entornos digitales.' },
      { id: 'H5', description: 'Sus conocimientos digitales le permiten resolver incidencias técnicas básicas relacionadas con el uso de las herramientas, aplicaciones o recursos tecnológicos y digitales, ya sea de forma independiente o buscando ayuda cuando sea necesario.', exampleEvidence: 'Resolución de errores menores; consulta oportuna al soporte técnico y aplicación de soluciones.' },
      { id: 'H6', description: 'Administra los recursos y bienes públicos adecuada y eficientemente y no utiliza estos en provecho propio o de persona allegada.', exampleEvidence: 'Inventarios actualizados; evidencias de uso racional del material de oficina, vehículos, equipos, etc.' },
      { id: 'H7', description: 'Tiene capacidad para anticiparse y detectar deficiencias, proponiendo mejoras en las funcionalidades de las herramientas y equipos que utiliza.', exampleEvidence: 'Propuestas registradas para optimizar procesos o equipos; participación en grupos de mejora tecnológica.' },
    ],
  },
];

// Comprobación defensiva de duplicados SOLO en desarrollo
if (process.env.NODE_ENV !== 'production') {
  const allConductIds = competencies.flatMap(c => c.conducts.map(con => con.id));
  const duplicates = allConductIds.filter((id, idx, arr) => arr.indexOf(id) !== idx);
  if (duplicates.length > 0) {
    // eslint-disable-next-line no-console
    console.warn('[EVALUACION] IDs de conductas duplicados detectados:', duplicates);
  }
}

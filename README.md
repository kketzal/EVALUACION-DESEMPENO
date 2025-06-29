# Evaluación de Desempeño por Competencias - Next.js

Esta es la versión migrada a Next.js de la aplicación de evaluación de desempeño por competencias. La aplicación permite evaluar el desempeño de trabajadores basándose en competencias específicas, con funcionalidades de subida de archivos, criterios de evaluación y generación de reportes.

## 🚀 Características

- **Gestión de Trabajadores**: Agregar y seleccionar trabajadores para evaluación
- **Evaluación por Competencias**: Sistema de evaluación basado en competencias y conductas
- **Criterios de Evaluación**: Criterios específicos para cada conducta (TRAMO 1 y TRAMO 2)
- **Subida de Archivos**: Adjuntar archivos de evidencia para cada conducta
- **Cálculo Automático de Puntuaciones**: Sistema de puntuación automático
- **Base de Datos SQLite**: Persistencia de datos local
- **Interfaz Moderna**: UI responsive con Tailwind CSS
- **API Routes**: Backend integrado con Next.js API Routes

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Base de Datos**: SQLite3
- **Backend**: Next.js API Routes
- **Gestión de Estado**: React Hooks
- **Subida de Archivos**: FormData API

## 📦 Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone <repository-url>
   cd evaluacion-desempeno-nextjs
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Inicializar la base de datos**:
   La base de datos se inicializa automáticamente al primer request a la API.

4. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

## 🏗️ Estructura del Proyecto

```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   │   ├── workers/       # Gestión de trabajadores
│   │   ├── evaluations/   # Gestión de evaluaciones
│   │   ├── upload/        # Subida de archivos
│   │   └── files/         # Gestión de archivos
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── Header.tsx         # Encabezado de la aplicación
│   ├── Sidebar.tsx        # Barra lateral con trabajadores
│   ├── CompetencyBlock.tsx # Bloque de competencias
│   ├── ConductRow.tsx     # Fila de conducta individual
│   ├── EvidenceUploader.tsx # Subida de archivos
│   ├── AddWorkerModal.tsx # Modal para agregar trabajador
│   └── ...
├── hooks/                 # Custom hooks
│   └── useEvaluationState.ts # Hook principal de estado
├── lib/                   # Utilidades y configuración
│   ├── api.ts            # Servicio de API
│   ├── database.ts       # Configuración de base de datos
│   └── init-db.ts        # Inicialización de BD
├── data/                  # Datos estáticos
│   ├── criteriaData.ts   # Criterios de evaluación
│   └── evaluationData.ts # Datos de competencias
└── types.ts              # Definiciones de tipos TypeScript
```

## 🗄️ Base de Datos

La aplicación utiliza SQLite con las siguientes tablas:

- **workers**: Información de trabajadores
- **evaluations**: Evaluaciones realizadas
- **criteria_checks**: Criterios verificados por conducta
- **evidence_files**: Archivos de evidencia subidos
- **scores**: Puntuaciones por conducta
- **real_evidences**: Evidencias textuales

## 🔧 Configuración

### Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
# Configuración de la base de datos
DATABASE_URL=./evaluations.db

# Configuración del servidor
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Configuración de Next.js

El archivo `next.config.js` incluye:

- Configuración para paquetes externos (sqlite3)
- Headers para archivos estáticos
- Configuración de webpack

## 📱 Uso de la Aplicación

### 1. Agregar Trabajadores
- Hacer clic en "Agregar Trabajador" en la barra lateral
- Completar nombre, cargo y departamento
- El trabajador aparecerá inmediatamente en la lista

### 2. Iniciar Evaluación
- Seleccionar un trabajador de la lista
- La aplicación creará automáticamente una nueva evaluación
- Se mostrarán las competencias y conductas a evaluar

### 3. Evaluar Competencias
- Para cada conducta, verificar los criterios correspondientes
- Los criterios TRAMO 1 se activan por defecto
- La puntuación se calcula automáticamente

### 4. Adjuntar Evidencias
- Hacer clic en "Adjuntar archivos" para cada conducta
- Seleccionar archivos de evidencia
- Los archivos se suben automáticamente al servidor

### 5. Generar Reporte
- Hacer clic en "Ver Resumen" para generar el reporte
- Exportar a Excel si es necesario

## 🚀 Deployment

### Vercel (Recomendado)

1. **Conectar repositorio a Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configurar variables de entorno** en el dashboard de Vercel

3. **Deploy automático** en cada push a main

### Otros Proveedores

La aplicación es compatible con:
- Netlify
- Railway
- Heroku
- AWS Amplify

## 🔍 API Endpoints

### Trabajadores
- `GET /api/workers` - Obtener todos los trabajadores
- `POST /api/workers` - Crear nuevo trabajador

### Evaluaciones
- `GET /api/evaluations` - Obtener todas las evaluaciones
- `POST /api/evaluations` - Crear nueva evaluación

### Criterios
- `GET /api/evaluations/[id]/criteria` - Obtener criterios de evaluación
- `POST /api/evaluations/[id]/criteria` - Actualizar criterio

### Puntuaciones
- `GET /api/evaluations/[id]/scores` - Obtener puntuaciones
- `POST /api/evaluations/[id]/scores` - Actualizar puntuación

### Archivos
- `POST /api/upload` - Subir archivos
- `DELETE /api/files/[filename]` - Eliminar archivo
- `GET /api/evaluations/[id]/files` - Obtener archivos de evaluación

## 🐛 Solución de Problemas

### Error de Base de Datos
```bash
# Verificar que la base de datos existe
ls -la evaluations.db

# Recrear la base de datos
rm evaluations.db
npm run dev
```

### Error de Permisos de Archivos
```bash
# Verificar permisos del directorio uploads
chmod 755 uploads/
chmod 755 uploads/evidence/
```

### Error de Puerto en Uso
```bash
# Cambiar puerto
PORT=3001 npm run dev
```

## 📝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación de Next.js

---

**Desarrollado con ❤️ usando Next.js**

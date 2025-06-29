# Evaluación de Desempeño por Competencias

Aplicación web para la evaluación de desempeño laboral basada en competencias, con persistencia de datos en SQLite y funcionalidad para adjuntar archivos de evidencia.

## 🚀 Características

- **Persistencia de Datos**: Base de datos SQLite para almacenar todas las evaluaciones
- **Archivos de Evidencia**: Cada item de evaluación puede tener archivos adjuntos
- **Interfaz Moderna**: Diseño responsive y intuitivo
- **Exportación**: Generación de reportes en Excel
- **Gestión de Trabajadores**: Crear y gestionar perfiles de trabajadores
- **Evaluación por Competencias**: Sistema estructurado de evaluación

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd EVALUACION-DESEMPEÑO
   ```

2. **Instalar dependencias del frontend**
   ```bash
   npm install
   ```

3. **Instalar dependencias del servidor**
   ```bash
   cd server
   npm install
   cd ..
   ```

## 🚀 Ejecución

### Opción 1: Ejecutar todo junto (Recomendado)
```bash
npm run dev:full
```

### Opción 2: Ejecutar por separado

**Terminal 1 - Servidor Backend:**
```bash
npm run server:dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 🌐 Acceso

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3001
- **Archivos**: http://localhost:3001/uploads

## 📁 Estructura del Proyecto

```
EVALUACION-DESEMPEÑO/
├── components/          # Componentes React
├── data/               # Datos de competencias y criterios
├── hooks/              # Hooks personalizados
├── services/           # Servicios API
├── server/             # Servidor backend
│   ├── database.js     # Configuración SQLite
│   ├── server.js       # Servidor Express
│   └── uploads/        # Archivos subidos
├── types.ts            # Tipos TypeScript
└── App.tsx             # Componente principal
```

## 🗄️ Base de Datos

La aplicación utiliza SQLite con las siguientes tablas:

- **workers**: Información de trabajadores
- **evaluations**: Evaluaciones por trabajador y período
- **criteria_checks**: Criterios evaluados
- **real_evidence**: Evidencia textual
- **evidence_files**: Archivos de evidencia
- **scores**: Puntuaciones calculadas

## 📤 Funcionalidades

### Gestión de Trabajadores
- Crear nuevos trabajadores
- Seleccionar trabajador para evaluar
- Lista de trabajadores existentes

### Evaluación por Competencias
- Evaluar criterios T1 y T2
- Añadir evidencia textual
- Adjuntar archivos de evidencia
- Cálculo automático de puntuaciones

### Archivos de Evidencia
- Subir múltiples archivos por competencia
- Formatos soportados: PDF, Word, Excel, PowerPoint, imágenes
- Límite de 10MB por archivo
- Vista previa y eliminación de archivos

### Exportación
- Exportar bloques de competencias a Excel
- Incluye puntuaciones y evidencia
- Nombres de archivos automáticos

## 🔧 Configuración

### Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:
```env
PORT=3001
```

### Base de Datos
La base de datos SQLite se crea automáticamente en `server/evaluations.db` al ejecutar el servidor por primera vez.

## 📝 Uso

1. **Crear Trabajador**: Hacer clic en "Nuevo Trabajador" y completar el formulario
2. **Seleccionar Trabajador**: Elegir un trabajador del menú desplegable
3. **Evaluar Competencias**: Navegar por los bloques de competencias usando el sidebar
4. **Añadir Evidencia**: 
   - Escribir evidencia textual en cada conducta
   - Adjuntar archivos usando el botón "Adjuntar Archivos de Evidencia"
5. **Guardar**: Los datos se guardan automáticamente en la base de datos
6. **Exportar**: Usar el botón "Exportar Bloque" para generar reportes Excel

## 🛡️ Seguridad

- Validación de tipos de archivo
- Límites de tamaño de archivo
- Sanitización de nombres de archivo
- CORS configurado para desarrollo

## 🔄 Persistencia

- Todos los datos se guardan automáticamente en SQLite
- Los archivos se almacenan en `server/uploads/evidence/`
- Las evaluaciones persisten entre sesiones
- Backup automático de la base de datos

## 🐛 Solución de Problemas

### Error de conexión al servidor
- Verificar que el servidor esté ejecutándose en puerto 3001
- Comprobar que no haya conflictos de puertos

### Error al subir archivos
- Verificar permisos de escritura en `server/uploads/`
- Comprobar tamaño del archivo (máx. 10MB)

### Base de datos corrupta
- Eliminar `server/evaluations.db` y reiniciar el servidor
- Se creará una nueva base de datos automáticamente

## 📄 Licencia

Este proyecto es de uso interno para evaluación de desempeño laboral.

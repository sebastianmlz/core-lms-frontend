# Visión general del frontend — core-lms-frontend

Este documento está pensado como guía operativa para que tú o un asistente automatizado (por ejemplo, Copilot) sigan desarrollando el frontend respetando la estructura actual. Incluye flujos detallados, cómo mapear endpoints del backend a clientes y stores, y pasos concretos para continuar el desarrollo.

## Rutas de los repos locales (para que Copilot las abra)
- Backend principal: `C:\dev\core-lms-backend`
- Microservicio de razonamiento: `C:\dev\axiom-reasoning-svc`
- Frontend: `C:\dev\core-lms-frontend`

Coloca estas rutas en la tarea del asistente para que abra y escanee cada repositorio y busque endpoints, documentación y `.md` orientativos.

## Comandos básicos
- Instalar dependencias:

  npm install

- Arrancar servidor de desarrollo:

  npm start

- Ejecutar tests:

  npm test

- Construir para producción:

  npm run build

Revisa `package.json` para scripts adicionales.

## Estructura principal (resumen rápido)

- `angular.json` — configuración del workspace.
- `src/main.ts` — bootstrap.
- `src/index.html`, `src/styles.css` — base y estilos globales.
- `tailwind.config.js` — configuración de Tailwind.
- `src/app/` — código de la aplicación (ver detalle abajo).
- `src/environments/` — configuración por entorno.

Dentro de `src/app/`:
- `app.ts`, `app.routes.ts`, `app.config.ts`: bootstrap y rutas.
- `entities/` (por dominio):
  - `<dominio>/api/*.api.ts` — funciones que llaman a endpoints HTTP.
  - `<dominio>/model/*.store.ts` y `*.types.ts` — stores y tipos del dominio.
- `features/` — componentes UI reutilizables.
- `pages/` — páginas completas del sitio.
- `shared/api/` — clientes HTTP y configuración (por ejemplo `django-api.client.ts`).
- `widgets/` — layout y componentes de alto nivel como `app-shell`.

## Flujos clave (detallados)

1) Autenticación (Login / Session)
- Qué buscar en backend:
  - En `C:\dev\core-lms-backend`, buscar archivos `urls.py`, `views.py`, `api.py`, `auth` o `rest_framework`.
  - Buscar endpoints tipo `/api/auth/login/`, `/api/session/`, `/api/token/refresh/` o similares.
- Qué hay en frontend:
  - `features/auth/login-form` (componente de formulario).
  - `pages/auth/login-page` (vista de página).
  - `entities/session/api/auth.api.ts` y `entities/session/model/session.store.ts`.
- Flujo:
  1. Usuario completa formulario en `login-form`.
  2. Componente llama a la función en `entities/session/api/auth.api.ts`.
  3. La respuesta (token/session) se guarda en `session.store.ts` o en `shared` (p. ej. cookie/localStorage mediante un servicio).
  4. Se configura un `Authorization` header global en el cliente HTTP (`shared/api/*`) via interceptor.
  5. Redirigir a la ruta inicial protegida.
- Qué debe automatizar Copilot:
  - Detectar el endpoint real en el backend (por ejemplo leyendo `urls.py` o docs OpenAPI).
  - Actualizar/crear la función cliente en `entities/session/api/auth.api.ts` con la URL correcta y payload tipado.
  - Asegurar que `session.store.ts` persista el token y exponga helpers `isAuthenticated()`.

2) Listado y detalle de cursos
- Qué buscar en backend:
  - Endpoints tipo `/api/courses/`, `/api/courses/<id>/` en `C:\dev\core-lms-backend`.
- Qué hay en frontend:
  - `entities/course/api/course.api.ts` y `entities/course/model/course.store.ts`.
  - Páginas/feature: `features/course/course-overview` y `pages/student/dashboard-page`.
- Flujo:
  1. Página solicita lista de cursos (llamando a `course.api.ts`).
  2. Respuesta se normaliza y guarda en `course.store.ts`.
  3. Componentes consumen el store y renderizan tarjetas/listados.
  4. Al hacer click en un curso, se navega a la ruta detalle que carga `/api/courses/<id>/`.
- Qué debe automatizar Copilot:
  - Comprobar autenticación requerida y añadir headers si aplica.
  - Generar/migrar funciones cliente con manejo de errores y cargas (loading states) en el store.
  - Añadir tests unitarios básicos para la store y el API client.

3) Flujo de razonamiento / microservicio (axiom-reasoning-svc)
- Qué buscar en microservicio:
  - `C:\dev\axiom-reasoning-svc`, busca `routes`, `api`, `controllers`, o `openapi`.
  - Encontrar endpoints que procesan peticiones de razonamiento (p. ej. `/api/reasoning/run/`, `/api/reasoning/status/`).
- Qué hay en frontend:
  - `entities/reasoning/api/reasoning.api.ts`, `entities/reasoning/model/reasoning.store.ts`.
- Flujo:
  1. Usuario inicia petición de razonamiento desde UI (formulario en `features/reasoning`).
  2. Frontend llama al endpoint del microservicio (directo o vía gateway del backend).
  3. Microservicio procesa y responde con resultado o job id.
  4. Si es asincrónico, frontend debe poll o subscribirse a `status` hasta que finalice.
- Qué debe automatizar Copilot:
  - Detectar si la comunicación debe hacerse contra el microservicio directo o a través del backend principal.
  - Añadir clientes con timeouts y manejo de jobs/colas (si aplica).

4) Estado de sesión y almacenamiento local
- Centralizar en `entities/session/model/session.store.ts` y `shared/api/interceptors`:
  - Guardar tokens y expiración.
  - Implementar refresh token flow si el backend lo soporta.

## Cómo debe actuar Copilot (checklist operativo)

1. Abrir los tres repos en las rutas locales indicadas y listar archivos con endpoints y documentación (`urls.py`, `views.py`, `serializers.py`, `openapi.json`, `swagger`, `README.md`).
2. Extraer la lista de endpoints REST y documentarlos en un archivo nuevo `docs/backend_endpoints.md` dentro del frontend (o en la raíz del backend si corresponde).
3. Para cada endpoint descubierto:
   - Mapearlo a `entities/<dominio>/api/<name>.api.ts` y crear/actualizar la función cliente con tipos de entrada/salida.
   - Si falta un `store` en `entities/<dominio>/model/`, generar un `*.store.ts` con acciones: `fetchAll`, `fetchOne`, `create`, `update`, `delete` según corresponda.
   - Añadir tests básicos en `entities/<dominio>/model/*.spec.ts` y `entities/<dominio>/api/*.spec.ts`.
4. Registrar/actualizar rutas en `src/app/app.routes.ts` para cualquier nueva página o vista necesaria.
5. Asegurar que `shared/api` contiene un cliente HTTP con interceptores para `Authorization`, manejo de errores global y logs (si no existe, generarlo).
6. Crear PRs pequeños por dominio/feature (branch por feature) y dejar mensajes claros en commits.

Comandos útiles que Copilot o tú pueden ejecutar localmente:

```bash
cd C:\dev\core-lms-backend
# buscar patrones comunes
grep -R "urlpatterns\|path(\|router.register\|openapi" -n .

cd C:\dev\axiom-reasoning-svc
grep -R "route\|openapi\|swagger\|controller\|router" -n .

cd C:\dev\core-lms-frontend
npm install
npm start
```

## Plantillas y convenciones sugeridas para generación automática

- Nombres de funciones cliente: `getCourses()`, `getCourse(id)`, `createCourse(payload)` — ubicadas en `entities/course/api/course.api.ts`.
- Nombres de stores: `course.store.ts` exportando métodos `loadAll()`, `load(id)`, `create()`, `update()` y selectores `getAll()`, `getById()`.
- Tests: usar archivos `*.spec.ts` en la misma carpeta del módulo.

## Ejemplo de tarea que puedes pasar a Copilot

- "Escanea `C:\dev\core-lms-backend` para endpoints REST relacionados con `course`. Crea `entities/course/api/course.api.ts` con funciones cliente tipadas, añade `entities/course/model/course.store.ts` que almacene el listado y la carga por id, y añade tests unitarios para la store. Registra la ruta del detalle del curso en `src/app/app.routes.ts` y crea la página `pages/course/detail` si falta. Haz commits y abre un branch `feat/course-api-client`."

## Recomendaciones para el desarrollo continuado

- Trabaja por dominios (course, session, reasoning). Cada PR debería contener cliente API + store + tests + cambios de UI mínimos.
- Mantén la consistencia de estilos: Tailwind para utilidades, PrimeNG para componentes cuando se quiera consistencia visual.
- Documenta cada endpoint nuevo en `docs/backend_endpoints.md` con la URL, método, parámetros y ejemplo de respuesta.
- Antes de crear UI, confirma con los autores del backend si existen contratos OpenAPI/Swagger exportables.

## Próximos pasos sugeridos (opciones)

- Puedo arrancar el frontend localmente y comprobar rutas y consola.
- Puedo escanear automáticamente `C:\dev\core-lms-backend` y `C:\dev\axiom-reasoning-svc` para generar `docs/backend_endpoints.md` inicial.
- Puedo generar plantillas de `api/*.api.ts` y `model/*.store.ts` para un dominio (elige `course`, `session` o `reasoning`).

---
Archivo actualizado para guiar la continuación del frontend y para que Copilot pueda usarlo como plan de trabajo: [FRONTEND_OVERVIEW.md](FRONTEND_OVERVIEW.md)

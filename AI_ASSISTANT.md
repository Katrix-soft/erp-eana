# 🤖 AI Assistant - Asistente Técnico CNS

## Descripción General

El AI Assistant es un asistente técnico inteligente especializado en sistemas CNS (Comunicaciones, Navegación y Vigilancia) de EANA. Utiliza Google Gemini AI para proporcionar asistencia técnica profesional a los técnicos de campo.

## 🎯 Características Principales

### Expertise Técnico
- **Radioayudas**: VHF, VOR, DME, ILS, NDB
- **Comunicaciones Aeronáuticas**: Sistemas de comunicación tierra-aire
- **Mantenimiento**: Preventivo, correctivo y predictivo
- **Normativas**: OACI Anexo 10, FAA Orders, RAAC
- **Diagnóstico**: Análisis de fallas y troubleshooting

### Capacidades
1. **Chat Conversacional**: Mantiene el contexto de la conversación
2. **Análisis Técnico**: Interpreta datos y mediciones
3. **Recomendaciones**: Sugiere procedimientos y soluciones
4. **Educación**: Explica conceptos técnicos y normativas
5. **Soporte de Decisiones**: Ayuda al técnico sin tomar decisiones por él

## 🏗️ Arquitectura

### Backend

#### Módulo: `ai-assistant`
```
backend/src/ai-assistant/
├── ai-assistant.module.ts      # Módulo NestJS
├── ai-assistant.controller.ts  # Endpoints REST
└── ai-assistant.service.ts     # Lógica de negocio con Gemini AI
```

#### Endpoints

**POST** `/api/v1/ai-assistant/chat`
- **Descripción**: Chat conversacional con contexto
- **Autenticación**: JWT requerido
- **Request Body**:
```json
{
  "messages": [
    { "role": "user", "content": "¿Cómo calibro un VOR?" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "¿Y las tolerancias?" }
  ]
}
```
- **Response**:
```json
{
  "success": true,
  "response": "Respuesta del asistente...",
  "timestamp": "2026-01-29T23:00:00.000Z"
}
```

**POST** `/api/v1/ai-assistant/quick-analysis`
- **Descripción**: Análisis rápido de equipos
- **Autenticación**: JWT requerido
- **Request Body**:
```json
{
  "equipmentType": "VOR",
  "issue": "Error de fase en azimut 090"
}
```

### Frontend

#### Componente: `ai-assistant`
```
frontend/src/app/shared/components/ai-assistant/
└── ai-assistant.component.ts   # Componente standalone
```

#### Características UI
- **Diseño**: Floating chat button en esquina inferior derecha
- **Animaciones**: Smooth transitions y loading indicators
- **Markdown**: Soporte para formato de texto enriquecido
- **Auto-scroll**: Scroll automático a nuevos mensajes
- **Responsive**: Adaptable a diferentes tamaños de pantalla

## 🔒 Seguridad

### Autenticación
- Todos los endpoints requieren JWT válido
- El componente solo se muestra cuando el usuario está autenticado
- No aparece en la página de login

### Sanitización
- Los mensajes HTML son sanitizados con `DomSanitizer`
- Prevención de XSS en contenido renderizado

## 🧠 Prompt Engineering

### System Prompt
El asistente está configurado con un prompt detallado que define:

1. **Rol**: Asistente Técnico Senior CNS de EANA
2. **Expertise**: Conocimientos técnicos específicos
3. **Responsabilidades**: Qué debe y no debe hacer
4. **Áreas de Conocimiento**: Sistemas específicos
5. **Estilo de Comunicación**: Tono profesional y accesible
6. **Limitaciones**: Reconoce cuando escalar a ingeniería

### Configuración Gemini
```typescript
{
  model: 'gemini-1.5-flash',
  temperature: 0.7,      // Balance creatividad/precisión
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048  // Respuestas detalladas
}
```

## 📋 Ejemplos de Uso

### Consulta Técnica
```
Usuario: "Tengo un VOR con error de +3.5° en azimut 090"

Asistente: "⚠️ **Análisis de Situación**

El error de +3.5° supera la tolerancia estándar de ±2.0° para VOR.

🔍 **Posibles Causas:**
• Desajuste de fase entre señales REF y VAR
• Interferencia electromagnética en el cuadrante Este
• Problema en el sistema de antenas

🔧 **Recomendaciones:**
1. Verificar la calibración de fase en 090°
2. Revisar el sistema de tierra y conexiones
3. Realizar medición en azimuts adyacentes (080°, 100°)
4. Consultar el manual de mantenimiento del fabricante

📋 **Normativa:** OACI Anexo 10, Vol I - Tolerancia ±2.0°"
```

### Procedimiento
```
Usuario: "¿Cómo realizo el mantenimiento preventivo de un VHF?"

Asistente: "📋 **Mantenimiento Preventivo VHF**

✅ **Inspección Visual:**
• Estado de conectores y cables
• Ventilación del equipo
• Indicadores LED de estado

🔧 **Verificaciones Técnicas:**
• Potencia de salida (típicamente 25W)
• VSWR < 1.5:1
• Modulación 85% ±5%
• Frecuencias dentro de banda 118-137 MHz

📊 **Mediciones:**
• Usar analizador de espectro
• Verificar armónicos
• Comprobar sensibilidad del receptor

⏱️ **Periodicidad:** Cada 3 meses o según fabricante"
```

## 🚀 Deployment

### Variables de Entorno Requeridas

```env
# Backend (.env)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Instalación de Dependencias

```bash
# Backend
cd backend
npm install @google/generative-ai

# Frontend (ya incluido en Angular)
# No requiere dependencias adicionales
```

## 📊 Métricas y Logs

### Logs del Backend
```
✅ AI Assistant Service initialized with Gemini API
💬 Chat request received with 3 messages
✅ AI response generated (1247 chars)
```

### Manejo de Errores
- **API Key inválida**: Mensaje específico al usuario
- **Timeout**: Retry automático (configurado en Gemini)
- **Rate Limiting**: Manejado por el servicio de Gemini
- **Sesión expirada**: Redirección a login

## 🎨 Personalización

### Modificar el Prompt
Editar `backend/src/ai-assistant/ai-assistant.service.ts`:
```typescript
const systemPrompt = `
  // Personalizar el rol, expertise, etc.
`;
```

### Cambiar el Modelo
```typescript
const model = this.genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro',  // Modelo más potente
  // ...
});
```

### Ajustar UI
Editar el template en `ai-assistant.component.ts`:
- Colores del tema
- Tamaño de la ventana de chat
- Posición del botón flotante

## 🔄 Roadmap

### Próximas Mejoras
- [ ] Historial de conversaciones persistente
- [ ] Búsqueda en documentación técnica (RAG)
- [ ] Análisis de imágenes de equipos
- [ ] Integración con sistema de tickets
- [ ] Sugerencias proactivas basadas en contexto del usuario
- [ ] Modo offline con respuestas cacheadas
- [ ] Exportar conversaciones a PDF
- [ ] Feedback de utilidad de respuestas

## 📚 Referencias

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [OACI Anexo 10](https://www.icao.int/safety/airnavigation/nationalitymarks/annexes_booklet_en.pdf)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Angular Standalone Components](https://angular.io/guide/standalone-components)

## 🤝 Contribución

Para agregar nuevas capacidades al asistente:

1. Actualizar el `systemPrompt` en `ai-assistant.service.ts`
2. Agregar ejemplos específicos en el prompt
3. Testear con casos de uso reales
4. Documentar en este archivo

## 📞 Soporte

Para problemas con el AI Assistant:
- Verificar que `GEMINI_API_KEY` esté configurada
- Revisar logs del backend para errores de API
- Confirmar que el usuario está autenticado
- Verificar conectividad con Google AI

---

**Última actualización**: 2026-01-29
**Versión**: 1.0.0
**Autor**: Equipo de Desarrollo ERP EANA

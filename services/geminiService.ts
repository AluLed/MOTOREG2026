import { GoogleGenAI } from "@google/genai";
import { Participant } from '../types';

export const analyzeRegistrations = async (participants: Participant[]): Promise<string> => {
  if (participants.length === 0) {
    return "No hay participantes registrados para analizar.";
  }

  // Validar si la API Key está disponible en el entorno del navegador
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("Gemini Error: API_KEY no configurada en el entorno.");
    return "Error: La llave de IA (API_KEY) no está configurada. Si estás en Vercel, asegúrate de haberla agregado en las variables de entorno del proyecto.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Crear un resumen simplificado de los datos
  const dataSummary = participants.map(p => 
    `- Cat: ${p.category}, Res: ${p.residence}`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Actúa como un organizador de eventos deportivos experto. Analiza la siguiente lista de participantes para una carrera de motocross/enduro.
        
        Datos de los participantes (Categoría y Residencia):
        ${dataSummary}
        
        Por favor, genera un resumen ejecutivo breve (máximo 150 palabras) en español que incluya:
        1. ¿Cuál es la categoría más competitiva (con más inscritos)?
        2. Diversidad geográfica (de dónde vienen la mayoría).
        3. Una sugerencia logística basada en estos datos.
        
        Mantén un tono profesional y motivador.
      `,
      config: {
        temperature: 0.7,
        topP: 0.95,
        thinkingConfig: { thinkingBudget: 0 } // Desactivar thinking para respuesta rápida y ahorro de tokens
      }
    });

    return response.text || "No se pudo generar el análisis. El modelo devolvió una respuesta vacía.";
  } catch (error: any) {
    console.error("Error al llamar a Gemini API:", error);
    
    if (error.message?.includes('403') || error.message?.includes('API_KEY_INVALID')) {
      return "Error: La API Key es inválida o no tiene permisos para usar Gemini 3 Flash.";
    }
    
    return `Error de conexión con la IA: ${error.message || "Error desconocido"}. Revisa la consola para más detalles.`;
  }
};
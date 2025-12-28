import { GoogleGenAI } from "@google/genai";
import { Participant } from '../types.ts';

const getApiKey = () => {
  try {
    // Si process.env está disponible (inyectado por Vercel o bundler)
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

export const analyzeRegistrations = async (participants: Participant[]): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "El servicio de IA no está configurado (Falta API_KEY en las variables de entorno de Vercel).";
  }

  if (participants.length === 0) {
    return "No hay participantes registrados para analizar.";
  }

  // Inicializar dentro de la función para asegurar que tome la última API_KEY disponible
  const ai = new GoogleGenAI({ apiKey });

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
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Hubo un error al conectar con la IA de análisis. Verifica tu API Key.";
  }
};
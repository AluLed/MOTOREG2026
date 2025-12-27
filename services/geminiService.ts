import { GoogleGenAI } from "@google/genai";
import { Participant } from '../types';

// Initialize Gemini
// Ensure process.env.API_KEY is available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeRegistrations = async (participants: Participant[]): Promise<string> => {
  if (participants.length === 0) {
    return "No hay participantes registrados para analizar.";
  }

  // Create a simplified list for the prompt to save tokens
  const dataSummary = participants.map(p => 
    `- Cat: ${p.category}, Res: ${p.residence}`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Actúa como un organizador de eventos deportivos experto. Analiza la siguiente lista de participantes para una carrera de motocross/enduro.
        
        Datos de los participantes (Categoría y Residencia):
        ${dataSummary}
        
        Por favor, genera un resumen ejecutivo breve (máximo 150 palabras) en español que incluya:
        1. ¿Cuál es la categoría más competitiva (con más inscritos)?
        2. Diversidad geográfica (de dónde vienen la mayoría).
        3. Una sugerencia logística basada en estos datos (ej. si hay muchos novatos, sugerir más seguridad en zonas fáciles).
        
        Mantén un tono profesional y motivador.
      `,
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Hubo un error al conectar con la IA de análisis. Verifica tu API Key.";
  }
};
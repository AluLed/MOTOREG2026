import { GoogleGenAI } from "@google/genai";
import { Participant } from '../types';

export const analyzeRegistrations = async (participants: Participant[]): Promise<string> => {
  if (participants.length === 0) {
    return "No hay participantes registrados para analizar.";
  }

  // Fix: Initializing GoogleGenAI inside the function to ensure it has access to 
  // the latest API key and avoids potential initialization issues during module load.
  // Always use new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Create a simplified list for the prompt to save tokens
  const dataSummary = participants.map(p => 
    `- Cat: ${p.category}, Res: ${p.residence}`
  ).join('\n');

  try {
    // Use gemini-3-flash-preview for basic text tasks like summarization
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

    // Directly access the .text property of GenerateContentResponse
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Hubo un error al conectar con la IA de análisis. Verifica tu API Key.";
  }
};
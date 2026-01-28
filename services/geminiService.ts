
import { GoogleGenAI } from "@google/genai";
import { WaterParameters, CalculationResults } from "../types";

export const analyzeWaterProfile = async (params: WaterParameters, results: CalculationResults) => {
  // Initialize the AI client inside the function to ensure the API key is available
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const prompt = `
      As a water chemistry expert, analyze the following water profile and provide engineering recommendations.
      
      INPUTS:
      - pH: ${params.pH}
      - Temperature: ${params.temp}°C
      - TDS: ${params.tds} mg/L
      - Calcium Hardness: ${params.calcium} mg/L as CaCO3
      - Total Alkalinity: ${params.alkalinity} mg/L as CaCO3
      
      CALCULATED RESULTS:
      - Langelier Saturation Index (LSI): ${results.lsi.toFixed(2)}
      - CCPP (Precipitation Potential): ${results.ccpp.toFixed(2)} mg/L as CaCO3
      - Saturation State: ${results.saturationCondition}
      
      Explain the implications for plumbing (scaling vs. corrosion), health, and potential treatment strategies to stabilize this water. Keep the tone professional and technical.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly access .text property as per guidelines
    return response.text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error?.message?.includes("API key")) {
      return "The Gemini API key is missing or invalid. Please check your environment configuration.";
    }
    return "An error occurred while generating the AI analysis. Please try again later.";
  }
};

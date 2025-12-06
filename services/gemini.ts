
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// We create a new instance per call to ensure we pick up the latest env var if it changes via window.aistudio
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Chat Tutor (Gemini 3 Pro for quality) ---
export const createChatSession = (systemInstruction?: string): Chat => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: systemInstruction || "You are an expert physics tutor named 'Quantum'. You explain complex concepts simply, use metaphors, and encourage scientific curiosity. You are helpful, patient, and precise.",
    },
  });
};

// --- Fast Response (Flash Lite) ---
export const getFastResponse = async (prompt: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest', // Explicit mapping for lite
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Fast response error:", error);
    throw error;
  }
};

// --- Deep Thinking (Gemini 3 Pro + Thinking Budget) ---
export const solveComplexProblem = async (problem: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: problem,
      config: {
        thinkingConfig: {
          thinkingBudget: 32768, // Max for Gemini 3 Pro
        },
      },
    });
    return response.text || "I could not solve this problem.";
  } catch (error) {
    console.error("Deep thinking error:", error);
    throw error;
  }
};

// --- Search Grounding (Flash + Google Search) ---
export const searchPhysicsTopic = async (query: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    return {
      text: response.text || "",
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// --- Veo Video Generation ---
export const generatePhysicsVideo = async (
  prompt: string, 
  imageBase64: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> => {
  const ai = getAI();
  
  try {
    // 1. Initiate Generation
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imageBase64,
        mimeType: 'image/png', // Assuming PNG for simplicity, could be derived
      },
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: aspectRatio
      }
    });

    // 2. Poll for completion
    // Note: In a real app, you might want to offload this or use a more robust polling hook
    while (!operation.done) {
      // Wait 5 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    // 3. Extract URI
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation completed but no URI found.");
    }
    
    return downloadLink;
  } catch (error) {
    console.error("Veo generation error:", error);
    throw error;
  }
};

// --- Lab Assistant Analysis (Gemini 2.5 Flash for speed/quality balance) ---
export const analyzeExperimentData = async (
  experimentName: string,
  setupParams: any,
  dataSummary: string
): Promise<string> => {
  const ai = getAI();
  const prompt = `
    You are an AI Physics Lab Assistant.
    Experiment: ${experimentName}
    Setup Parameters: ${JSON.stringify(setupParams)}
    Observed Data Summary: ${dataSummary}

    Please provide a concise analysis of the results.
    1. Check if the results match theoretical expectations.
    2. Explain any potential sources of error (friction, measurement error).
    3. Use a simple metaphor to explain the key concept observed.
    4. Keep the tone warm, encouraging, and scientific.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Analysis complete, but no text generated.";
  } catch (error) {
    console.error("Analysis error:", error);
    return "I couldn't analyze the data at this moment. Please check your connection.";
  }
};

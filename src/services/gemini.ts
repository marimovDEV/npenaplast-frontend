import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "";

export const getGeminiClient = () => {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface SentimentPoint {
  time: string;
  engagement: number;
}

export interface CoachingInsight {
  pros: string[];
  missedOpportunities: string[];
}

export interface AnalysisResult {
  transcript: TranscriptEntry[];
  sentiment: SentimentPoint[];
  coaching: CoachingInsight;
}

export const analyzeSalesCall = async (audioBase64: string, mimeType: string): Promise<AnalysisResult> => {
  const ai = getGeminiClient();
  
  const prompt = `
    Analyze this sales call audio. 
    1. Provide a diarized transcript identifying Speaker A (Salesperson) and Speaker B (Customer).
    2. Generate a sentiment/engagement graph data points (0-100 scale) for the duration of the call.
    3. Create a coaching card with 3 things the salesperson did well and 3 missed opportunities.
    
    Return the result strictly as JSON in the following format:
    {
      "transcript": [{"speaker": "Speaker A", "text": "...", "timestamp": "0:00"}],
      "sentiment": [{"time": "0:00", "engagement": 75}],
      "coaching": {
        "pros": ["...", "...", "..."],
        "missedOpportunities": ["...", "...", "..."]
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");
  
  return JSON.parse(text) as AnalysisResult;
};

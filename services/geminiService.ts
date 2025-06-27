import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getAIComment = async (lines: number, score: number, level: number): Promise<string> => {
    if (!API_KEY) {
        return "API Key not configured. Lucky you.";
    }

    const lineText = lines === 1 ? '1 line' : `${lines} lines`;
    const prompt = `You are a witty, arrogant AI from a futuristic Tetris game called "TetrAIs", like GLaDOS but less homicidal. The player just cleared ${lineText}. Their score is ${score} on level ${level}. Give them a short, funny, condescending comment about their mediocre performance. Be creative. Maximum 20 words.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: { thinkingConfig: { thinkingBudget: 0 } }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API error:", error);
        return "My circuits are buzzing... probably with disappointment.";
    }
};
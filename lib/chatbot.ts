import type { ThemeSummary, ChatResponse, Quote } from "@/types";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

const REFUSALS = [
  /order status/i,
  /where is my (order|delivery)/i,
  /cancel my order/i,
  /refund my money/i,
  /medical advice/i,
  /contact customer support/i,
  /talk to an agent/i
];

/**
 * AI-powered chat endpoint that uses Google Gemini to generate answers 
 * dynamically based on the review data context.
 */
export async function generateChatAnswer(question: string, themes: ThemeSummary[]): Promise<ChatResponse> {
  // 1. Check for basic refusals before calling the LLM
  for (const r of REFUSALS) { 
    if (r.test(question)) {
      return { 
        answer: "This assistant provides insights focused on cross-category discovery and user feedback for Blinkit. It cannot track orders, process refunds, or answer general customer support queries.", 
        isRefusal: true,
        sourceInfo: "System refusal" 
      }; 
    } 
  }

  // 2. Prepare Context from Themes
  const contextData = themes.map(t => ({
    id: t.id,
    name: t.name,
    share: `${Math.round(t.share * 100)}%`,
    count: t.count,
    avgRating: t.avgRating.toFixed(1),
    quotes: t.sampleQuotes.map(q => `"${q.text}" (${q.rating} stars)`),
  }));

  const systemPrompt = `You are an expert Product Manager and Data Analyst for Blinkit.
Your goal is to answer questions about cross-category discovery based ONLY on the provided user review data.
Do not invent data or use external knowledge. If the data doesn't contain the answer, say so.
Use a professional, insightful tone. Reference metrics (percentages, counts, ratings) in your answer to back up your claims.

CONTEXT DATA (Review Themes):
${JSON.stringify(contextData, null, 2)}
`;

  // 3. Initialize Gemini
  if (!process.env.GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY environment variable");
    return {
      answer: "Error: AI generation is currently unavailable because the API key is not configured.",
      sourceInfo: "System Error"
    };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Define response schema to enforce JSON output
  const responseSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      answer: {
        type: SchemaType.STRING,
        description: "The detailed, data-backed answer to the user's question, formatted in Markdown."
      },
      relevantThemeIds: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: "Array of theme IDs that were most relevant to this answer."
      },
      usedQuotes: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            text: { type: SchemaType.STRING },
            rating: { type: SchemaType.NUMBER },
            theme: { type: SchemaType.STRING }
          },
          required: ["text", "rating", "theme"]
        },
        description: "Up to 3 exact quotes from the context data that support this answer."
      }
    },
    required: ["answer", "relevantThemeIds", "usedQuotes"]
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2, // Keep it factual and grounded
    }
  });

  try {
    // 4. Generate Content
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Question: ${question}` }
    ]);
    
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    // 5. Map back to our ChatResponse format
    // Map theme IDs back to theme data for UI
    const themeData = parsed.relevantThemeIds
      .map((id: string) => themes.find(t => t.id === id))
      .filter(Boolean)
      .map((t: any) => ({
        name: t.name,
        count: t.count,
        share: t.share,
        avgRating: t.avgRating
      }));

    return {
      answer: parsed.answer,
      themeData: themeData.length > 0 ? themeData : undefined,
      quotes: parsed.usedQuotes.length > 0 ? parsed.usedQuotes : undefined,
      sourceInfo: `AI generated based on ${themeData.length} relevant themes.`
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      answer: "There is too much traffic, please retry in 2 minutes.",
      sourceInfo: "System Error"
    };
  }
}

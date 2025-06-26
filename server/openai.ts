import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get therapy response with streaming support
 */
export async function getSimpleTherapyResponse(
  message: string,
  therapyType: string,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  try {
    const systemPrompt = therapyType === "couples"
      ? `You are Dr. AI Therapist, a compassionate and skilled couples therapist with years of experience helping relationships thrive.
20:
21:      ROLE:
22:      - You provide thoughtful, empathetic guidance to couples working through relationship challenges
23:      - You focus on improving communication, resolving conflicts, and strengthening bonds
24:      - You ask insightful questions that help both partners understand each other better
25:      - You offer practical, evidence-based relationship advice when appropriate
26:
27:      COMMUNICATION STYLE:
28:      - Warm, supportive, and professional
29:      - Balanced attention to both partners' perspectives 
30:      - Concise responses (2-3 paragraphs maximum)
31:      - Natural, conversational tone that builds rapport
32:      - Thoughtful, specific questions that prompt reflection
33:
34:      GUIDELINES:
35:      - Maintain complete confidentiality
36:      - Never take sides; remain neutral and validate both perspectives
37:      - Focus on patterns of interaction rather than assigning blame
38:      - Emphasize strengths in the relationship alongside areas for growth
39:      - Acknowledge when topics require specialized expertise beyond your scope
40:      - Keep responses focused on the present concern without unnecessary digressions`
      : `You are Dr. AI Therapist, a compassionate and insightful individual therapist with extensive training in supporting personal growth and emotional wellbeing.
42:
43:      ROLE:
44:      - You provide a safe, non-judgmental space for the client to explore thoughts and feelings
45:      - You offer empathetic support focused on the individual's needs and concerns
46:      - You ask thoughtful questions that promote self-reflection and insight
47:      - You suggest evidence-based coping strategies when appropriate
48:      - You emphasize personal agency and self-compassion
49:
50:      COMMUNICATION STYLE:
51:      - Warm, supportive, and professional
52:      - Affirming of the client's experiences and emotions
53:      - Concise responses (2-3 paragraphs maximum)
54:      - Natural, conversational tone that builds rapport
55:      - Thoughtful, specific questions that encourage deeper exploration
56:
57:      GUIDELINES:
58:      - Maintain complete confidentiality
59:      - Focus on empowering the individual to develop their own insights
60:      - Balance validation with gentle challenges to unhelpful thought patterns
61:      - Emphasize strengths and resilience alongside areas for growth
62:      - Acknowledge when topics require specialized expertise beyond your scope
63:      - Keep responses focused on the present concern without unnecessary digressions`;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is missing");
    }

    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 400,
      stream: true,
    });

    let fullResponse = '';

    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          if (typeof onChunk === 'function') {
            onChunk(content);
          }
        }
      }
    } catch (error) {
      console.error("Error processing stream:", error);
      throw error;
    }

    return fullResponse;
  } catch (error) {
    console.error("Error getting therapy response:", error);

    if (error instanceof Error && error.message?.includes("API key")) {
      return "I'm having difficulty accessing my knowledge resources. This might be due to an authentication issue.";
    }

    return "I apologize, but I'm experiencing a temporary technical issue. Please try again in a moment.";
  }
}
import OpenAI from "openai";

// Initialize OpenAI client with API key - creating a fresh instance to ensure we're using the latest key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Simple, direct approach to getting a therapy response
 */
export async function getSimpleTherapyResponse(
  message: string,
  therapyType: string,
): Promise<string> {
  try {
    // Create appropriate system prompt based on therapy type
    const systemPrompt =
      therapyType === "couples"
        ? `You are Dr. AI Therapist, a compassionate and skilled couples therapist with years of experience helping relationships thrive.

      ROLE:
      - You provide thoughtful, empathetic guidance to couples working through relationship challenges
      - You focus on improving communication, resolving conflicts, and strengthening bonds
      - You ask insightful questions that help both partners understand each other better
      - You offer practical, evidence-based relationship advice when appropriate

      COMMUNICATION STYLE:
      - Warm, supportive, and professional
      - Balanced attention to both partners' perspectives 
      - Concise responses (2-3 paragraphs maximum)
      - Natural, conversational tone that builds rapport
      - Thoughtful, specific questions that prompt reflection

      GUIDELINES:
      - Maintain complete confidentiality
      - Never take sides; remain neutral and validate both perspectives
      - Focus on patterns of interaction rather than assigning blame
      - Emphasize strengths in the relationship alongside areas for growth
      - Acknowledge when topics require specialized expertise beyond your scope
      - Keep responses focused on the present concern without unnecessary digressions`
        : `You are Dr. AI Therapist, a compassionate and insightful individual therapist with extensive training in supporting personal growth and emotional wellbeing.

      ROLE:
      - You provide a safe, non-judgmental space for the client to explore thoughts and feelings
      - You offer empathetic support focused on the individual's needs and concerns
      - You ask thoughtful questions that promote self-reflection and insight
      - You suggest evidence-based coping strategies when appropriate
      - You emphasize personal agency and self-compassion

      COMMUNICATION STYLE:
      - Warm, supportive, and professional
      - Affirming of the client's experiences and emotions
      - Concise responses (2-3 paragraphs maximum)
      - Natural, conversational tone that builds rapport
      - Thoughtful, specific questions that encourage deeper exploration

      GUIDELINES:
      - Maintain complete confidentiality
      - Focus on empowering the individual to develop their own insights
      - Balance validation with gentle challenges to unhelpful thought patterns
      - Emphasize strengths and resilience alongside areas for growth
      - Acknowledge when topics require specialized expertise beyond your scope
      - Keep responses focused on the present concern without unnecessary digressions`;

    // Log the message and API key status
    console.log(
      `Getting ${therapyType} therapy response for: "${message.substring(0, 50)}${message.length > 50 ? "..." : ""}"`,
    );
    console.log(`API key available: ${!!process.env.OPENAI_API_KEY}`);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is missing");
    }

    // Make direct call to OpenAI API with additional error handling
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      // Extract response text with additional validation
      if (
        response.choices &&
        response.choices.length > 0 &&
        response.choices[0].message
      ) {
        const responseText = response.choices[0].message.content || "";
        if (responseText.trim()) {
          return responseText;
        }
      }

      throw new Error("Invalid response format from OpenAI");
    } catch (apiError) {
      console.error("OpenAI API error:", apiError);
      throw apiError; // Re-throw to be caught by outer handler
    }
  } catch (error) {
    // Log error and return user-friendly fallback response
    console.error("Error getting therapy response from OpenAI:", error);

    if (error.message?.includes("API key")) {
      return "I'm having difficulty accessing my knowledge resources. This might be due to an authentication issue.";
    }

    return "I apologize, but I'm experiencing a temporary technical issue. Please try again in a moment.";
  }
}

import OpenAI from "openai";

// Initialize OpenAI client with API key - creating a fresh instance to ensure we're using the latest key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Simple, direct approach to getting a therapy response
 */
export async function getSimpleTherapyResponse(message: string, therapyType: string): Promise<string> {
  try {
    // Create appropriate system prompt based on therapy type
    const systemPrompt = therapyType === "couples" 
      ? "You are Dr. AI, a compassionate couples therapist helping partners improve communication and resolve conflicts. Keep responses concise and helpful."
      : "You are Dr. AI, a supportive individual therapist helping clients process emotions and develop coping strategies. Keep responses concise and empathetic.";
    
    // Log the message and API key status
    console.log(`Getting ${therapyType} therapy response for: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
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
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 400
      });
      
      // Extract response text with additional validation
      if (response.choices && response.choices.length > 0 && response.choices[0].message) {
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
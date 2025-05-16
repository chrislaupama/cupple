import OpenAI from "openai";

// Simple OpenAI client setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Direct OpenAI integration - simplified for reliability
 */
export async function getTherapyResponse(message: string, type: string): Promise<string> {
  try {
    console.log(`Getting therapy response for message: "${message.substring(0, 30)}..."`);
    
    // Create a simple therapy prompt
    const systemPrompt = type === "couples" 
      ? "You are a compassionate couples therapist. Respond with empathy and practical advice for relationship issues."
      : "You are a supportive individual therapist. Respond with empathy and insight to help the client process their thoughts and feelings.";
    
    // Make a direct call to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    
    // Return the response text
    return completion.choices[0].message.content || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "I'm sorry, but I'm experiencing technical difficulties at the moment. Please try again shortly.";
  }
}
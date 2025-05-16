import OpenAI from "openai";

// Initialize OpenAI client with API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Function to generate AI therapist response
export async function generateTherapyResponse(userMessage: string, sessionType: "couples" | "private") {
  try {
    // Create appropriate system prompt based on therapy type
    const systemPrompt = sessionType === "couples"
      ? "You are Dr. AI, a compassionate couples therapist helping partners improve communication and resolve conflicts."
      : "You are Dr. AI, a supportive individual therapist helping clients process emotions and develop coping strategies.";
    
    console.log(`Generating ${sessionType} therapy response for: "${userMessage.substring(0, 50)}..."`);
    
    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // The newest OpenAI model as of May 2024
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    
    // Extract and return the response text
    const responseText = response.choices[0].message.content || 
      "I'm sorry, I'm having trouble responding right now.";
    
    return responseText;
  } catch (error) {
    console.error("Error generating therapy response:", error);
    return "I apologize, but I'm experiencing technical difficulties at the moment. Let's try again shortly.";
  }
}
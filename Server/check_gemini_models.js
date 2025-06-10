// C:\Users\OKKKK\Desktop\G-Press 1\G-Press\Server\check_gemini_models.js

require("dotenv").config({ path: "./.env" }); // Ensure .env is loaded

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not set in your .env file.");
    console.error(
      "Please ensure you have MONGODB_URI and GEMINI_API_KEY in your .env file."
    );
    return;
  }

  try {
    console.log("Initializing GoogleGenerativeAI client with API Key...");
    const genAI = new GoogleGenerativeAI(apiKey);

    console.log("Attempting to get 'gemini-pro' model object...");
    // Try to get a specific model (gemini-pro)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log("Successfully retrieved 'gemini-pro' model object.");

    // Now, attempt a simple generateContent call to truly test connectivity
    console.log(
      "Attempting to generate content with 'gemini-pro' (asking for 'hello' in 3 words)..."
    );
    const result = await model.generateContent("Say 'hello' in 3 words.");
    const response = await result.response;
    const text = response.text();
    console.log("Generated content successfully:", text);
    console.log("\nGemini API test PASSED!");
  } catch (error) {
    console.error("\nError during Gemini API test:", error.message);
    if (error.response && error.response.status) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Status Text: ${error.response.statusText}`);
      console.error(`Error Details: ${JSON.stringify(error.response.data)}`);
    }

    if (error.status === 401 || error.status === 403) {
      console.error(
        "Authentication/Permission Error (401/403): Your API Key might be invalid, expired, or unauthorized."
      );
      console.error(
        "Please generate a new API Key from https://aistudio.google.com/app/apikey and update your .env file."
      );
    } else if (error.status === 404) {
      console.error(
        "Model Not Found Error (404): This usually means the model name ('gemini-pro') is incorrect or not available for your API key/region."
      );
      console.error(
        "If you continue to get 404s for 'gemini-pro', you might need to try 'gemini-1.0-pro' in ai.js, or check Google AI Studio for available models specific to your account."
      );
    } else if (error.status === 500) {
      console.error(
        "Internal Server Error (500): This indicates a problem on Google's side. Try again later."
      );
    } else if (error.message.includes("is not a function")) {
      console.error(
        "Still getting 'is not a function' error. This is highly unusual after a clean install. Ensure your Node.js installation is healthy and try restarting your computer."
      );
    } else {
      console.error(
        "Other network or API error. Check your internet connection or Google Cloud status."
      );
    }
    console.log("\nGemini API test FAILED.");
  }
}

testGeminiAPI();

import { GoogleGenerativeAI } from '@google/generative-ai';

const listModels = async () => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.CHATBOT_API_KEY}`);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
listModels();

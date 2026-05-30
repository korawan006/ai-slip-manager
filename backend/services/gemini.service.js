import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// TODO: REMOVE THIS - temporary debug to verify API key
console.log('[DEBUG] GEMINI_API_KEY starts with:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const extractSlipData = async (mimeType, base64Data) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an AI trained to extract data from Thai bank transfer slips (e-slips).
      Please analyze this image and extract the following information in JSON format:
      - amount (number)
      - date (YYYY-MM-DD)
      - time (HH:mm)
      - senderName (string - ชื่อคนโอน / ผู้โอน / sender name)
      - senderBank (string)
      - receiverBank (string)
      - referenceNo (string)
      
      Only output the JSON object, nothing else. Do not wrap in markdown blocks.
    `;

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    let text = response.text();
    
    // Clean up Markdown formatting if any
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Error in Gemini OCR:', error);
    throw new Error('Failed to extract data from slip');
  }
};

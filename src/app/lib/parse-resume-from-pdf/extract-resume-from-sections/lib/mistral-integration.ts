import { pipeline } from '@xenova/transformers';
import { PARSER_CONFIG } from "../../config";

const HF_TOKEN = process.env.NEXT_PUBLIC_HUGGING_FACE_TOKEN;

export class MistralModelClient {
  private model: any = null;
  private cache: Map<string, {response: string, timestamp: number}> = new Map();
  
  async initialize() {
    if (!this.model) {
      if (typeof window !== 'undefined') {
        const { pipeline } = await import('@xenova/transformers');
        this.model = await pipeline('text-generation', 'Xenova/LaMini-GPT-1.5B', {
          quantized: true
        });
      }
    }
  }

  async generate(prompt: string): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('Mistral model can only be used in browser');
    }

    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          headers: { 
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json'
          },
          method: "POST",
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 2048,
              temperature: PARSER_CONFIG.model.temperature,
              return_full_text: false,
              max_length: 4096
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return result[0].generated_text || '';
    } catch (error) {
      console.error('Mistral API error:', error);
      return '';
    }
  }
} 
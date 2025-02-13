import type { ResumeWorkExperience } from "lib/redux/types";
import { PARSER_CONFIG } from "../../config";
import { MistralModelClient } from "./mistral-integration";

export class MistralWorkExperienceParser {
  private model: MistralModelClient;

  constructor() {
    this.model = new MistralModelClient();
  }

  private readonly prompt = `Extract ALL work experiences from the text and format as a JSON array. Include all bullet points as descriptions.

Text: {text}

Required format:
[
  {
    "company": "Company Name",
    "jobTitle": "Job Title",
    "date": "Start Date to End Date",
    "descriptions": ["Description 1", "Description 2"]
  },
  {
    "company": "Another Company",
    "jobTitle": "Another Title",
    "date": "Start Date to End Date",
    "descriptions": ["Description 1", "Description 2"]
  }
]

JSON output:`;

  async parseWorkExperience(text: string): Promise<ResumeWorkExperience[]> {
    try {
      const response = await this.getMistralResponse(this.prompt.replace("{text}", text));
      console.log('Raw Mistral response:', response);
      
      if (!response) {
        console.warn('Empty response from Mistral');
        return [];
      }

      // Parse JSON response
      try {
        const parsed = JSON.parse(response.trim());
        console.log('Parsed response:', parsed);
        
        if (!Array.isArray(parsed)) {
          console.warn('Response is not an array');
          return [];
        }

        return parsed
          .filter(exp => exp && (exp.company || exp.jobTitle)) // Filter valid experiences
          .map(exp => ({
            company: exp.company || 'Unknown Company',
            jobTitle: exp.jobTitle || 'Unknown Title',
            date: exp.date || '',
            descriptions: Array.isArray(exp.descriptions) ? exp.descriptions : []
          }));

      } catch (error) {
        console.error('Failed to parse Mistral response:', response);
        return [];
      }
    } catch (error) {
      console.error("Failed to parse work experience:", error);
      return [];
    }
  }

  private async getMistralResponse(prompt: string): Promise<string> {
    const output = await this.model.generate(prompt);
    
    if (!output) {
      console.warn('Empty response from model');
      return '';
    }

    return output; 
  }
} 
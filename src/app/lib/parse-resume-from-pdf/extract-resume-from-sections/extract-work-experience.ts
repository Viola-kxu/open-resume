import type { ResumeWorkExperience } from "lib/redux/types";
import type { ResumeSectionToLines } from "lib/parse-resume-from-pdf/types";
import { getSectionLinesByKeywords } from "./lib/get-section-lines";
import { divideSectionIntoSubsections } from "./lib/subsections";
import { MistralWorkExperienceParser } from "./lib/mistral-parser";

const WORK_EXPERIENCE_KEYWORDS_LOWERCASE = [
  "work experience",
  "experience",
  "employment",
  "work history",
];

export const extractWorkExperience = async (sections: ResumeSectionToLines) => {
  const allWorkExperiences: ResumeWorkExperience[] = [];
  const lines = getSectionLinesByKeywords(sections, WORK_EXPERIENCE_KEYWORDS_LOWERCASE);
  
  const subsections = divideSectionIntoSubsections(lines);
  console.log('Divided into subsections at work experience:', subsections);

  // Initialize Mistral parser
  const mistralParser = new MistralWorkExperienceParser();

  for (const subsectionLines of subsections) {
    const subsectionText = subsectionLines
      .flat()
      .map(item => item.text)
      .join(" ");

    console.log('\n=== Processing Work Experience Subsection ===');
    console.log('Input text to Mistral:', subsectionText);
    
    try {
      const parsedExperiences = await parseWorkExperienceText(subsectionText);
      
      console.log('Mistral parser output:', parsedExperiences);
      
      if (parsedExperiences.length > 0) {
        parsedExperiences.forEach(exp => {
          allWorkExperiences.push(exp);
          console.log('Successfully extracted work experience:', {
            company: exp.company,
            jobTitle: exp.jobTitle,
            date: exp.date,
            descriptionsCount: exp.descriptions.length
          });
        });
      } else {
        console.warn('No work experiences found in subsection');
      }
    } catch (error) {
      console.error('Error processing subsection:', error);
    }
  }

  console.log('\n=== Work Experience Extraction Complete ===');
  console.log('Total experiences extracted:', allWorkExperiences.length);

  return { workExperiences: allWorkExperiences };
};

export async function parseWorkExperienceText(text: string): Promise<ResumeWorkExperience[]> {
  const parser = new MistralWorkExperienceParser();
  return await parser.parseWorkExperience(text);
}

import { createPythonProxyServer } from './python-proxy';
import { NLPInput } from './types';

interface NLPEntity {
  text: string;
  label: string;
  start: number;
  end: number;
}

interface NLPAnalysisResult {
  entities: NLPEntity[];
  rawText: string;
  debug: {
    fullSpacyOutput: any;
    tokens: string[];
    posTags: string[];
  };
}

export async function analyzeTextWithSpacy(input: NLPInput): Promise<NLPAnalysisResult> {
  try {
    // We'll use a Python proxy server to run spaCy since it's not available in JS
    const pythonProxy = createPythonProxyServer();
    
    const result = await pythonProxy.analyze(input);
    
    console.log('SpaCy Analysis Debug Output:');
    console.log('Full Text:', input);
    console.log('Detected Entities:', result.entities);
    console.log('Tokens:', result.debug.tokens);
    console.log('POS Tags:', result.debug.posTags);
    console.log('Full spaCy Output:', result.debug.fullSpacyOutput);
    
    return result;
  } catch (error) {
    console.error('NLP Analysis Error:', error);
    throw error;
  }
} 
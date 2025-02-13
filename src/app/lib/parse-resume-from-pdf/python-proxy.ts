import type { NLPInput } from "lib/parse-resume-from-pdf/types";

export const createPythonProxyServer = () => {
  const SERVER_URL = 'http://127.0.0.1:5000';

  return {
    analyze: async (input: NLPInput) => {
      try {
        console.log("Sending text to NLP server:", input.text.slice(0, 100));
        const response = await fetch(`${SERVER_URL}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          console.error("Server response not OK:", response.status, response.statusText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Error in python-proxy:", error);
        throw error;
      }
    }
  };
}; 
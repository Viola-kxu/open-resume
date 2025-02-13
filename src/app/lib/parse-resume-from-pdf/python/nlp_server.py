from flask import Flask, request, jsonify
import spacy
from flask_cors import CORS
from functools import lru_cache

app = Flask(__name__)
CORS(app)

# Load English language model
nlp = spacy.load("en_core_web_lg")

@lru_cache(maxsize=100)
def analyze_text_cached(text: str):
    return nlp(text)

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"status": "ok", "message": "NLP server is running"})

@app.route('/analyze', methods=['POST'])
def analyze_text():
    data = request.json
    text = data.get('text', '')
    text_items = data.get('textItems', [])
    section_name = data.get('sectionName', '')
    
    print(f"Analyzing section: {section_name}")
    print(f"Text items: {text_items}")
    
    doc = analyze_text_cached(text)
    
    # Use position and formatting info to improve entity detection
    entities = []
    for ent in doc.ents:
        # Find corresponding text items for this entity
        matching_items = [
            item for item in text_items 
            if item['text'] in ent.text
        ]
        
        # Use formatting hints to improve entity classification
        if any(item['isBold'] for item in matching_items):
            # Bold text is likely a company name or job title
            if ent.label_ not in ['ORG', 'TITLE']:
                ent.label_ = 'ORG'
                
        entities.append({
            'text': ent.text,
            'label': ent.label_,
            'start': ent.start_char,
            'end': ent.end_char,
            'position': {
                'x': matching_items[0]['x'] if matching_items else 0,
                'y': matching_items[0]['y'] if matching_items else 0
            } if matching_items else None
        })
    
    return jsonify({
        'entities': entities,
        'rawText': text,
        'debug': {
            'textItems': text_items,
            'section': section_name,
            'tokens': [token.text for token in doc],
            'posTags': [token.pos_ for token in doc]
        }
    })

if __name__ == '__main__':
    app.run(port=5000) 
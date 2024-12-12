from flask import Flask, request, jsonify
from flask_cors import CORS 
from transformers import AutoTokenizer, AutoModelForCausalLM
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import json
import re

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
# Load the language model and tokenizer
model_name = "EleutherAI/gpt-neo-2.7B"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# Load the embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize the vector database
dimension = 384  # Dimension of the embeddings from 'all-MiniLM-L6-v2'
index = faiss.IndexFlatL2(dimension)

def load_sample_data_from_json(file_path="dataset.json"):
    with open(file_path, "r") as file:
        return json.load(file)

# Sample data
sample_data = load_sample_data_from_json()

# Generate embeddings for the sample data
def load_sample_data():
    for data in sample_data:
        embedding = embedding_model.encode(data["question"], convert_to_tensor=True).cpu().numpy()
        index.add(np.array([embedding]))

# Load the sample data into the vector database once at startup
load_sample_data()

# Function to find the most similar question and get its answer
def find_similar_answer(query):
    query_embedding = embedding_model.encode(query, convert_to_tensor=True).cpu().numpy()
    D, I = index.search(np.array([query_embedding]), k=1)
    return sample_data[I[0][0]]["answer"]

def generate_response_with_llm(query):
    # Define the prompt
    prompt = f"{query}"

    # Find the most similar question's answer
    similar_answer = find_similar_answer(query)

    # Encode the prompt
    inputs = tokenizer(prompt, return_tensors='pt')

    # Generate the response
    outputs = model.generate(**inputs, max_length=200, num_return_sequences=1, do_sample=True, temperature=0.7)
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(generated_text)
   # Remove the last occurrence of '.\n\n' and everything that follows it
    generated_text = re.sub(r'\.\n.*$', '', generated_text, flags=re.DOTALL)

    return f"{similar_answer}\n\n{generated_text}."

@app.route('/ask', methods=['POST'])
def ask():
    data = request.json 
    query = data.get("query")  

    if not query:  
        return jsonify({"error": "Missing required parameter: query"}), 400

    try:
        # Generate response using LLM
        response = generate_response_with_llm(query)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)

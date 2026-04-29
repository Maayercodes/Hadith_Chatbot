from flask import Flask, render_template, request, jsonify
import numpy as np
import faiss
import pandas as pd
from model.model_load import model1, model2

app = Flask(__name__)

hadith_df = pd.read_csv("data/cleaned_hadith_data.csv")

embeddings = np.load("model/hadith_embeddings.npy")
faiss_index = faiss.read_index("model/faiss_index.faiss")

def get_similar_hadith(query, count=3):
    emb1 = model1.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    emb2 = model2.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    query_embedding = (emb1 + emb2) / 2
    distance, indices = faiss_index.search(query_embedding, count)

    results = []
    for i in range(count):
        result = {
            'arabic': hadith_df['Arabic_Hadith'].iloc[indices[0][i]],
            'english': hadith_df['English_Hadith'].iloc[indices[0][i]],
            'distance': float(distance[0][i])
        }
        results.append(result)
    return results

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get', methods=['POST'])
def get_response():
    user_msg = request.json['msg']
    hadiths = get_similar_hadith(user_msg, 3)
    return jsonify(hadiths)

if __name__ == '__main__':
    app.run(debug=True)

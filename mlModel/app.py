from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
from keras_facenet import FaceNet
from numpy.linalg import norm

app = Flask(__name__)
CORS(app)

# -------------------- Setup --------------------
print("🚀 Loading FaceNet model (TensorFlow)...")
embedder = FaceNet()
print("✅ Model loaded successfully!")

# -------------------- Helper Functions --------------------
def extract_face_embedding(img_bytes):
    """Detects faces and extracts embeddings using keras-facenet."""
    img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    img_array = np.array(img)
    
    # keras-facenet internally detects and aligns faces
    embeddings = embedder.embeddings([img_array])
    
    if len(embeddings) == 0:
        return None
    
    # L2 normalize
    emb = embeddings[0]
    emb = emb / norm(emb)
    return emb


def cosine_similarity(a, b):
    """Compute cosine similarity between two embeddings."""
    return np.dot(a, b) / (norm(a) * norm(b))


# -------------------- ROUTE 1: Compare two faces --------------------
@app.route('/compare_faces', methods=['POST'])
def compare_faces():
    try:
        if 'image1' not in request.files or 'image2' not in request.files:
            return jsonify({"error": "Please upload both image1 and image2"}), 400

        img1_bytes = request.files['image1'].read()
        img2_bytes = request.files['image2'].read()

        emb1 = extract_face_embedding(img1_bytes)
        emb2 = extract_face_embedding(img2_bytes)

        if emb1 is None or emb2 is None:
            return jsonify({"error": "Face not detected in one or both images"}), 400

        sim = cosine_similarity(emb1, emb2)
        threshold = 0.40
        result = "Same person" if sim > threshold else "Different person"

        return jsonify({
            "similarity": round(float(sim), 4),
            "threshold": threshold,
            "result": result
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- ROUTE 2: Get embedding of a single image --------------------
@app.route('/get_embeddings', methods=['POST'])
def get_embeddings():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "Please upload an image with key 'image'"}), 400

        img_bytes = request.files['image'].read()
        emb = extract_face_embedding(img_bytes)

        if emb is None:
            return jsonify({"error": "No face detected in the image"}), 400

        embedding_list = emb.tolist()

        return jsonify({
            "embedding_dim": len(embedding_list),
            "embedding_vector": embedding_list
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- Run --------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

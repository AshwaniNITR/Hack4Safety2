from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.preprocessing import image
from tensorflow.keras.models import Model
from numpy.linalg import norm

app = Flask(__name__)
CORS(app)

# -------------------- Load model --------------------
print("🚀 Loading EfficientNet model (ImageNet)...")
base_model = EfficientNetB0(weights="imagenet", include_top=False, pooling='avg')
print("✅ Model loaded successfully!")


# -------------------- Helper Functions --------------------
def extract_embedding(img_bytes):
    """Extracts a general-purpose embedding for any image."""
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img = img.resize((224, 224))  # Required for EfficientNet
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    emb = base_model.predict(img_array)[0]
    emb = emb / norm(emb)  # Normalize to unit length
    return emb


def cosine_similarity(a, b):
    """Compute cosine similarity between two embeddings."""
    return np.dot(a, b) / (norm(a) * norm(b))


# -------------------- ROUTE 1: Compare two images --------------------
@app.route('/compare_images', methods=['POST'])
def compare_images():
    try:
        if 'image1' not in request.files or 'image2' not in request.files:
            return jsonify({"error": "Please upload both image1 and image2"}), 400

        img1_bytes = request.files['image1'].read()
        img2_bytes = request.files['image2'].read()

        emb1 = extract_embedding(img1_bytes)
        emb2 = extract_embedding(img2_bytes)

        sim = cosine_similarity(emb1, emb2)
        threshold = 0.60 # tune for your use case
        result = "Similar" if sim > threshold else "Different"

        return jsonify({
            "similarity": round(float(sim), 4),
            "threshold": threshold,
            "result": result
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- ROUTE 2: Get embedding --------------------
@app.route('/get_embeddings', methods=['POST'])
def get_embeddings():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "Please upload an image with key 'image'"}), 400

        img_bytes = request.files['image'].read()
        emb = extract_embedding(img_bytes)
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

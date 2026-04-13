import torch
import clip
import requests
from io import BytesIO
from PIL import Image

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

def embed_image_url(image_url):
    response = requests.get(image_url)
    image = preprocess(Image.open(BytesIO(response.content))).unsqueeze(0).to(device)

    with torch.no_grad():
        embedding = model.encode_image(image)

    embedding /= embedding.norm(dim=-1, keepdim=True)
    return embedding.cpu().numpy()[0]

def embed_image(image_path):
    image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)

    with torch.no_grad():
        embedding = model.encode_image(image)

    embedding /= embedding.norm(dim=-1, keepdim=True)
    return embedding.cpu().numpy()[0]

def embed_text(text):
    tokens = clip.tokenize([text]).to(device)

    with torch.no_grad():
        emb = model.encode_text(tokens)

    emb /= emb.norm(dim=-1, keepdim=True)
    return emb.cpu().numpy()[0]
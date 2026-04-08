# Utilisation de la version slim pour optimiser la taille et la compatibilité
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier les dépendances en premier pour optimiser le cache Docker
COPY requirements.txt .

# Installer les dépendances
# --no-cache-dir permet de ne pas stocker les fichiers d'installation et gagner de la place
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code
COPY . .

# Exposer le port de FastAPI
EXPOSE 8000

# Lancer le serveur Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
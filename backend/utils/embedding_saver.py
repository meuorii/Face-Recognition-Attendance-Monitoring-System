import os
import csv
import numpy as np

# Default CSV path (you can change this)
CSV_FILE = os.path.join("data", "face_embeddings.csv")

# Make sure folder exists
os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)

def save_embedding(student_id: str, angle: str, embedding: np.ndarray, capture_id: str, csv_file: str = CSV_FILE):
    """
    Save a single face embedding to CSV.

    Args:
        student_id (str): Unique student identifier.
        angle (str): Face angle (e.g., 'front', 'left', 'right', 'up', 'down').
        embedding (np.ndarray): The embedding vector from ArcFace.
        capture_id (str): Capture sequence ID (e.g., '1', '2').
        csv_file (str): Path to CSV file (default: data/face_embeddings.csv).
    """
    # Ensure embedding is numpy array
    if not isinstance(embedding, np.ndarray):
        embedding = np.array(embedding)

    row = [student_id, angle, capture_id] + embedding.tolist()

    # Append to CSV
    with open(csv_file, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(row)


def init_csv(csv_file: str = CSV_FILE):
    """
    Initialize CSV with headers if it doesn't exist.
    """
    if not os.path.exists(csv_file):
        with open(csv_file, mode="w", newline="") as file:
            writer = csv.writer(file)
            # Example: StudentID, Angle, CaptureID, Emb1, Emb2, ... Emb512
            headers = ["student_id", "angle", "capture_id"] + [f"emb_{i}" for i in range(512)]
            writer.writerow(headers)

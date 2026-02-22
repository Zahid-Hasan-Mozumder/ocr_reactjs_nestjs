import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export async function extractInsuranceCard(frontFile, backFile) {
  if (!frontFile && !backFile) {
    throw new Error('Please provide at least one image.');
  }

  const formData = new FormData();
  if (frontFile) formData.append('front', frontFile);
  if (backFile) formData.append('back', backFile);

  const response = await axios.post(`${API_BASE}/ocr/extract`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

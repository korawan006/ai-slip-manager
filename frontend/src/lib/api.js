const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const uploadSlips = async (files, userId) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('slips', file);
  });
  if (userId) {
    formData.append('user_id', userId);
  }

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Failed to upload slips');
    error.status = response.status;
    throw error;
  }

  return response.json();
};

export const getTransactions = async () => {
  const response = await fetch(`${API_URL}/transactions`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return response.json();
};

export const getDashboardData = async () => {
  const response = await fetch(`${API_URL}/dashboard`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
};

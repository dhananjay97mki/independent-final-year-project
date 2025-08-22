const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export async function http(path, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {})
    },
    ...options
  };
  
  const response = await fetch(`${API_BASE}${path}`, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  
  return data;
}

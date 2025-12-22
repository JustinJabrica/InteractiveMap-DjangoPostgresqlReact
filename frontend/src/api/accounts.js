import api from './axios';

const accountsApi = {
  // Authentication
  register: async (userData) => {
    const response = await api.post('/accounts/register/', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/accounts/login/', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/accounts/logout/');
    return response.data;
  },

  // User management
  getCurrentUser: async () => {
    const response = await api.get('/accounts/me/');
    return response.data;
  },

  updateUser: async (userData) => {
    const response = await api.patch('/accounts/me/', userData);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/accounts/delete/');
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/accounts/change-password/', passwordData);
    return response.data;
  },

  // Profile management
  getProfile: async () => {
    const response = await api.get('/accounts/profile/');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.patch('/accounts/profile/', profileData);
    return response.data;
  },

  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    const response = await api.post('/accounts/profile/picture/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteProfilePicture: async () => {
    const response = await api.delete('/accounts/profile/picture/');
    return response.data;
  },

  // User search (for sharing)
  searchUsers: async (searchTerm) => {
    const response = await api.get('/accounts/users/', {
      params: { search: searchTerm },
    });
    return response.data;
  },
};

export default accountsApi;

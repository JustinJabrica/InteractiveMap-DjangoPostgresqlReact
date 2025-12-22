import api from './axios';

const mapsApi = {
  // Maps CRUD
  maps: {
    list: async () => {
      const response = await api.get('/maps/maps/');
      return response.data;
    },

    myMaps: async () => {
      const response = await api.get('/maps/my-maps/');
      return response.data;
    },

    sharedWithMe: async () => {
      const response = await api.get('/maps/shared-with-me/');
      return response.data;
    },

    get: async (id) => {
      const response = await api.get(`/maps/maps/${id}/`);
      return response.data;
    },

    create: async (mapData) => {
      const formData = new FormData();
      formData.append('name', mapData.name);
      formData.append('description', mapData.description || '');
      formData.append('file', mapData.file);
      if (mapData.is_public !== undefined) {
        formData.append('is_public', mapData.is_public);
      }

      const response = await api.post('/maps/maps/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },

    update: async (id, mapData) => {
      const response = await api.patch(`/maps/maps/${id}/`, mapData);
      return response.data;
    },

    delete: async (id) => {
      const response = await api.delete(`/maps/maps/${id}/`);
      return response.data;
    },

    getPois: async (id, sortBy = 'created_at', order = 'desc') => {
      const response = await api.get(`/maps/maps/${id}/pois/`, {
        params: { sort_by: sortBy, order },
      });
      return response.data;
    },

    getLayers: async (id) => {
      const response = await api.get(`/maps/maps/${id}/layers/`);
      return response.data;
    },

    share: async (id, shareData) => {
      const response = await api.post(`/maps/maps/${id}/share/`, shareData);
      return response.data;
    },

    getSharedUsers: async (id) => {
      const response = await api.get(`/maps/maps/${id}/shared_users/`);
      return response.data;
    },
  },

  // Map Layers CRUD (layers act as map-specific categories)
  layers: {
    list: async (mapId = null) => {
      const params = mapId ? { map: mapId } : {};
      const response = await api.get('/maps/layers/', { params });
      return response.data;
    },

    get: async (id) => {
      const response = await api.get(`/maps/layers/${id}/`);
      return response.data;
    },

    create: async (layerData) => {
      const response = await api.post('/maps/layers/', layerData);
      return response.data;
    },

    update: async (id, layerData) => {
      const response = await api.patch(`/maps/layers/${id}/`, layerData);
      return response.data;
    },

    delete: async (id) => {
      const response = await api.delete(`/maps/layers/${id}/`);
      return response.data;
    },
  },

  // Points of Interest CRUD
  pois: {
    list: async (params = {}) => {
      const response = await api.get('/maps/pois/', { params });
      return response.data;
    },

    get: async (id) => {
      const response = await api.get(`/maps/pois/${id}/`);
      return response.data;
    },

    create: async (poiData) => {
      const response = await api.post('/maps/pois/', poiData);
      return response.data;
    },

    update: async (id, poiData) => {
      const response = await api.patch(`/maps/pois/${id}/`, poiData);
      return response.data;
    },

    delete: async (id) => {
      const response = await api.delete(`/maps/pois/${id}/`);
      return response.data;
    },

    byLayer: async (mapId) => {
      const response = await api.get('/maps/pois/by_layer/', {
        params: { map: mapId },
      });
      return response.data;
    },
  },

  // Shared Maps CRUD
  shared: {
    list: async () => {
      const response = await api.get('/maps/shared/');
      return response.data;
    },

    get: async (id) => {
      const response = await api.get(`/maps/shared/${id}/`);
      return response.data;
    },

    create: async (shareData) => {
      const response = await api.post('/maps/shared/', shareData);
      return response.data;
    },

    update: async (id, shareData) => {
      const response = await api.patch(`/maps/shared/${id}/`, shareData);
      return response.data;
    },

    delete: async (id) => {
      const response = await api.delete(`/maps/shared/${id}/`);
      return response.data;
    },
  },
};

export default mapsApi;

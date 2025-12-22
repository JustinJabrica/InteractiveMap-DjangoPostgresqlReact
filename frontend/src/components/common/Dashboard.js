import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mapsApi } from '../../api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMaps: 0,
    totalPois: 0,
    totalLayers: 0,
    sharedMaps: 0,
  });
  const [recentMaps, setRecentMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [myMaps, sharedMaps] = await Promise.all([
        mapsApi.maps.myMaps(),
        mapsApi.maps.sharedWithMe(),
      ]);

      const mapsData = myMaps.results || myMaps;
      const sharedData = sharedMaps.results || sharedMaps;

      const totalPois = mapsData.reduce((sum, map) => sum + (map.poi_count || 0), 0);
      const totalLayers = mapsData.reduce((sum, map) => sum + (map.layer_count || 0), 0);

      setStats({
        totalMaps: mapsData.length,
        totalPois,
        totalLayers,
        sharedMaps: sharedData.length,
      });

      setRecentMaps(mapsData.slice(0, 4));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.first_name || user?.username}!</h1>
        <p>Here's an overview of your interactive maps.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🗺️</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalMaps}</span>
            <span className="stat-label">My Maps</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalPois}</span>
            <span className="stat-label">Points of Interest</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗂️</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalLayers}</span>
            <span className="stat-label">Layers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-content">
            <span className="stat-value">{stats.sharedMaps}</span>
            <span className="stat-label">Shared with Me</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Maps</h2>
          <Link to="/maps" className="view-all-link">View All →</Link>
        </div>

        {recentMaps.length === 0 ? (
          <div className="empty-section">
            <p>You haven't created any maps yet.</p>
            <Link to="/maps/new" className="btn-primary">Create Your First Map</Link>
          </div>
        ) : (
          <div className="recent-maps-grid">
            {recentMaps.map((map) => (
              <Link to={`/maps/${map.id}`} key={map.id} className="recent-map-card">
                <div className="recent-map-preview">
                  {map.file_type === 'image' ? (
                    <img src={map.file} alt={map.name} />
                  ) : (
                    <div className="pdf-preview-small">📄</div>
                  )}
                </div>
                <div className="recent-map-info">
                  <h3>{map.name}</h3>
                  <span>{map.poi_count} points</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <Link to="/maps/new" className="quick-action-card">
            <span className="action-icon">➕</span>
            <span className="action-label">Create New Map</span>
          </Link>
          <Link to="/maps" className="quick-action-card">
            <span className="action-icon">🗺️</span>
            <span className="action-label">Browse Maps</span>
          </Link>
          <Link to="/profile" className="quick-action-card">
            <span className="action-icon">👤</span>
            <span className="action-label">Edit Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

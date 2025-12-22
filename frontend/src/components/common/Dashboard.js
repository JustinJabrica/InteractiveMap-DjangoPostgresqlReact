import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mapsApi } from '../../api';
import './Layout.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    maps: 0,
    pois: 0,
    categories: 0,
    sharedMaps: 0,
  });
  const [recentMaps, setRecentMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [mapsData, categoriesData, sharedData, poisData] = await Promise.all([
        mapsApi.maps.myMaps(),
        mapsApi.categories.list(),
        mapsApi.maps.sharedWithMe(),
        mapsApi.pois.list(),
      ]);

      const maps = mapsData.results || mapsData;
      const categories = categoriesData.results || categoriesData;
      const shared = sharedData.results || sharedData;
      const pois = poisData.results || poisData;

      setStats({
        maps: maps.length,
        pois: pois.length,
        categories: categories.length,
        sharedMaps: shared.length,
      });

      setRecentMaps(maps.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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
        <h1>{getGreeting()}, {user?.first_name || user?.username}!</h1>
        <p>Here's what's happening with your maps</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">🗺️</div>
          <div className="stat-content">
            <h3>My Maps</h3>
            <p className="stat-number">{stats.maps}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>Points of Interest</h3>
            <p className="stat-number">{stats.pois}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h3>Categories</h3>
            <p className="stat-number">{stats.categories}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🤝</div>
          <div className="stat-content">
            <h3>Shared With Me</h3>
            <p className="stat-number">{stats.sharedMaps}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Maps</h2>
            <Link to="/maps">View All →</Link>
          </div>
          <div className="section-content">
            {recentMaps.length === 0 ? (
              <div className="empty-section">
                <p>No maps yet. Create your first map to get started!</p>
                <Link to="/maps/new" className="btn-primary" style={{ display: 'inline-block', marginTop: '15px', padding: '10px 20px', textDecoration: 'none', borderRadius: '8px' }}>
                  Create Map
                </Link>
              </div>
            ) : (
              recentMaps.map((map) => (
                <Link
                  key={map.id}
                  to={`/maps/${map.id}`}
                  className="recent-map-item"
                >
                  <div className="recent-map-thumb">
                    {map.file_type === 'image' ? (
                      <img src={map.file} alt={map.name} />
                    ) : (
                      <span>📄</span>
                    )}
                  </div>
                  <div className="recent-map-info">
                    <h4>{map.name}</h4>
                    <span>
                      {map.poi_count} points • Updated{' '}
                      {new Date(map.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="section-content">
            <div className="quick-actions">
              <Link to="/maps/new" className="quick-action-btn">
                <span>➕</span>
                <span>Create New Map</span>
              </Link>
              <Link to="/categories" className="quick-action-btn">
                <span>🏷️</span>
                <span>Manage Categories</span>
              </Link>
              <Link to="/maps" className="quick-action-btn">
                <span>🗺️</span>
                <span>Browse All Maps</span>
              </Link>
              <Link to="/profile" className="quick-action-btn">
                <span>👤</span>
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

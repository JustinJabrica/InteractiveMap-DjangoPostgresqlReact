import React, { useState, useEffect, useCallback } from 'react';
import { mapsApi, accountsApi } from '../../api';
import './Maps.css';

const ShareModal = ({ mapId, mapName, isOwner = true, onClose }) => {
  const [sharedWith, setSharedWith] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permission, setPermission] = useState('view');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSharedUsers = useCallback(async () => {
    try {
      const data = await mapsApi.maps.getSharedUsers(mapId);
      setSharedWith(data);
    } catch (err) {
      console.error('Failed to load shared users', err);
    }
  }, [mapId]);

  useEffect(() => {
    loadSharedUsers();
  }, [loadSharedUsers]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const results = await accountsApi.searchUsers(searchTerm);
        // Filter out users already shared with
        const sharedIds = sharedWith.map((s) => s.shared_with.id);
        const filtered = (results.results || results).filter(
          (user) => !sharedIds.includes(user.id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, sharedWith]);

  const handleShare = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await mapsApi.maps.share(mapId, {
        shared_with_id: selectedUser.id,
        permission,
      });
      setSuccess(`Map shared with ${selectedUser.username}`);
      setSelectedUser(null);
      setSearchTerm('');
      setSearchResults([]);
      await loadSharedUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to share map');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (shareId, newPermission) => {
    try {
      await mapsApi.shared.update(shareId, { permission: newPermission });
      await loadSharedUsers();
    } catch (err) {
      setError('Failed to update permission');
    }
  };

  const handleRemoveShare = async (shareId) => {
    if (!window.confirm('Remove access for this user?')) return;

    try {
      await mapsApi.shared.delete(shareId);
      await loadSharedUsers();
    } catch (err) {
      setError('Failed to remove access');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isOwner ? `Share "${mapName}"` : `"${mapName}" - Shared Users`}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {isOwner && (
          <div className="share-form">
            <div className="share-search">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by username..."
                className="share-search-input"
              />
              {searching && <span className="searching">Searching...</span>}

              {searchResults.length > 0 && !selectedUser && (
                <div className="search-results">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="search-result-item"
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchTerm(user.username);
                        setSearchResults([]);
                      }}
                    >
                      <span className="user-avatar">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                      <div className="user-info">
                        <span className="user-name">{user.username}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm.length >= 2 && searchResults.length === 0 && !searching && !selectedUser && (
                <div className="no-results">
                  No users found matching "{searchTerm}"
                </div>
              )}
            </div>

            {selectedUser && (
              <div className="selected-user">
                <div className="selected-user-info">
                  <span className="user-avatar">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </span>
                  <span>{selectedUser.username}</span>
                  <button
                    className="btn-clear"
                    onClick={() => {
                      setSelectedUser(null);
                      setSearchTerm('');
                    }}
                  >
                    ✕
                  </button>
                </div>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  className="permission-select"
                >
                  <option value="view">View Only</option>
                  <option value="edit">Can Edit</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  className="btn-primary"
                  onClick={handleShare}
                  disabled={loading}
                >
                  {loading ? 'Sharing...' : 'Share'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="shared-users">
          <h3>Shared with ({sharedWith.length})</h3>
          {sharedWith.length === 0 ? (
            <p className="no-shares">This map hasn't been shared with anyone yet.</p>
          ) : (
            <div className="shared-users-list">
              {sharedWith.map((share) => (
                <div key={share.id} className="shared-user-item">
                  <div className="shared-user-info">
                    <span className="user-avatar">
                      {share.shared_with.username.charAt(0).toUpperCase()}
                    </span>
                    <div className="user-details">
                      <span className="user-name">{share.shared_with.username}</span>
                      <span className="user-email">{share.shared_with.email}</span>
                    </div>
                  </div>
                  {isOwner ? (
                    <>
                      <select
                        value={share.permission}
                        onChange={(e) => handleUpdatePermission(share.id, e.target.value)}
                        className="permission-select"
                      >
                        <option value="view">View Only</option>
                        <option value="edit">Can Edit</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        className="btn-icon-sm btn-danger-icon"
                        onClick={() => handleRemoveShare(share.id)}
                        title="Remove access"
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <span className="permission-badge">
                      {share.permission === 'view' && 'View Only'}
                      {share.permission === 'edit' && 'Can Edit'}
                      {share.permission === 'admin' && 'Admin'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

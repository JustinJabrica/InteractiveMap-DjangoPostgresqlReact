import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { accountsApi } from '../../api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const [userFormData, setUserFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });

  const [profileFormData, setProfileFormData] = useState({
    bio: '',
    location: '',
    website: '',
  });

  const [passwordFormData, setPasswordFormData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await accountsApi.getProfile();
      const userData = await accountsApi.getCurrentUser();
      
      setProfile(profileData);
      setUserFormData({
        email: userData.email || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
      });
      setProfileFormData({
        bio: profileData.bio || '',
        location: profileData.location || '',
        website: profileData.website || '',
      });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e) => {
    setUserFormData({
      ...userFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileChange = (e) => {
    setProfileFormData({
      ...profileFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordFormData({
      ...passwordFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await accountsApi.updateUser(userFormData);
      updateUser(userFormData);
      setSuccess('User information updated successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user information');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updatedProfile = await accountsApi.updateProfile(profileFormData);
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordFormData.new_password !== passwordFormData.new_password_confirm) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await accountsApi.changePassword(passwordFormData);
      setSuccess('Password changed successfully');
      setPasswordFormData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (err) {
      setError(err.response?.data?.old_password || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await accountsApi.uploadProfilePicture(file);
      setProfile(response.profile);
      setSuccess('Profile picture updated successfully');
    } catch (err) {
      setError('Failed to upload profile picture');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePicture = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await accountsApi.deleteProfilePicture();
      setProfile({ ...profile, profile_picture: null });
      setSuccess('Profile picture deleted');
    } catch (err) {
      setError('Failed to delete profile picture');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await accountsApi.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to delete account');
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-picture-section">
            <div
              className="profile-picture"
              onClick={handleProfilePictureClick}
            >
              {profile?.profile_picture ? (
                <img src={profile.profile_picture} alt="Profile" />
              ) : (
                <div className="profile-picture-placeholder">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="profile-picture-overlay">
                <span>Change</span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              hidden
            />
            {profile?.profile_picture && (
              <button
                className="btn-text-danger"
                onClick={handleDeletePicture}
                disabled={saving}
              >
                Remove Picture
              </button>
            )}
          </div>

          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Info
            </button>
            <button
              className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>
            <button
              className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              Password
            </button>
            <button
              className={`tab-button ${activeTab === 'danger' ? 'active' : ''}`}
              onClick={() => setActiveTab('danger')}
            >
              Danger Zone
            </button>
          </div>
        </div>

        <div className="profile-main">
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <h2>Profile Information</h2>
              
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileFormData.bio}
                  onChange={handleProfileChange}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={profileFormData.location}
                  onChange={handleProfileChange}
                  placeholder="City, Country"
                />
              </div>

              <div className="form-group">
                <label htmlFor="website">Website</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={profileFormData.website}
                  onChange={handleProfileChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {activeTab === 'account' && (
            <form onSubmit={handleUpdateUser} className="profile-form">
              <h2>Account Information</h2>
              
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={user?.username || ''} disabled />
                <small>Username cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userFormData.email}
                  onChange={handleUserChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={userFormData.first_name}
                    onChange={handleUserChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={userFormData.last_name}
                    onChange={handleUserChange}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Account'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordUpdate} className="profile-form">
              <h2>Change Password</h2>
              
              <div className="form-group">
                <label htmlFor="old_password">Current Password</label>
                <input
                  type="password"
                  id="old_password"
                  name="old_password"
                  value={passwordFormData.old_password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new_password">New Password</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={passwordFormData.new_password}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new_password_confirm">Confirm New Password</label>
                <input
                  type="password"
                  id="new_password_confirm"
                  name="new_password_confirm"
                  value={passwordFormData.new_password_confirm}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          {activeTab === 'danger' && (
            <div className="profile-form danger-zone">
              <h2>Danger Zone</h2>
              <p>Once you delete your account, there is no going back. Please be certain.</p>
              
              {!showDeleteConfirm ? (
                <button
                  className="btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </button>
              ) : (
                <div className="delete-confirm">
                  <p><strong>Are you sure you want to delete your account?</strong></p>
                  <p>All your maps, points of interest, and data will be permanently deleted.</p>
                  <div className="delete-confirm-buttons">
                    <button
                      className="btn-danger"
                      onClick={handleDeleteAccount}
                    >
                      Yes, Delete My Account
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

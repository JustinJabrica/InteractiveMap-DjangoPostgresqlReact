import React, { useState, useEffect } from 'react';
import { mapsApi } from '../../api';
import './Maps.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3498db',
    icon: 'marker',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await mapsApi.categories.list();
      setCategories(data.results || data);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3498db',
      icon: 'marker',
    });
    setShowForm(false);
    setEditingCategory(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon || 'marker',
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await mapsApi.categories.update(editingCategory.id, formData);
        setSuccess('Category updated successfully');
      } else {
        await mapsApi.categories.create(formData);
        setSuccess('Category created successfully');
      }
      resetForm();
      await loadCategories();
    } catch (err) {
      setError(err.response?.data?.name?.[0] || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Delete this category? POIs using this category will become uncategorized.')) {
      return;
    }

    try {
      await mapsApi.categories.delete(categoryId);
      setSuccess('Category deleted successfully');
      await loadCategories();
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="categories-container">
        <div className="loading">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h1>Categories</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + New Category
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="category-form-card">
          <h2>{editingCategory ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group flex-grow">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Category name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="color">Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Optional description"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏷️</div>
          <h3>No categories yet</h3>
          <p>Create categories to organize your points of interest</p>
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Create Category
            </button>
          )}
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map((category) => (
            <div key={category.id} className="category-card">
              <div
                className="category-color-bar"
                style={{ backgroundColor: category.color }}
              />
              <div className="category-content">
                <h3>{category.name}</h3>
                {category.description && <p>{category.description}</p>}
                <div className="category-meta">
                  <span className="poi-count">{category.poi_count} points</span>
                </div>
              </div>
              <div className="category-actions">
                <button
                  className="btn-icon"
                  onClick={() => handleEdit(category)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="btn-icon btn-icon-danger"
                  onClick={() => handleDelete(category.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;

import React from 'react';
import './Maps.css';

const PoiList = ({ pois, sortBy, sortOrder, onSortChange, onPoiClick, onClose }) => {
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'category', label: 'Category' },
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Date Edited' },
  ];

  const handleSortChange = (e) => {
    onSortChange(e.target.value, sortOrder);
  };

  const toggleSortOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Group POIs by category if sorting by category
  const groupedPois = sortBy === 'category'
    ? pois.reduce((acc, poi) => {
        const categoryName = poi.category_name || 'Uncategorized';
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(poi);
        return acc;
      }, {})
    : null;

  return (
    <div className="poi-list-panel">
      <div className="panel-header">
        <h3>Points of Interest ({pois.length})</h3>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="poi-list-controls">
        <div className="sort-control">
          <label>Sort by:</label>
          <select value={sortBy} onChange={handleSortChange}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="sort-order-btn"
            onClick={toggleSortOrder}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="poi-list-content">
        {pois.length === 0 ? (
          <div className="empty-list">
            <p>No points of interest yet</p>
            <small>Click on the map to add one</small>
          </div>
        ) : groupedPois ? (
          // Grouped view
          Object.entries(groupedPois).map(([category, categoryPois]) => (
            <div key={category} className="poi-category-group">
              <div className="category-header">
                <span
                  className="category-color"
                  style={{
                    backgroundColor: categoryPois[0]?.category_color || '#999',
                  }}
                />
                <span className="category-name">{category}</span>
                <span className="category-count">({categoryPois.length})</span>
              </div>
              <div className="category-pois">
                {categoryPois.map((poi) => (
                  <PoiListItem
                    key={poi.id}
                    poi={poi}
                    onClick={() => onPoiClick(poi)}
                    showCategory={false}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Flat view
          pois.map((poi) => (
            <PoiListItem
              key={poi.id}
              poi={poi}
              onClick={() => onPoiClick(poi)}
              showCategory={true}
            />
          ))
        )}
      </div>
    </div>
  );
};

const PoiListItem = ({ poi, onClick, showCategory }) => {
  return (
    <div className="poi-list-item" onClick={onClick}>
      <div
        className="poi-list-marker"
        style={{ backgroundColor: poi.color || poi.category_color || '#e74c3c' }}
      />
      <div className="poi-list-info">
        <span className="poi-list-name">{poi.name}</span>
        {showCategory && poi.category_name && (
          <span className="poi-list-category">{poi.category_name}</span>
        )}
        {poi.description && (
          <span className="poi-list-description">
            {poi.description.substring(0, 50)}
            {poi.description.length > 50 ? '...' : ''}
          </span>
        )}
      </div>
      <div className="poi-list-date">
        {new Date(poi.updated_at).toLocaleDateString()}
      </div>
    </div>
  );
};

export default PoiList;

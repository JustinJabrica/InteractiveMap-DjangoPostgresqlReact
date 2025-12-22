import React from 'react';
import './Maps.css';

const PoiList = ({ pois = [], sortBy, sortOrder, onSortChange, onPoiClick, onClose }) => {
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'layer', label: 'Layer / Category' },
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Date Edited' },
  ];

  const handleSortChange = (e) => {
    onSortChange(e.target.value, sortOrder);
  };

  const toggleSortOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Group POIs by layer if sorting by layer
  const groupedPois = sortBy === 'layer'
    ? pois.reduce((acc, poi) => {
        const layerName = poi.layer_name || 'Uncategorized';
        if (!acc[layerName]) {
          acc[layerName] = [];
        }
        acc[layerName].push(poi);
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
          Object.entries(groupedPois).map(([layerName, layerPois]) => (
            <div key={layerName} className="poi-category-group">
              <div className="category-header">
                <span
                  className="category-color"
                  style={{
                    backgroundColor: layerPois[0]?.layer_color || '#999',
                  }}
                />
                <span className="category-name">{layerName}</span>
                <span className="category-count">({layerPois.length})</span>
              </div>
              <div className="category-pois">
                {layerPois.map((poi) => (
                  <PoiListItem
                    key={poi.id}
                    poi={poi}
                    onClick={() => onPoiClick(poi)}
                    showLayer={false}
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
              showLayer={true}
            />
          ))
        )}
      </div>
    </div>
  );
};

const PoiListItem = ({ poi, onClick, showLayer }) => {
  const getColor = () => {
    if (poi.color) return poi.color;
    if (poi.display_color) return poi.display_color;
    if (poi.layer_color) return poi.layer_color;
    return '#e74c3c';
  };

  return (
    <div className="poi-list-item" onClick={onClick}>
      <div
        className="poi-list-marker"
        style={{ backgroundColor: getColor() }}
      />
      <div className="poi-list-info">
        <span className="poi-list-name">{poi.name}</span>
        {showLayer && poi.layer_name && (
          <span className="poi-list-category">{poi.layer_name}</span>
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

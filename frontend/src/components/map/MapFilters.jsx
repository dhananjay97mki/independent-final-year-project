import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setFilters } from '../../store/map.slice';

const MapFilters = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector(state => state.map);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ ...filters, [key]: value }));
  };

  return (
    <div className={`map-filters ${isExpanded ? 'expanded' : ''}`}>
      <div className="filters-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span>🔍 Filters</span>
        <span className={`expand-icon ${isExpanded ? 'rotated' : ''}`}>▼</span>
      </div>

      <div className="filters-content">
        <div className="filter-row">
          <div className="filter-group">
            <label>Company</label>
            <select 
              value={filters.companyId || ''} 
              onChange={(e) => handleFilterChange('companyId', e.target.value)}
            >
              <option value="">All Companies</option>
              <option value="google">Google</option>
              <option value="microsoft">Microsoft</option>
              <option value="amazon">Amazon</option>
              <option value="ola">Ola</option>
              <option value="uber">Uber</option>
              <option value="zomato">Zomato</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Department</label>
            <select 
              value={filters.department || ''} 
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Batch</label>
            <select 
              value={filters.batch || ''} 
              onChange={(e) => handleFilterChange('batch', e.target.value)}
            >
              <option value="">All Batches</option>
              <option value="2020">2020</option>
              <option value="2021">2021</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Role</label>
            <select 
              value={filters.role || ''} 
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button 
            className="clear-filters-btn"
            onClick={() => dispatch(setFilters({}))}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapFilters;

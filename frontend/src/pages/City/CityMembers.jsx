import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCityMembers } from '../../store/city.slice';

const CityMembers = () => {
  const { cityId } = useParams();
  const dispatch = useDispatch();
  const { members, loading, pagination } = useSelector(state => state.city);
  const [filters, setFilters] = useState({
    company: '',
    department: '',
    batch: ''
  });

  useEffect(() => {
    dispatch(fetchCityMembers({ cityId, ...filters }));
  }, [cityId, filters, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMessageClick = (userId) => {
    // Navigate to chat with user
    console.log('Message user:', userId);
  };

  return (
    <div className="city-members-container">
      <div className="members-header">
        <h1>Alumni in this City</h1>
        <p>{pagination?.totalCount || 0} members found</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Company</label>
          <select 
            value={filters.company} 
            onChange={(e) => handleFilterChange('company', e.target.value)}
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
            value={filters.department} 
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
            value={filters.batch} 
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
      </div>

      {loading ? (
        <div className="loading">Loading members...</div>
      ) : (
        <div className="members-grid">
          {members.map((member) => (
            <div key={member._id} className="member-card">
              <div className="member-avatar">
                <img 
                  src={member.avatar || '/default-avatar.png'} 
                  alt={member.name}
                />
                <div className="member-status">
                  {member.isOnline ? '🟢' : '⚫'}
                </div>
              </div>

              <div className="member-info">
                <h3>{member.name}</h3>
                <p className="member-role">{member.role}</p>
                
                {member.placement?.company && (
                  <div className="member-company">
                    <img 
                      src={member.placement.company.logo} 
                      alt={member.placement.company.name}
                      className="company-logo"
                    />
                    <span>{member.placement.company.name}</span>
                  </div>
                )}

                <div className="member-details">
                  <span>🎓 {member.department}</span>
                  <span>📅 Batch {member.batch}</span>
                  {member.placement?.role && (
                    <span>💼 {member.placement.role}</span>
                  )}
                </div>
              </div>

              <div className="member-actions">
                <button 
                  className="message-btn"
                  onClick={() => handleMessageClick(member._id)}
                >
                  💬 Message
                </button>
                <button className="connect-btn">
                  🤝 Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`page-btn ${pagination.currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => dispatch(fetchCityMembers({ 
                cityId, 
                ...filters, 
                page: i + 1 
              }))}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CityMembers;

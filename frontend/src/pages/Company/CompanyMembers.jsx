import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCompanyMembers } from '../../store/company.slice';

const CompanyMembers = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { members, loading, pagination } = useSelector(state => state.company);
  const [filters, setFilters] = useState({
    city: '',
    department: '',
    role: ''
  });

  useEffect(() => {
    dispatch(fetchCompanyMembers({ slug, ...filters }));
  }, [slug, filters, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="company-members-container">
      <div className="members-header">
        <h1>Company Alumni</h1>
        <p>{pagination?.totalCount || 0} members found</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>City</label>
          <select 
            value={filters.city} 
            onChange={(e) => handleFilterChange('city', e.target.value)}
          >
            <option value="">All Cities</option>
            <option value="bangalore">Bangalore</option>
            <option value="mumbai">Mumbai</option>
            <option value="delhi">Delhi</option>
            <option value="hyderabad">Hyderabad</option>
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
          </select>
        </div>

        <div className="filter-group">
          <label>Role</label>
          <select 
            value={filters.role} 
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="Software Engineer">Software Engineer</option>
            <option value="Product Manager">Product Manager</option>
            <option value="Data Scientist">Data Scientist</option>
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
              </div>

              <div className="member-info">
                <h3>{member.name}</h3>
                <p className="member-role">{member.placement?.role}</p>
                <p className="member-location">📍 {member.currentCity?.name}</p>
                
                <div className="member-details">
                  <span>🎓 {member.department}</span>
                  <span>📅 {member.batch}</span>
                </div>
              </div>

              <div className="member-actions">
                <button className="message-btn">💬 Message</button>
                <button className="connect-btn">🤝 Connect</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyMembers;

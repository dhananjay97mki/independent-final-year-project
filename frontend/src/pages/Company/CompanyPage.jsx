import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCompanyData, followCompany, unfollowCompany } from '../../store/company.slice';

const CompanyPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const { companyData, loading } = useSelector(state => state.company);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (slug) {
      dispatch(fetchCompanyData(slug));
    }
  }, [slug, dispatch]);

  const handleFollowToggle = () => {
    if (!companyData) return;
    
    const isFollowing = currentUser?.companiesFollowed?.includes(companyData._id);
    
    if (isFollowing) {
      dispatch(unfollowCompany(companyData._id));
    } else {
      dispatch(followCompany(companyData._id));
    }
  };

  if (loading) {
    return <div className="loading">Loading company information...</div>;
  }

  if (!companyData) {
    return <div className="error">Company not found</div>;
  }

  const isFollowing = currentUser?.companiesFollowed?.includes(companyData._id);

  return (
    <div className="company-page-container">
      <div className="company-header">
        <div className="company-logo">
          <img src={companyData.logo || '/default-company.png'} alt={companyData.name} />
        </div>
        
        <div className="company-info">
          <h1>{companyData.name}</h1>
          <p className="company-domains">
            {companyData.domains?.join(' • ')}
          </p>
          <div className="company-stats">
            <span>{companyData.alumniCount} Alumni</span>
            <span>•</span>
            <span>{companyData.cities?.length || 0} Cities</span>
          </div>
        </div>

        <div className="company-actions">
          <button 
            className={`follow-btn ${isFollowing ? 'following' : ''}`}
            onClick={handleFollowToggle}
          >
            {isFollowing ? '✓ Following' : '+ Follow'}
          </button>
          <button className="message-btn">
            💬 Join Company Room
          </button>
        </div>
      </div>

      <div className="company-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'alumni' ? 'active' : ''}`}
          onClick={() => setActiveTab('alumni')}
        >
          Alumni ({companyData.alumniCount})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        <button 
          className={`tab-btn ${activeTab === 'discussions' ? 'active' : ''}`}
          onClick={() => setActiveTab('discussions')}
        >
          Discussions
        </button>
      </div>

      <div className="company-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>🏢 Office Locations</h3>
                <div className="locations-list">
                  {companyData.cities?.map((city, index) => (
                    <span key={index} className="location-tag">{city}</span>
                  ))}
                </div>
              </div>

              <div className="stat-card">
                <h3>📊 Alumni Distribution</h3>
                <div className="distribution-chart">
                  {companyData.cityDistribution?.map((city, index) => (
                    <div key={index} className="distribution-item">
                      <span className="city-name">{city._id}</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(city.count / companyData.alumniCount) * 100}%` }}
                        ></div>
                      </div>
                      <span className="city-count">{city.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stat-card">
                <h3>🎓 Department Breakdown</h3>
                <div className="department-stats">
                  {companyData.departmentDistribution?.map((dept, index) => (
                    <div key={index} className="dept-item">
                      <span>{dept._id}</span>
                      <span className="dept-count">{dept.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stat-card">
                <h3>🌟 Recent Joiners</h3>
                <div className="recent-joiners">
                  {companyData.recentJoinees?.map((joiner, index) => (
                    <div key={index} className="joiner-item">
                      <img 
                        src={joiner.avatar || '/default-avatar.png'} 
                        alt={joiner.name}
                        className="joiner-avatar"
                      />
                      <div className="joiner-info">
                        <span className="joiner-name">{joiner.name}</span>
                        <span className="joiner-role">{joiner.placement?.role}</span>
                        <span className="join-date">
                          {new Date(joiner.placement?.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alumni' && (
          <div className="alumni-content">
            <p>Alumni list will be loaded here...</p>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="insights-content">
            <div className="insights-grid">
              <div className="insight-card">
                <h4>💼 Popular Roles</h4>
                <div className="roles-list">
                  <span>Software Engineer (45%)</span>
                  <span>Product Manager (20%)</span>
                  <span>Data Scientist (15%)</span>
                  <span>DevOps Engineer (10%)</span>
                  <span>Others (10%)</span>
                </div>
              </div>

              <div className="insight-card">
                <h4>📈 Career Growth</h4>
                <p>Average time to promotion: 2.3 years</p>
                <p>Internal mobility rate: 68%</p>
              </div>

              <div className="insight-card">
                <h4>💰 Compensation Insights</h4>
                <p>Average package: ₹15-25 LPA</p>
                <p>Top performer range: ₹30-50 LPA</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'discussions' && (
          <div className="discussions-content">
            <p>Company discussions will be loaded here...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyPage;

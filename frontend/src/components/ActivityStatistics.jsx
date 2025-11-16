import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ActivityStatistics.css';

const ActivityStatistics = ({ activityId, onClose }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [activityId]);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8080/api/submissions/statistics/activity/${activityId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Activity Statistics</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <p>No statistics available</p>
          </div>
        </div>
      </div>
    );
  }

  const submissionRate = statistics.totalSubmissions > 0
    ? ((statistics.totalSubmissions / statistics.totalStudents) * 100).toFixed(1)
    : 0;

  const gradingRate = statistics.totalSubmissions > 0
    ? ((statistics.gradedSubmissions / statistics.totalSubmissions) * 100).toFixed(1)
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Activity Statistics</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{statistics.totalSubmissions || 0}</h3>
                <p>Total Submissions</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{statistics.gradedSubmissions || 0}</h3>
                <p>Graded Submissions</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{statistics.pendingSubmissions || 0}</h3>
                <p>Pending Grading</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>{submissionRate}%</h3>
                <p>Submission Rate</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <h3>{gradingRate}%</h3>
                <p>Grading Progress</p>
              </div>
            </div>

            {statistics.averageScore !== null && statistics.averageScore !== undefined && (
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <h3>{statistics.averageScore.toFixed(1)}</h3>
                  <p>Average Score</p>
                </div>
              </div>
            )}
          </div>

          {statistics.scoreDistribution && (
            <div className="score-distribution">
              <h3>Score Distribution</h3>
              <div className="distribution-chart">
                {Object.entries(statistics.scoreDistribution).map(([range, count]) => (
                  <div key={range} className="distribution-bar">
                    <span className="range-label">{range}</span>
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${(count / statistics.totalSubmissions * 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className="count-label">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityStatistics;

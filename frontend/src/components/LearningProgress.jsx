import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LearningProgress.css';

const LearningProgress = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseProgress, setCourseProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.id) {
      fetchStudentCourses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseProgress();
    }
  }, [selectedCourse]);

  const fetchStudentCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/students/${user.id}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCourses(response.data.data || []);
        if (response.data.data && response.data.data.length > 0) {
          setSelectedCourse(response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8080/api/submissions/progress/student/${user.id}/course/${selectedCourse}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setCourseProgress(response.data);
    } catch (error) {
      console.error('Failed to fetch course progress:', error);
    }
  };

  const updateProgress = async (contentId, timeSpent) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:8080/api/student/progress',
        {
          contentId,
          timeSpent
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Progress updated successfully!');
      fetchCourseProgress();
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('Failed to update progress: ' + (error.response?.data?.message || error.message));
    }
  };

  const markContentCompleted = async (contentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8080/api/student/content/${contentId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Content marked as completed!');
      fetchCourseProgress();
    } catch (error) {
      console.error('Failed to mark content as completed:', error);
      alert('Failed to mark as completed: ' + (error.response?.data?.message || error.message));
    }
  };

  const getProgressPercentage = () => {
    if (!courseProgress) return 0;
    const { completed, total } = courseProgress;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'grade-a';
    if (grade >= 80) return 'grade-b';
    if (grade >= 70) return 'grade-c';
    if (grade >= 60) return 'grade-d';
    return 'grade-f';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading learning progress...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <h3>No Courses Enrolled</h3>
        <p>Enroll in courses to track your learning progress.</p>
      </div>
    );
  }

  return (
    <div className="learning-progress">
      <div className="content-header">
        <h2>📈 Learning Progress</h2>
        <p>Track your learning journey and achievements</p>
      </div>

      {/* Course Selector */}
      <div className="course-selector-container">
        <label>Select Course:</label>
        <select
          value={selectedCourse || ''}
          onChange={(e) => setSelectedCourse(parseInt(e.target.value))}
          className="course-select"
        >
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {courseProgress && (
        <>
          {/* Overall Progress */}
          <div className="progress-overview">
            <div className="progress-card">
              <h3>Overall Progress</h3>
              <div className="circular-progress">
                <svg width="120" height="120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#667eea"
                    strokeWidth="10"
                    strokeDasharray={`${getProgressPercentage() * 3.14} 314`}
                    strokeDashoffset="0"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="65" textAnchor="middle" fontSize="24" fill="#334155" fontWeight="bold">
                    {getProgressPercentage()}%
                  </text>
                </svg>
              </div>
              <p className="progress-text">
                {courseProgress.completed || 0} of {courseProgress.total || 0} items completed
              </p>
            </div>

            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-icon">🎯</div>
                <div className="stat-value">{courseProgress.activitiesCompleted || 0}</div>
                <div className="stat-label">Activities Done</div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{courseProgress.averageGrade || 0}%</div>
                <div className="stat-label">Average Grade</div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">⏱️</div>
                <div className="stat-value">{courseProgress.totalTimeSpent || 0}h</div>
                <div className="stat-label">Time Spent</div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{courseProgress.achievementsEarned || 0}</div>
                <div className="stat-label">Achievements</div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          {courseProgress.recentActivities && courseProgress.recentActivities.length > 0 && (
            <div className="recent-activities">
              <h3>Recent Activities</h3>
              <div className="activities-list">
                {courseProgress.recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-progress-item">
                    <div className="activity-info">
                      <h4>{activity.title}</h4>
                      <p className="activity-date">
                        {activity.submittedAt
                          ? `Submitted: ${new Date(activity.submittedAt).toLocaleDateString()}`
                          : 'Not submitted yet'}
                      </p>
                    </div>
                    <div className="activity-status">
                      {activity.score !== null && activity.score !== undefined ? (
                        <div className={`grade-badge ${getGradeColor(activity.score)}`}>
                          {activity.score}%
                        </div>
                      ) : (
                        <div className="status-pending">Pending</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study Time Tracker */}
          <div className="study-time-tracker">
            <h3>Log Study Time</h3>
            <p>Track time spent on course materials and activities</p>
            <div className="time-log-form">
              <input
                type="number"
                placeholder="Content ID"
                id="contentId"
                min="1"
              />
              <input
                type="number"
                placeholder="Minutes spent"
                id="timeSpent"
                min="1"
              />
              <button
                className="btn-primary"
                onClick={() => {
                  const contentId = document.getElementById('contentId').value;
                  const timeSpent = document.getElementById('timeSpent').value;
                  if (contentId && timeSpent) {
                    updateProgress(parseInt(contentId), parseInt(timeSpent));
                    document.getElementById('contentId').value = '';
                    document.getElementById('timeSpent').value = '';
                  } else {
                    alert('Please enter both content ID and time spent');
                  }
                }}
              >
                Log Time
              </button>
            </div>
          </div>

          {/* Completion Tracker */}
          <div className="completion-tracker">
            <h3>Mark Content as Completed</h3>
            <p>Track your progress by marking completed lessons and materials</p>
            <div className="completion-form">
              <input
                type="number"
                placeholder="Content ID"
                id="completeContentId"
                min="1"
              />
              <button
                className="btn-success"
                onClick={() => {
                  const contentId = document.getElementById('completeContentId').value;
                  if (contentId) {
                    markContentCompleted(parseInt(contentId));
                    document.getElementById('completeContentId').value = '';
                  } else {
                    alert('Please enter content ID');
                  }
                }}
              >
                ✓ Mark Complete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LearningProgress;

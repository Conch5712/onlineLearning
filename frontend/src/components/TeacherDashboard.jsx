import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CourseManagement from './CourseManagement';
import ActivityManagement from './ActivityManagement';
import StudentManagement from './StudentManagement';
import GradingWorkbench from './GradingWorkbench';
import ChapterManagement from './ChapterManagement';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('home');
  const [recentSubmissions, setRecentSubmissions] = useState([]);

  const modules = [
    { 
      id: 'home', 
      name: 'Teacher Dashboard', 
      description: 'Teacher work overview',
      icon: '🏠'
    },
    {
      id: 'courses',
      name: 'Course Management',
      description: 'Create and manage course content',
      icon: '📚',
      badge: '5'
    },
    {
      id: 'chapters',
      name: 'Chapter Management',
      description: 'Organize course content into chapters',
      icon: '📖'
    },
    {
      id: 'activities',
      name: 'Activity Management',
      description: 'Create and manage course activities',
      icon: '🎯',
      badge: '12'
    },
    {
      id: 'students',
      name: 'Student Management',
      description: 'View and manage student information',
      icon: '👥'
    },
    {
      id: 'grading',
      name: 'Grading Workbench',
      description: 'Grade student submissions and manage feedback',
      icon: '📝'
    },
    {
      id: 'analytics',
      name: 'Teaching Analytics',
      description: 'View teaching data and student performance',
      icon: '📊'
    },
    { 
      id: 'calendar', 
      name: 'Teaching Schedule', 
      description: 'Manage course schedules and important events',
      icon: '📅'
    },
    { 
      id: 'ai', 
      name: 'AI Teaching Assistant', 
      description: 'Intelligent teaching assistance tools',
      icon: '🤖'
    },
    { 
      id: 'profile', 
      name: 'Profile Center', 
      description: 'Manage personal information and settings',
      icon: '👤'
    }
  ];

  useEffect(() => {
    if (user && user.id && activeModule === 'home') {
      fetchRecentSubmissions();
    }
  }, [user, activeModule]);

  const fetchRecentSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8080/api/submissions/recent/teacher/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setRecentSubmissions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch recent submissions:', error);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderModuleContent = () => {
    switch(activeModule) {
      case 'home':
        return (
          <div className="module-content-area">
            <div className="content-header">
              <h2>👨‍🏫 Teacher Dashboard</h2>
              <p>Welcome back, {user?.fullName || user?.username}! Manage your courses and students.</p>
            </div>
            
            <div className="dashboard-stats">
              <div className="stat-item">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>5</h3>
                  <p>Active Courses</p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>186</h3>
                  <p>Total Students</p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <h3>23</h3>
                  <p>Pending Grading</p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">⏰</div>
                <div className="stat-info">
                  <h3>18</h3>
                  <p>Weekly Hours</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>📋 Recent Submissions</h3>
              <div className="activity-feed">
                {recentSubmissions.length === 0 ? (
                  <div className="empty-activity">
                    <p>No recent submissions to display</p>
                  </div>
                ) : (
                  recentSubmissions.slice(0, 5).map((submission, index) => (
                    <div key={submission.id || index} className="activity-item">
                      <div className="activity-icon">
                        {submission.status === 'SUBMITTED' ? '🎯' :
                         submission.status === 'GRADED' ? '✅' : '🔄'}
                      </div>
                      <div className="activity-content">
                        <h4>Student #{submission.studentId} - Activity #{submission.activityId}</h4>
                        <p>
                          Status: {submission.status} |
                          {submission.score !== null && submission.score !== undefined
                            ? ` Score: ${submission.score} pts | `
                            : ' '}
                          {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                      <div className="activity-action">
                        <button
                          className="btn-primary"
                          onClick={() => setActiveModule('grading')}
                        >
                          {submission.status === 'SUBMITTED' ? 'Grade Now' : 'View'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="upcoming-events">
              <h3>📅 Today's Class Schedule</h3>
              <div className="events-list">
                <div className="event-item">
                  <div className="event-time">
                    <span className="time">14:00</span>
                    <span className="date">Today</span>
                  </div>
                  <div className="event-details">
                    <h4>Data Structures & Algorithms</h4>
                    <p>Classroom A101 | 45 students</p>
                  </div>
                </div>
                <div className="event-item">
                  <div className="event-time">
                    <span className="time">16:30</span>
                    <span className="date">Today</span>
                  </div>
                  <div className="event-details">
                    <h4>Office Hours Q&A</h4>
                    <p>Office | Appointments: 8 students</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'courses':
        return <CourseManagement user={user} />;

      case 'chapters':
        return <ChapterManagement user={user} />;

      case 'activities':
        return <ActivityManagement user={user} />;

      case 'students':
        return <StudentManagement />;

      case 'grading':
        return <GradingWorkbench user={user} />;

      default:
        return (
          <div className="module-content-area">
            <div className="content-header">
              <h2>{modules.find(m => m.id === activeModule)?.icon} {modules.find(m => m.id === activeModule)?.name}</h2>
              <p>{modules.find(m => m.id === activeModule)?.description}</p>
            </div>
            <div className="placeholder-content">
              <div className="placeholder-icon">{modules.find(m => m.id === activeModule)?.icon}</div>
              <h3>Under Development</h3>
              <p>Detailed features for this module are under development, stay tuned...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="blackboard-dashboard">
      {/* Top navigation bar */}
      <header className="top-header">
        <div className="header-left">
          <div className="logo">👨‍🏫</div>
          <h1>PolyU Teaching Hub</h1>
        </div>
        <div className="header-right">
          <div className="search-container">
            <input type="text" placeholder="Search courses, students..." />
            <span className="search-icon">🔍</span>
          </div>
          <div className="user-menu">
            <div className="notifications">
              <span className="notification-icon">🔔</span>
              <span className="notification-count">5</span>
            </div>
            <div className="user-profile">
              <img src={`https://ui-avatars.com/api/?name=${user?.fullName || user?.username}&background=764ba2&color=fff`} alt="User" />
              <span className="user-name">{user?.fullName || user?.username}</span>
              <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Left sidebar */}
        <aside className="left-sidebar">
          <nav className="navigation-menu">
            {modules.map(module => (
              <div 
                key={module.id}
                className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
                onClick={() => setActiveModule(module.id)}
              >
                <span className="nav-icon">{module.icon}</span>
                <span className="nav-text">{module.name}</span>
                {module.badge && <span className="nav-badge">{module.badge}</span>}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content area */}
        <main className="main-content-area">
          {renderModuleContent()}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
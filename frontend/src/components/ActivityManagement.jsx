import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FileUpload from './FileUpload';
import FileList from './FileList';
import '../activities.css';

const ActivityManagement = ({ user }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedActivityType, setSelectedActivityType] = useState('ASSIGNMENT');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicatingActivity, setDuplicatingActivity] = useState(null);
  const [targetCourseId, setTargetCourseId] = useState('');

  // 文件管理状态
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  // New activity form data
  const [newActivity, setNewActivity] = useState({
    courseId: '',
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    maxScore: 100,
    submissionType: 'FILE',
    activityType: 'ASSIGNMENT',
    isRequired: true,
    attemptsAllowed: 1,
    timeLimitMinutes: null,
    gradingMethod: 'MANUAL',
    configuration: {}
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchActivities(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/teacher/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.data.length > 0) {
        setCourses(response.data.data);
        setSelectedCourse(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/activities/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setActivities(response.data || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const createActivity = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('Token:', token); // 调试token
      console.log('Stored user string:', storedUser); // 调试存储的用户字符串
      console.log('User object:', user); // 调试用户对象
      console.log('User id:', user?.id); // 调试用户ID
      
      // 如果用户对象为空，尝试从localStorage重新获取
      let currentUser = user;
      if (!currentUser && storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
          console.log('Parsed user from localStorage:', currentUser);
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
      
      if (!currentUser || !currentUser.id) {
        alert('User information is missing. Please login again.');
        return;
      }
      
      // 格式化日期为 yyyy-MM-dd HH:mm:ss 格式
      const formatDateTime = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };
      
      const activityData = {
        ...newActivity,
        courseId: parseInt(selectedCourse),
        teacherId: currentUser.id,
        dueDate: formatDateTime(newActivity.dueDate)
      };
      
      console.log('Creating activity with data:', activityData);
      
      const response = await axios.post(
        'http://localhost:8080/api/activities', 
        activityData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Activity created successfully:', response.data);
      
      // 如果有附件文件，更新它们的entityId为新创建的活动ID
      if (attachmentFiles.length > 0) {
        try {
          for (const file of attachmentFiles) {
            await axios.put(`http://localhost:8080/api/files/${file.id}/entity`, {
              entityType: 'ACTIVITY',
              entityId: response.data.id
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          console.log('File associations updated successfully');
        } catch (fileError) {
          console.error('Failed to associate files with activity:', fileError);
          // 不阻止活动创建成功的提示，但记录错误
        }
      }
      setActivities([response.data, ...activities]);
      setShowCreateForm(false);
      resetForm();
      alert('Activity created successfully!');
    } catch (error) {
      console.error('Failed to create activity:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to create activity: ' + (error.response?.data?.message || error.message));
    }
  };

  const publishActivity = async (activityId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/activities/${activityId}/publish`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setActivities(activities.map(activity => 
        activity.id === activityId 
          ? { ...activity, isPublished: true }
          : activity
      ));
      alert('Activity published successfully!');
    } catch (error) {
      console.error('Failed to publish activity:', error);
      alert('Failed to publish activity, please try again');
    }
  };

  const deleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/activities/${activityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActivities(activities.filter(activity => activity.id !== activityId));
      alert('Activity deleted successfully!');
    } catch (error) {
      console.error('Failed to delete activity:', error);
      alert('Failed to delete activity, please try again');
    }
  };

  const openEditForm = (activity) => {
    // 格式化日期为 datetime-local 输入格式
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setEditingActivity({
      ...activity,
      dueDate: formatDateForInput(activity.dueDate)
    });
    setShowEditForm(true);
  };

  const updateActivity = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      // 格式化日期为后端需要的格式
      const formatDateTime = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const activityData = {
        ...editingActivity,
        dueDate: formatDateTime(editingActivity.dueDate)
      };

      console.log('Updating activity with data:', activityData);

      const response = await axios.put(
        `http://localhost:8080/api/activities/${editingActivity.id}`,
        activityData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Activity updated successfully:', response.data);

      setActivities(activities.map(activity =>
        activity.id === editingActivity.id ? response.data : activity
      ));
      setShowEditForm(false);
      setEditingActivity(null);
      alert('Activity updated successfully!');
    } catch (error) {
      console.error('Failed to update activity:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to update activity: ' + (error.response?.data?.message || error.message));
    }
  };

  const openDuplicateModal = (activity) => {
    setDuplicatingActivity(activity);
    setTargetCourseId(selectedCourse);
    setShowDuplicateModal(true);
  };

  const duplicateActivity = async () => {
    if (!targetCourseId) {
      alert('Please select a target course');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8080/api/activities/${duplicatingActivity.id}/duplicate?targetCourseId=${targetCourseId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Activity duplicated successfully!');
      setShowDuplicateModal(false);
      setDuplicatingActivity(null);

      // 如果目标课程是当前课程,刷新列表
      if (parseInt(targetCourseId) === parseInt(selectedCourse)) {
        fetchActivities(selectedCourse);
      }
    } catch (error) {
      console.error('Failed to duplicate activity:', error);
      alert('Failed to duplicate activity: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setNewActivity({
      courseId: '',
      title: '',
      description: '',
      instructions: '',
      dueDate: '',
      maxScore: 100,
      submissionType: 'FILE',
      activityType: 'ASSIGNMENT',
      isRequired: true,
      attemptsAllowed: 1,
      timeLimitMinutes: null,
      gradingMethod: 'MANUAL',
      configuration: {}
    });
    setAttachmentFiles([]);
  };

  // 文件上传处理函数
  const handleFileUploadSuccess = (uploadedFiles) => {
    console.log('Files uploaded successfully:', uploadedFiles);
    
    // 如果是单个文件，转换为数组
    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
    
    // 添加到附件文件列表
    setAttachmentFiles(prevFiles => [...prevFiles, ...files]);
  };

  const handleFileUploadError = (error) => {
    console.error('File upload error:', error);
    alert(`文件上传失败: ${error}`);
  };

  const handleFileDelete = (fileToDelete) => {
    setAttachmentFiles(prevFiles => 
      prevFiles.filter(file => file.fileName !== fileToDelete.fileName)
    );
  };

  const getActivityTypeText = (type) => {
    switch(type) {
      case 'ASSIGNMENT': return 'Assignment';
      case 'QUIZ': return 'Quiz';
      case 'ANNOUNCEMENT': return 'Announcement';
      case 'PRACTICE': return 'Practice';
      default: return type;
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'ASSIGNMENT': return '📝';
      case 'QUIZ': return '🧪';
      case 'ANNOUNCEMENT': return '📢';
      case 'PRACTICE': return '🏃‍♂️';
      default: return '📋';
    }
  };

  const getSubmissionTypeText = (type) => {
    switch(type) {
      case 'FILE': return 'File Upload';
      case 'TEXT': return 'Text Entry';
      case 'MULTIPLE_CHOICE': return 'Multiple Choice';
      case 'URL': return 'URL Link';
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US');
  };

  const filteredActivities = activities.filter(activity => {
    let typeMatch = true;
    if (selectedActivityType && selectedActivityType !== 'ALL') {
      typeMatch = activity.activityType === selectedActivityType;
    }

    switch(activeTab) {
      case 'published':
        return activity.isPublished && typeMatch;
      case 'draft':
        return !activity.isPublished && typeMatch;
      default:
        return typeMatch;
    }
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="activity-management">
      <div className="content-header">
        <h2>🎯 Activity Management</h2>
        <div className="header-actions">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="course-selector"
          >
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <select
            value={selectedActivityType}
            onChange={(e) => setSelectedActivityType(e.target.value)}
            className="type-selector"
          >
            <option value="">All Types</option>
            <option value="ASSIGNMENT">Assignments</option>
            <option value="QUIZ">Quizzes</option>
            <option value="ANNOUNCEMENT">Announcements</option>
            <option value="PRACTICE">Practices</option>
          </select>
          <button 
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
            disabled={!selectedCourse}
          >
            + New Activity
          </button>
        </div>
      </div>

      {/* Activity tabs */}
      <div className="activity-tabs">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({filteredActivities.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          Published ({activities.filter(a => a.isPublished).length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'draft' ? 'active' : ''}`}
          onClick={() => setActiveTab('draft')}
        >
          Draft ({activities.filter(a => !a.isPublished).length})
        </button>
      </div>

      {/* Create activity form */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Create New Activity</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={createActivity}>
              <div className="form-row">
                <div className="form-group">
                  <label>Activity Type</label>
                  <select
                    value={newActivity.activityType}
                    onChange={(e) => setNewActivity({...newActivity, activityType: e.target.value})}
                    required
                  >
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="PRACTICE">Practice</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Submission Type</label>
                  <select
                    value={newActivity.submissionType}
                    onChange={(e) => setNewActivity({...newActivity, submissionType: e.target.value})}
                  >
                    <option value="FILE">File Upload</option>
                    <option value="TEXT">Text Entry</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="URL">URL Link</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Activity Title</label>
                <input
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                  required
                  placeholder="Enter activity title"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  placeholder="Enter activity description"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Instructions</label>
                <textarea
                  value={newActivity.instructions}
                  onChange={(e) => setNewActivity({...newActivity, instructions: e.target.value})}
                  placeholder="Detailed requirements and instructions"
                  rows="5"
                />
              </div>
              
              {/* 文件上传区域 */}
              <div className="form-group">
                <label>Activity Attachments</label>
                <p className="field-description">
                  Upload files that students will need for this activity (e.g., templates, reference materials, datasets)
                </p>
                <FileUpload
                  entityType="ACTIVITY"
                  entityId={null} // 活动还未创建，创建后再关联
                  onUploadSuccess={handleFileUploadSuccess}
                  multiple={true}
                  accept=".pdf,.doc,.docx,.txt,.md,.jpg,.png,.zip,.rar,.xlsx,.pptx"
                  maxSize={50 * 1024 * 1024} // 50MB
                  maxFiles={10}
                />
                {attachmentFiles.length > 0 && (
                  <FileList
                    files={attachmentFiles}
                    onDelete={handleFileDelete}
                    showActions={true}
                  />
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="datetime-local"
                    value={newActivity.dueDate}
                    onChange={(e) => setNewActivity({...newActivity, dueDate: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Max Score</label>
                  <input
                    type="number"
                    value={newActivity.maxScore}
                    onChange={(e) => setNewActivity({...newActivity, maxScore: parseFloat(e.target.value)})}
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Attempts Allowed</label>
                  <input
                    type="number"
                    value={newActivity.attemptsAllowed}
                    onChange={(e) => setNewActivity({...newActivity, attemptsAllowed: parseInt(e.target.value)})}
                    min="-1"
                    placeholder="-1 for unlimited"
                  />
                </div>
              </div>

              {newActivity.activityType === 'QUIZ' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Time Limit (minutes)</label>
                    <input
                      type="number"
                      value={newActivity.timeLimitMinutes || ''}
                      onChange={(e) => setNewActivity({...newActivity, timeLimitMinutes: parseInt(e.target.value) || null})}
                      min="1"
                      placeholder="Optional time limit"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Grading Method</label>
                    <select
                      value={newActivity.gradingMethod}
                      onChange={(e) => setNewActivity({...newActivity, gradingMethod: e.target.value})}
                    >
                      <option value="AUTO">Auto Grade</option>
                      <option value="MANUAL">Manual Grade</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newActivity.isRequired}
                    onChange={(e) => setNewActivity({...newActivity, isRequired: e.target.checked})}
                  />
                  Required Activity
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit activity form */}
      {showEditForm && editingActivity && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Edit Activity</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingActivity(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={updateActivity}>
              <div className="form-row">
                <div className="form-group">
                  <label>Activity Type</label>
                  <select
                    value={editingActivity.activityType}
                    onChange={(e) => setEditingActivity({...editingActivity, activityType: e.target.value})}
                    required
                  >
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="PRACTICE">Practice</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Submission Type</label>
                  <select
                    value={editingActivity.submissionType}
                    onChange={(e) => setEditingActivity({...editingActivity, submissionType: e.target.value})}
                  >
                    <option value="FILE">File Upload</option>
                    <option value="TEXT">Text Entry</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="URL">URL Link</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Activity Title</label>
                <input
                  type="text"
                  value={editingActivity.title}
                  onChange={(e) => setEditingActivity({...editingActivity, title: e.target.value})}
                  required
                  placeholder="Enter activity title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingActivity.description || ''}
                  onChange={(e) => setEditingActivity({...editingActivity, description: e.target.value})}
                  placeholder="Enter activity description"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Instructions</label>
                <textarea
                  value={editingActivity.instructions || ''}
                  onChange={(e) => setEditingActivity({...editingActivity, instructions: e.target.value})}
                  placeholder="Detailed requirements and instructions"
                  rows="5"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="datetime-local"
                    value={editingActivity.dueDate}
                    onChange={(e) => setEditingActivity({...editingActivity, dueDate: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Max Score</label>
                  <input
                    type="number"
                    value={editingActivity.maxScore}
                    onChange={(e) => setEditingActivity({...editingActivity, maxScore: parseFloat(e.target.value)})}
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Attempts Allowed</label>
                  <input
                    type="number"
                    value={editingActivity.attemptsAllowed}
                    onChange={(e) => setEditingActivity({...editingActivity, attemptsAllowed: parseInt(e.target.value)})}
                    min="-1"
                    placeholder="-1 for unlimited"
                  />
                </div>
              </div>

              {editingActivity.activityType === 'QUIZ' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Time Limit (minutes)</label>
                    <input
                      type="number"
                      value={editingActivity.timeLimitMinutes || ''}
                      onChange={(e) => setEditingActivity({...editingActivity, timeLimitMinutes: parseInt(e.target.value) || null})}
                      min="1"
                      placeholder="Optional time limit"
                    />
                  </div>

                  <div className="form-group">
                    <label>Grading Method</label>
                    <select
                      value={editingActivity.gradingMethod}
                      onChange={(e) => setEditingActivity({...editingActivity, gradingMethod: e.target.value})}
                    >
                      <option value="AUTO">Auto Grade</option>
                      <option value="MANUAL">Manual Grade</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingActivity.isRequired}
                    onChange={(e) => setEditingActivity({...editingActivity, isRequired: e.target.checked})}
                  />
                  Required Activity
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowEditForm(false);
                  setEditingActivity(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activities list */}
      <div className="activities-list">
        {filteredActivities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No activities found</h3>
            <p>Click "New Activity" to create your first activity</p>
            <button 
              className="btn-primary"
              onClick={() => setShowCreateForm(true)}
              disabled={!selectedCourse}
            >
              Create Activity
            </button>
          </div>
        ) : (
          filteredActivities.map(activity => (
            <div key={activity.id} className="activity-card">
              <div className="activity-header">
                <div className="activity-title">
                  <span className="activity-icon">{getActivityIcon(activity.activityType)}</span>
                  <div>
                    <h3>{activity.title}</h3>
                    <span className="activity-type">{getActivityTypeText(activity.activityType)}</span>
                  </div>
                  <div className={`activity-status ${activity.isPublished ? 'published' : 'draft'}`}>
                    {activity.isPublished ? 'Published' : 'Draft'}
                  </div>
                </div>
                <div className="activity-score">
                  Max Score: {activity.maxScore} pts
                </div>
              </div>
              
              <div className="activity-content">
                <p className="activity-description">{activity.description}</p>
                
                <div className="activity-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span>Due: {formatDate(activity.dueDate) || 'No due date'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📎</span>
                    <span>Type: {getSubmissionTypeText(activity.submissionType)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">🔄</span>
                    <span>Attempts: {activity.attemptsAllowed === -1 ? 'Unlimited' : activity.attemptsAllowed}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">⏰</span>
                    <span>Created: {formatDate(activity.createdAt)}</span>
                  </div>
                </div>

                {activity.activityType === 'QUIZ' && activity.timeLimitMinutes && (
                  <div className="quiz-info">
                    <span className="meta-icon">⏱️</span>
                    <span>Time Limit: {activity.timeLimitMinutes} minutes</span>
                  </div>
                )}
              </div>
              
              <div className="activity-actions">
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/activity/${activity.id}`)}
                >
                  查看详情
                </button>
                {!activity.isPublished && (
                  <button
                    className="btn-primary"
                    onClick={() => publishActivity(activity.id)}
                  >
                    Publish
                  </button>
                )}
                <button className="btn-secondary">
                  View Submissions (0)
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => openEditForm(activity)}
                >
                  Edit
                </button>
                <button
                  className="btn-info"
                  onClick={() => openDuplicateModal(activity)}
                >
                  📋 Duplicate
                </button>
                <button
                  className="btn-danger"
                  onClick={() => deleteActivity(activity.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Duplicate Activity Modal */}
      {showDuplicateModal && duplicatingActivity && (
        <div className="modal-overlay" onClick={() => setShowDuplicateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Duplicate Activity</h3>
              <button className="close-btn" onClick={() => setShowDuplicateModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="duplicate-info">
                <p><strong>Activity to duplicate:</strong></p>
                <div className="activity-preview">
                  <span className="activity-icon">{getActivityIcon(duplicatingActivity.activityType)}</span>
                  <div>
                    <h4>{duplicatingActivity.title}</h4>
                    <p>{getActivityTypeText(duplicatingActivity.activityType)} • Max Score: {duplicatingActivity.maxScore} pts</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Select Target Course *</label>
                <select
                  value={targetCourseId}
                  onChange={(e) => setTargetCourseId(e.target.value)}
                  required
                >
                  <option value="">-- Select a course --</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <small>The activity will be duplicated to the selected course as a draft.</small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDuplicateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={duplicateActivity}>
                Duplicate Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityManagement;
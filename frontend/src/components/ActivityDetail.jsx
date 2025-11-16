import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import FileUpload from './FileUpload';
import FileList from './FileList';
import './ActivityDetail.css';

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissionModal, setSubmissionModal] = useState(false);
  const [gradingModal, setGradingModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  
  // 文件相关状态
  const [activityFiles, setActivityFiles] = useState([]);
  const [submissionFiles, setSubmissionFiles] = useState([]);
  
  const [submissionData, setSubmissionData] = useState({
    submissionText: '',
    fileUrls: []
  });
  const [gradingData, setGradingData] = useState({
    score: '',
    feedback: ''
  });

  // 获取活动附件
  const fetchActivityFiles = async () => {
    try {
      const response = await api.get(`/files/list/ACTIVITY/${id}`);
      setActivityFiles(response.data);
    } catch (error) {
      console.error('获取活动附件失败:', error);
    }
  };

  // 处理提交文件上传成功
  const handleSubmissionFilesUploaded = (uploadedFiles) => {
    const fileUrls = uploadedFiles.map(file => file.downloadUrl);
    setSubmissionData(prev => ({
      ...prev,
      fileUrls: [...prev.fileUrls, ...fileUrls]
    }));
    setSubmissionFiles(prev => [...prev, ...uploadedFiles]);
  };

  // 删除提交文件
  const handleDeleteSubmissionFile = async (fileId) => {
    try {
      await api.delete(`/files/${fileId}`);
      setSubmissionFiles(prev => prev.filter(file => file.id !== fileId));
      setSubmissionData(prev => ({
        ...prev,
        fileUrls: prev.fileUrls.filter(url => !url.includes(fileId))
      }));
    } catch (error) {
      console.error('删除文件失败:', error);
      alert('删除文件失败');
    }
  };

  useEffect(() => {
    fetchActivityDetail();
    fetchActivityFiles();
    if (user?.role === 'TEACHER') {
      fetchSubmissions();
      fetchTopPerformers();
    } else if (user?.role === 'STUDENT') {
      fetchMySubmission();
    }
  }, [id]);

  const fetchActivityDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/activities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivity(response.data);
    } catch (error) {
      console.error('Failed to fetch activity detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/submissions/activity/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const fetchTopPerformers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8080/api/submissions/top-performers/activity/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTopPerformers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch top performers:', error);
    }
  };

  const fetchMySubmission = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/submissions/activity/${id}/student/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMySubmission(response.data);
    } catch (error) {
      console.error('No submission found or error:', error);
      setMySubmission(null);
    }
  };

  const submitActivity = async () => {
    if (!submissionData.submissionText.trim()) {
      alert('Please enter your submission text');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/submissions', {
        activityId: parseInt(id),
        studentId: user.id,
        submissionText: submissionData.submissionText,
        fileUrls: submissionData.fileUrls
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Submission successful!');
      setSubmissionModal(false);
      setSubmissionData({ submissionText: '', fileUrls: [] });
      fetchMySubmission();
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Submission failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const gradeSubmission = async () => {
    if (!gradingData.score || gradingData.score < 0 || gradingData.score > activity.maxScore) {
      alert(`Please enter a valid score (0-${activity.maxScore})`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:8080/api/submissions/${gradingModal.id}/grade`, {
        score: parseFloat(gradingData.score),
        feedback: gradingData.feedback
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Grading successful!');
      setGradingModal(null);
      setGradingData({ score: '', feedback: '' });
      fetchSubmissions();
    } catch (error) {
      console.error('Grading failed:', error);
      alert('Grading failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const autoGradeQuiz = async (submissionId) => {
    if (!window.confirm('Auto-grade this quiz submission? This will automatically calculate the score based on correct answers.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/submissions/${submissionId}/auto-grade`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Quiz graded automatically!');
      fetchSubmissions();
    } catch (error) {
      console.error('Auto-grading failed:', error);
      alert('Auto-grading failed: ' + (error.response?.data?.message || error.message));
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

  const getActivityTypeText = (type) => {
    switch(type) {
      case 'ASSIGNMENT': return 'Assignment';
      case 'QUIZ': return 'Quiz';
      case 'ANNOUNCEMENT': return 'Announcement';
      case 'PRACTICE': return 'Practice';
      default: return type;
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'SUBMITTED': return 'info';
      case 'GRADED': return 'success';
      case 'RETURNED': return 'warning';
      default: return 'primary';
    }
  };

  const canSubmit = (activity) => {
    if (!activity || activity.activityType === 'ANNOUNCEMENT') return false;
    if (mySubmission) return false;
    if (activity.dueDate && new Date() > new Date(activity.dueDate)) return false;
    return true;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US');
  };

  if (loading) {
    return (
      <div className="activity-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="activity-detail-container">
        <div className="empty-state">
          <div className="icon">😕</div>
          <h3>Activity not found</h3>
          <p>The activity you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-detail-container">
      <div className="activity-detail-content">
        {/* Header */}
        <div className="activity-header">
          <div className="header-content">
            <button onClick={() => navigate(-1)} className="back-button">
              ← Back
            </button>
            <h1 className="activity-title">
              <span className="icon">{getActivityIcon(activity.activityType)}</span>
              {activity.title}
            </h1>
            <div className="activity-meta">
              <span className="meta-badge">{activity.activityType}</span>
              {activity.courseName && <span className="meta-badge">📚 {activity.courseName}</span>}
              {activity.isRequired && <span className="meta-badge">⭐ Required</span>}
              <span className={`meta-badge status-badge ${activity.isPublished ? 'published' : 'draft'}`}>
                {activity.isPublished ? '✅ Published' : '📝 Draft'}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="activity-body">
          {/* Information Grid */}
          <div className="info-grid">
            <div className="info-card">
              <h3><span className="icon">📋</span>Activity Information</h3>
              <div className="info-item">
                <span className="info-label">Description</span>
                <span className="info-value">{activity.description || 'No description'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type</span>
                <span className="info-value">{getActivityTypeText(activity.activityType)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Submission Type</span>
                <span className="info-value">{getSubmissionTypeText(activity.submissionType)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Required</span>
                <span className="info-value">{activity.isRequired ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="info-card">
              <h3><span className="icon">⏰</span>Schedule & Scoring</h3>
              <div className="info-item">
                <span className="info-label">Available From</span>
                <span className="info-value">{formatDate(activity.availableFrom)}</span>
              </div>
              {activity.dueDate && (
                <div className="info-item">
                  <span className="info-label">Due Date</span>
                  <span className="info-value">{formatDate(activity.dueDate)}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Max Score</span>
                <span className="info-value">{activity.maxScore} points</span>
              </div>
              <div className="info-item">
                <span className="info-label">Attempts Allowed</span>
                <span className="info-value">{activity.attemptsAllowed === -1 ? 'Unlimited' : activity.attemptsAllowed}</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {activity.instructions && (
            <div className="info-card" style={{marginBottom: '30px'}}>
              <h3><span className="icon">📖</span>Instructions</h3>
              <div style={{color: '#475569', lineHeight: '1.6'}}>{activity.instructions}</div>
            </div>
          )}

          {/* Activity Attachments */}
          {activityFiles.length > 0 && (
            <div className="info-card" style={{marginBottom: '30px'}}>
              <h3><span className="icon">📎</span>Activity Attachments</h3>
              <div className="file-attachments">
                <FileList 
                  files={activityFiles}
                  showActions={false}
                  showDownload={true}
                />
              </div>
            </div>
          )}

          {/* Student View */}
          {user?.role === 'STUDENT' && (
            <div className="submissions-section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="icon">📤</span>My Submission
                </h2>
                {!mySubmission && canSubmit(activity) && (
                  <button onClick={() => setSubmissionModal(true)} className="btn-primary">
                    Submit Work
                  </button>
                )}
              </div>

              {mySubmission ? (
                <div className="submission-card">
                  <div className="submission-header">
                    <div>
                      <h4>Submission Details</h4>
                      <p style={{color: '#64748b', margin: '5px 0'}}>
                        Submitted on {formatDate(mySubmission.submittedAt)}
                      </p>
                    </div>
                    <span className={`status-badge ${getStatusColor(mySubmission.status)}`}>
                      {mySubmission.status}
                    </span>
                  </div>
                  
                  {mySubmission.submissionText && (
                    <div className="submission-content">
                      <h5>Submission Text:</h5>
                      <p>{mySubmission.submissionText}</p>
                    </div>
                  )}

                  {mySubmission.score !== null && mySubmission.score !== undefined && (
                    <div className="score-display">
                      Score: {mySubmission.score}/{activity.maxScore}
                    </div>
                  )}

                  <div className="submission-actions">
                    <button 
                      onClick={() => setViewModal(mySubmission)}
                      className="btn-secondary"
                    >
                      📄 View Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="icon">📝</div>
                  <h3>No submission yet</h3>
                  <p>{canSubmit(activity) ? 'Click "Submit Work" to start your submission' : 'Submission is not available at this time'}</p>
                </div>
              )}
            </div>
          )}

          {/* Teacher View */}
          {user?.role === 'TEACHER' && (
            <div className="submissions-section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="icon">📊</span>Student Submissions ({submissions.length})
                </h2>
              </div>

              {submissions.length > 0 ? (
                <div className="submissions-grid">
                  {submissions.map(submission => (
                    <div key={submission.id} className="submission-card">
                      <div className="submission-header">
                        <div className="student-info">
                          <div className="student-avatar">
                            {submission.studentName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <h4>{submission.studentName || `Student ${submission.studentId}`}</h4>
                            <p style={{color: '#64748b', margin: '5px 0'}}>
                              Submitted {formatDate(submission.submittedAt)}
                            </p>
                          </div>
                        </div>
                        <span className={`status-badge ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </div>

                      {submission.submissionText && (
                        <div className="submission-content">
                          <h5>Submission:</h5>
                          <p>{submission.submissionText}</p>
                        </div>
                      )}

                      {submission.score !== null && submission.score !== undefined ? (
                        <div className="score-display">
                          Score: {submission.score}/{activity.maxScore}
                        </div>
                      ) : null}

                      {submission.feedback && (
                        <div className="feedback-display">
                          <h5>Your Feedback:</h5>
                          <p>{submission.feedback}</p>
                        </div>
                      )}

                      <div className="submission-actions">
                        <button
                          onClick={() => setViewModal(submission)}
                          className="btn-secondary"
                          style={{marginRight: '10px'}}
                        >
                          👁️ View Details
                        </button>
                        {submission.status === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => {
                                setGradingModal(submission);
                                setGradingData({score: '', feedback: ''});
                              }}
                              className="btn-primary"
                              style={{marginRight: '10px'}}
                            >
                              📝 Grade
                            </button>
                            {activity.activityType === 'QUIZ' && activity.gradingMethod === 'AUTO' && (
                              <button
                                onClick={() => autoGradeQuiz(submission.id)}
                                className="btn-success"
                              >
                                ⚡ Auto Grade
                              </button>
                            )}
                          </>
                        )}
                        {submission.status === 'GRADED' && (
                          <button
                            onClick={() => {
                              setGradingModal(submission);
                              setGradingData({
                                score: submission.score,
                                feedback: submission.feedback || ''
                              });
                            }}
                            className="btn-secondary"
                          >
                            ✏️ Edit Grade
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="icon">📭</div>
                  <h3>No submissions yet</h3>
                  <p>Students haven't submitted their work for this activity.</p>
                </div>
              )}
            </div>
          )}

          {/* Teacher Leaderboard */}
          {user?.role === 'TEACHER' && topPerformers.length > 0 && (
            <div className="submissions-section" style={{marginTop: '30px'}}>
              <div className="section-header">
                <h2 className="section-title">
                  <span className="icon">🏆</span>Top Performers
                </h2>
              </div>

              <div className="leaderboard-container">
                {topPerformers.map((performer, index) => (
                  <div key={performer.studentId || index} className="leaderboard-item">
                    <div className="rank-badge">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="performer-info">
                      <div className="student-avatar">
                        {performer.studentName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h4>{performer.studentName || `Student ${performer.studentId}`}</h4>
                        <p style={{color: '#64748b', margin: '5px 0', fontSize: '0.9em'}}>
                          Student ID: {performer.studentId}
                        </p>
                      </div>
                    </div>
                    <div className="performer-score">
                      <div className="score-value">{performer.score}</div>
                      <div className="score-label">/ {activity.maxScore} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submission Modal */}
      {submissionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Submit Assignment</h2>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Submission Text *</label>
                <textarea
                  className="form-control textarea"
                  value={submissionData.submissionText}
                  onChange={(e) => setSubmissionData({
                    ...submissionData,
                    submissionText: e.target.value
                  })}
                  placeholder="Enter your submission here..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Upload Files (Optional)</label>
                <FileUpload 
                  entityType="SUBMISSION"
                  entityId={null} // 将在提交后设置
                  onUploadSuccess={handleSubmissionFilesUploaded}
                  accept=".pdf,.doc,.docx,.txt,.md,.jpg,.png,.zip,.rar"
                  maxFiles={5}
                  maxSize={50 * 1024 * 1024} // 50MB
                />
                
                {submissionFiles.length > 0 && (
                  <div className="uploaded-files">
                    <h5>已上传的文件:</h5>
                    <FileList 
                      files={submissionFiles}
                      onDelete={handleDeleteSubmissionFile}
                      showActions={true}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSubmissionModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={submitActivity} className="btn-primary">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Grade Submission</h2>
              <p>Student: {gradingModal.studentName || `Student ${gradingModal.studentId}`}</p>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Submission</label>
                <div className="submission-content">
                  <p>{gradingModal.submissionText}</p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Score (0-{activity.maxScore}) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={gradingData.score}
                  onChange={(e) => setGradingData({
                    ...gradingData,
                    score: e.target.value
                  })}
                  min="0"
                  max={activity.maxScore}
                  step="0.1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Feedback</label>
                <textarea
                  className="form-control textarea"
                  value={gradingData.feedback}
                  onChange={(e) => setGradingData({
                    ...gradingData,
                    feedback: e.target.value
                  })}
                  placeholder="Provide feedback to the student..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setGradingModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={gradeSubmission} className="btn-success">
                Save Grade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Submission Details</h2>
              <p>
                {user?.role === 'TEACHER' ? 
                  `Student: ${viewModal.studentName || `Student ${viewModal.studentId}`}` :
                  'My Submission'
                }
              </p>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">📅 Submission Info</label>
                <div className="info-item">
                  <span className="info-label">Submitted At</span>
                  <span className="info-value">{formatDate(viewModal.submittedAt)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className={`status-badge ${getStatusColor(viewModal.status)}`}>
                    {viewModal.status}
                  </span>
                </div>
                {viewModal.attemptNumber && (
                  <div className="info-item">
                    <span className="info-label">Attempt Number</span>
                    <span className="info-value">{viewModal.attemptNumber}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">📝 Submission Content</label>
                <div className="submission-content" style={{minHeight: '120px'}}>
                  {viewModal.submissionText || 'No text content submitted'}
                </div>
              </div>

              {viewModal.fileUrls && viewModal.fileUrls.length > 0 && (
                <div className="form-group">
                  <label className="form-label">📎 Attachments</label>
                  <div className="file-list">
                    {JSON.parse(viewModal.fileUrls).map((url, index) => (
                      <div key={index} className="file-item">
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          📄 File {index + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewModal.score !== null && viewModal.score !== undefined && (
                <div className="form-group">
                  <label className="form-label">📊 Score</label>
                  <div className="score-display">
                    {viewModal.score}/{activity.maxScore} points
                  </div>
                </div>
              )}

              {viewModal.feedback && (
                <div className="form-group">
                  <label className="form-label">💬 Teacher Feedback</label>
                  <div className="feedback-display">
                    {viewModal.feedback}
                  </div>
                </div>
              )}

              {viewModal.gradedAt && (
                <div className="form-group">
                  <label className="form-label">✅ Graded At</label>
                  <div className="info-value">{formatDate(viewModal.gradedAt)}</div>
                </div>
              )}

              {viewModal.isLate && (
                <div className="form-group">
                  <div className="alert alert-warning">
                    ⚠️ This submission was submitted after the due date
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setViewModal(null)} className="btn-secondary">
                Close
              </button>
              {user?.role === 'TEACHER' && viewModal.status !== 'GRADED' && (
                <button 
                  onClick={() => {
                    setGradingModal(viewModal);
                    setViewModal(null);
                    setGradingData({score: '', feedback: ''});
                  }}
                  className="btn-primary"
                >
                  Grade This Submission
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDetail;
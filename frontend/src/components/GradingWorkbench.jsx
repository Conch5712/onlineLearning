import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GradingWorkbench.css';

const GradingWorkbench = ({ user }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [gradingModal, setGradingModal] = useState({ show: false, submission: null });
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });

  // Batch grading state
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchGradeForm, setBatchGradeForm] = useState({ score: '', feedback: '' });

  useEffect(() => {
    if (user && user.id) {
      fetchPendingSubmissions();
    }
  }, [user, currentPage, pageSize, statusFilter]);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8080/api/submissions/grading/teacher/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            current: currentPage,
            size: pageSize,
            status: statusFilter
          }
        }
      );

      setSubmissions(response.data.records || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error('Failed to fetch pending submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openGradingModal = (submission) => {
    setGradingModal({ show: true, submission });
    setGradeForm({
      score: submission.score || '',
      feedback: submission.feedback || ''
    });
  };

  const closeGradingModal = () => {
    setGradingModal({ show: false, submission: null });
    setGradeForm({ score: '', feedback: '' });
  };

  const submitGrade = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/submissions/${gradingModal.submission.id}/grade`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            score: parseFloat(gradeForm.score),
            feedback: gradeForm.feedback
          }
        }
      );

      alert('Grading submitted successfully!');
      closeGradingModal();
      fetchPendingSubmissions();
    } catch (error) {
      console.error('Failed to submit grade:', error);
      alert('Failed to submit grade: ' + (error.response?.data?.message || error.message));
    }
  };

  const autoGradeQuiz = async (submissionId) => {
    if (!window.confirm('Auto-grade this quiz submission?')) {
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
      fetchPendingSubmissions();
    } catch (error) {
      console.error('Failed to auto-grade quiz:', error);
      alert('Failed to auto-grade: ' + (error.response?.data?.message || error.message));
    }
  };

  const returnSubmission = async (submissionId) => {
    const reason = prompt('Please enter the reason for returning this submission:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/submissions/${submissionId}/return`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { reason }
        }
      );

      alert('Submission returned to student!');
      fetchPendingSubmissions();
    } catch (error) {
      console.error('Failed to return submission:', error);
      alert('Failed to return submission: ' + (error.response?.data?.message || error.message));
    }
  };

  // Batch grading functions
  const toggleSelectSubmission = (submissionId) => {
    setSelectedSubmissions(prev =>
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSubmissions.length === submissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(submissions.map(s => s.id));
    }
  };

  const openBatchGradingModal = () => {
    if (selectedSubmissions.length === 0) {
      alert('Please select at least one submission to grade');
      return;
    }
    setShowBatchModal(true);
  };

  const closeBatchGradingModal = () => {
    setShowBatchModal(false);
    setBatchGradeForm({ score: '', feedback: '' });
  };

  const submitBatchGrade = async (e) => {
    e.preventDefault();

    if (!window.confirm(`Grade ${selectedSubmissions.length} submissions with the same score and feedback?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const gradeRequests = selectedSubmissions.map(submissionId => ({
        submissionId,
        score: parseFloat(batchGradeForm.score),
        feedback: batchGradeForm.feedback
      }));

      await axios.put(
        'http://localhost:8080/api/submissions/batch-grade',
        gradeRequests,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert(`Successfully graded ${selectedSubmissions.length} submissions!`);
      setSelectedSubmissions([]);
      closeBatchGradingModal();
      fetchPendingSubmissions();
    } catch (error) {
      console.error('Failed to batch grade:', error);
      alert('Failed to batch grade: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      SUBMITTED: { text: 'Pending', class: 'status-pending' },
      GRADED: { text: 'Graded', class: 'status-graded' },
      RETURNED: { text: 'Returned', class: 'status-returned' }
    };
    const info = statusMap[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${info.class}`}>{info.text}</span>;
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="grading-workbench">
      <div className="content-header">
        <h2>📝 Grading Workbench</h2>
        <div className="header-actions">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="SUBMITTED">Pending</option>
            <option value="GRADED">Graded</option>
            <option value="RETURNED">Returned</option>
          </select>
          {selectedSubmissions.length > 0 && (
            <button className="btn-success" onClick={openBatchGradingModal}>
              ✓ Batch Grade ({selectedSubmissions.length})
            </button>
          )}
          <button className="btn-primary" onClick={fetchPendingSubmissions}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="submissions-stats">
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{submissions.filter(s => s.status === 'SUBMITTED').length}</h3>
            <p>Pending Grading</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{submissions.filter(s => s.status === 'GRADED').length}</h3>
            <p>Graded Today</p>
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <h3>No submissions to grade</h3>
          <p>All caught up! Check back later for new submissions.</p>
        </div>
      ) : (
        <>
          <div className="submissions-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedSubmissions.length === submissions.length && submissions.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Student ID</th>
                  <th>Activity ID</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.includes(submission.id)}
                        onChange={() => toggleSelectSubmission(submission.id)}
                      />
                    </td>
                    <td>{submission.studentId}</td>
                    <td>{submission.activityId}</td>
                    <td>{formatDate(submission.submittedAt)}</td>
                    <td>{getStatusBadge(submission.status)}</td>
                    <td>
                      {submission.score !== null && submission.score !== undefined
                        ? `${submission.score} pts`
                        : '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-small btn-primary"
                          onClick={() => openGradingModal(submission)}
                        >
                          Grade
                        </button>
                        {submission.activityType === 'QUIZ' && submission.status === 'SUBMITTED' && (
                          <button
                            className="btn-small btn-success"
                            onClick={() => autoGradeQuiz(submission.id)}
                          >
                            Auto-Grade
                          </button>
                        )}
                        {submission.status === 'SUBMITTED' && (
                          <button
                            className="btn-small btn-warning"
                            onClick={() => returnSubmission(submission.id)}
                          >
                            Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              className="btn-secondary"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn-secondary"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Grading Modal */}
      {gradingModal.show && (
        <div className="modal-overlay" onClick={closeGradingModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Grade Submission</h3>
              <button className="close-btn" onClick={closeGradingModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="submission-info">
                <p><strong>Student ID:</strong> {gradingModal.submission.studentId}</p>
                <p><strong>Activity ID:</strong> {gradingModal.submission.activityId}</p>
                <p><strong>Submitted:</strong> {formatDate(gradingModal.submission.submittedAt)}</p>
              </div>

              <div className="submission-content">
                <h4>Submission Content:</h4>
                {gradingModal.submission.submissionText && (
                  <div className="submission-text">
                    <p>{gradingModal.submission.submissionText}</p>
                  </div>
                )}
                {gradingModal.submission.fileUrl && (
                  <div className="submission-file">
                    <a href={gradingModal.submission.fileUrl} target="_blank" rel="noopener noreferrer">
                      📎 View Submitted File
                    </a>
                  </div>
                )}
                {gradingModal.submission.submissionUrl && (
                  <div className="submission-url">
                    <a href={gradingModal.submission.submissionUrl} target="_blank" rel="noopener noreferrer">
                      🔗 {gradingModal.submission.submissionUrl}
                    </a>
                  </div>
                )}
              </div>

              <form onSubmit={submitGrade}>
                <div className="form-group">
                  <label>Score *</label>
                  <input
                    type="number"
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                    min="0"
                    step="0.1"
                    required
                    placeholder="Enter score"
                  />
                </div>

                <div className="form-group">
                  <label>Feedback</label>
                  <textarea
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    rows="4"
                    placeholder="Provide feedback to the student (optional)"
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={closeGradingModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit Grade
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Batch Grading Modal */}
      {showBatchModal && (
        <div className="modal-overlay" onClick={closeBatchGradingModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✓ Batch Grade Submissions</h3>
              <button className="close-btn" onClick={closeBatchGradingModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="batch-info">
                <p><strong>Selected Submissions:</strong> {selectedSubmissions.length}</p>
                <p className="batch-warning">
                  ⚠️ All selected submissions will receive the same score and feedback.
                </p>
              </div>

              <form onSubmit={submitBatchGrade}>
                <div className="form-group">
                  <label>Score *</label>
                  <input
                    type="number"
                    value={batchGradeForm.score}
                    onChange={(e) => setBatchGradeForm({ ...batchGradeForm, score: e.target.value })}
                    min="0"
                    step="0.1"
                    required
                    placeholder="Enter score for all submissions"
                  />
                </div>

                <div className="form-group">
                  <label>Feedback</label>
                  <textarea
                    value={batchGradeForm.feedback}
                    onChange={(e) => setBatchGradeForm({ ...batchGradeForm, feedback: e.target.value })}
                    rows="4"
                    placeholder="Provide feedback (will be applied to all submissions)"
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={closeBatchGradingModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-success">
                    Grade {selectedSubmissions.length} Submissions
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingWorkbench;

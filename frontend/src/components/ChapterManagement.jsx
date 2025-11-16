import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChapterManagement.css';

const ChapterManagement = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  const [newChapter, setNewChapter] = useState({
    title: '',
    description: '',
    orderIndex: 1,
    isPublished: false
  });

  useEffect(() => {
    if (user && user.id) {
      fetchCourses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchChapters();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/teacher/courses', {
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

  const fetchChapters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8080/api/teacher/courses/${selectedCourse}/chapters`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setChapters(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
      setChapters([]);
    }
  };

  const createChapter = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8080/api/teacher/courses/${selectedCourse}/chapters`,
        newChapter,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('Chapter created successfully!');
        setShowCreateModal(false);
        setNewChapter({
          title: '',
          description: '',
          orderIndex: 1,
          isPublished: false
        });
        fetchChapters();
      }
    } catch (error) {
      console.error('Failed to create chapter:', error);
      alert('Failed to create chapter: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateChapter = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:8080/api/teacher/courses/${selectedCourse}/chapters/${editingChapter.id}`,
        editingChapter,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('Chapter updated successfully!');
        setShowEditModal(false);
        setEditingChapter(null);
        fetchChapters();
      }
    } catch (error) {
      console.error('Failed to update chapter:', error);
      alert('Failed to update chapter: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteChapter = async (chapterId) => {
    if (!window.confirm('Are you sure you want to delete this chapter? All content within it will also be deleted.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:8080/api/teacher/courses/${selectedCourse}/chapters/${chapterId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Chapter deleted successfully!');
      fetchChapters();
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      alert('Failed to delete chapter: ' + (error.response?.data?.message || error.message));
    }
  };

  const togglePublishStatus = async (chapter) => {
    try {
      const token = localStorage.getItem('token');
      const updatedChapter = { ...chapter, isPublished: !chapter.isPublished };

      await axios.put(
        `http://localhost:8080/api/teacher/courses/${selectedCourse}/chapters/${chapter.id}`,
        updatedChapter,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      fetchChapters();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      alert('Failed to update status: ' + (error.response?.data?.message || error.message));
    }
  };

  const openEditModal = (chapter) => {
    setEditingChapter({ ...chapter });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading chapters...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <h3>No Courses Available</h3>
        <p>Create a course first to manage chapters.</p>
      </div>
    );
  }

  return (
    <div className="chapter-management">
      <div className="content-header">
        <h2>📖 Chapter Management</h2>
        <p>Organize your course content into structured chapters</p>
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
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Chapter
        </button>
      </div>

      {/* Chapters List */}
      {chapters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📑</div>
          <h3>No Chapters Yet</h3>
          <p>Click "New Chapter" to create your first chapter.</p>
        </div>
      ) : (
        <div className="chapters-list">
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className="chapter-card">
              <div className="chapter-header">
                <div className="chapter-number">
                  Chapter {chapter.orderIndex || index + 1}
                </div>
                <div className={`publish-badge ${chapter.isPublished ? 'published' : 'draft'}`}>
                  {chapter.isPublished ? '✅ Published' : '📝 Draft'}
                </div>
              </div>

              <div className="chapter-content">
                <h3>{chapter.title}</h3>
                {chapter.description && (
                  <p className="chapter-description">{chapter.description}</p>
                )}
                <div className="chapter-meta">
                  <span>📅 Created: {new Date(chapter.createdAt).toLocaleDateString()}</span>
                  {chapter.updatedAt && (
                    <span>🔄 Updated: {new Date(chapter.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="chapter-actions">
                <button
                  className="btn-secondary"
                  onClick={() => openEditModal(chapter)}
                >
                  ✏️ Edit
                </button>
                <button
                  className={`btn-toggle ${chapter.isPublished ? 'unpublish' : 'publish'}`}
                  onClick={() => togglePublishStatus(chapter)}
                >
                  {chapter.isPublished ? '👁️‍🗨️ Unpublish' : '🚀 Publish'}
                </button>
                <button
                  className="btn-danger"
                  onClick={() => deleteChapter(chapter.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Chapter Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Chapter</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <form onSubmit={createChapter}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Chapter Title *</label>
                  <input
                    type="text"
                    value={newChapter.title}
                    onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                    required
                    placeholder="Enter chapter title"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newChapter.description}
                    onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                    rows="4"
                    placeholder="Describe what this chapter covers"
                  />
                </div>

                <div className="form-group">
                  <label>Order Index</label>
                  <input
                    type="number"
                    value={newChapter.orderIndex}
                    onChange={(e) => setNewChapter({ ...newChapter, orderIndex: parseInt(e.target.value) })}
                    min="1"
                  />
                  <small>Determines the display order of chapters</small>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newChapter.isPublished}
                      onChange={(e) => setNewChapter({ ...newChapter, isPublished: e.target.checked })}
                    />
                    Publish immediately
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Chapter Modal */}
      {showEditModal && editingChapter && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Chapter</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <form onSubmit={updateChapter}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Chapter Title *</label>
                  <input
                    type="text"
                    value={editingChapter.title}
                    onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                    required
                    placeholder="Enter chapter title"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editingChapter.description || ''}
                    onChange={(e) => setEditingChapter({ ...editingChapter, description: e.target.value })}
                    rows="4"
                    placeholder="Describe what this chapter covers"
                  />
                </div>

                <div className="form-group">
                  <label>Order Index</label>
                  <input
                    type="number"
                    value={editingChapter.orderIndex}
                    onChange={(e) => setEditingChapter({ ...editingChapter, orderIndex: parseInt(e.target.value) })}
                    min="1"
                  />
                  <small>Determines the display order of chapters</small>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editingChapter.isPublished}
                      onChange={(e) => setEditingChapter({ ...editingChapter, isPublished: e.target.checked })}
                    />
                    Published
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterManagement;

import { commentModel } from "../models/comment.model.js";

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const commentService = {
  getCommentsByCourseId: async (courseId) => {
    const rows = await commentModel.findByCourseId(courseId);
    return rows.map(r => ({
      id: r.id,
      content: r.content,
      isDeleted: !!r.isDeleted,
      isReply: !!r.parentId,
      parentId: r.parentId,
      parentContent: r.parentContent || null,
      parentUsername: r.parentUsername || null,
      createdAt: formatDate(r.createdAt),
      userId: r.userId,
      username: r.username,
      avatar: r.avatar || null,
      lessonId: r.lessonId,
      lessonName: r.lessonName,
    }));
  },

  getReportsByCourseId: async (courseId) => {
    const rows = await commentModel.findReportsByCourseId(courseId);
    return rows.map(r => ({
      reportId: r.reportId,
      reason: r.reason,
      reportStatus: r.reportStatus,
      reportedAt: formatDate(r.reportedAt),
      reporterId: r.reporterId,
      reporterName: r.reporterName,
      reporterAvatar: r.reporterAvatar || null,
      commentId: r.commentId,
      commentContent: r.commentContent,
      commentDeleted: !!r.commentDeleted,
      commentAuthor: r.commentAuthor,
      lessonName: r.lessonName,
    }));
  },

  getCommentsByLessonId: async (lessonId) => {
    const rows = await commentModel.findByLessonId(lessonId);
    return rows.map(r => ({
      id: r.id,
      content: r.content,
      isDeleted: !!r.isDeleted,
      isReply: !!r.parentId,
      parentId: r.parentId,
      parentContent: r.parentContent || null,
      parentUsername: r.parentUsername || null,
      createdAt: formatDate(r.createdAt),
      userId: r.userId,
      username: r.username,
      avatar: r.avatar || null,
    }));
  },

  getReportsByLessonId: async (lessonId) => {
    const rows = await commentModel.findReportsByLessonId(lessonId);
    return rows.map(r => ({
      reportId: r.reportId,
      reason: r.reason,
      reportStatus: r.reportStatus,
      reportedAt: formatDate(r.reportedAt),
      reporterId: r.reporterId,
      reporterName: r.reporterName,
      reporterAvatar: r.reporterAvatar || null,
      commentId: r.commentId,
      commentContent: r.commentContent,
      commentDeleted: !!r.commentDeleted,
      commentAuthor: r.commentAuthor,
    }));
  },

  getDeletedComments: async () => {
    const rows = await commentModel.findDeleted();
    return rows.map(r => ({
      id: r.id,
      content: r.content,
      isReply: !!r.parentId,
      createdAt: formatDate(r.createdAt),
      userId: r.userId,
      username: r.username,
      avatar: r.avatar || null,
      lessonId: r.lessonId,
      lessonName: r.lessonName,
      courseId: r.courseId,
      courseName: r.courseName,
    }));
  },

  hideComment: async (commentId) => commentModel.hide(commentId),
  restoreComment: async (commentId) => commentModel.restore(commentId),
  hardDeleteComment: async (commentId) => commentModel.hardDelete(commentId),
  acceptReport: async (reportId) => commentModel.acceptReport(reportId),
  rejectReport: async (reportId) => commentModel.rejectReport(reportId),
};

export default commentService;

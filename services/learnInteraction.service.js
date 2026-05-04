'use strict';

/** Theo đặc tả note.md BR3.6 / BR3.7 */
const COMMENT_MAX_LENGTH = 500;

function validateCommentContent(raw) {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Bình luận không được để trống', trimmed: '' };
  }
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Nội dung không quá ${COMMENT_MAX_LENGTH} ký tự`,
      trimmed,
    };
  }
  return { ok: true, error: null, trimmed };
}

function buildCommentTree(flatComments) {
  const commentMap = {};
  const commentTree = [];

  flatComments.forEach((comment) => {
    comment.replies = [];
    commentMap[comment.id] = comment;
  });

  flatComments.forEach((comment) => {
    if (comment.parentId) {
      if (commentMap[comment.parentId]) {
        commentMap[comment.parentId].replies.push(comment);
      }
    } else {
      commentTree.push(comment);
    }
  });

  return commentTree;
}

module.exports = {
  COMMENT_MAX_LENGTH,
  validateCommentContent,
  buildCommentTree,
};

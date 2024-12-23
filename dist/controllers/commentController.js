const Comment = require('../models/index').Comment;
const Post = require('../models/index').Post;
const {
  User
} = require('../models');
const {
  formatDistanceToNow
} = require('date-fns');
const {
  vi
} = require('date-fns/locale'); // Định dạng tiếng Việt nếu cần
const {
  sendNotificationToUsers
} = require('../ws/websocketHandler');
const commentController = {
  async create(req, res) {
    try {
      // console.log(req.user);
      const userId = req.user.id; // Lấy ID người dùng từ session
      const postId = req.params.postId; // Lấy ID bài viết từ URL
      const {
        content,
        commentId
      } = req.body; // Nội dung và ID comment cha (nếu có)
      console.log(req.body);

      // Kiểm tra nội dung comment không được để trống
      if (!content || content === '') {
        return res.status(400).json({
          success: false,
          message: "Nội dung không được để trống."
        });
      }

      // Kiểm tra bài viết có tồn tại không
      const post = await Post.findByPk(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Bài viết không tồn tại."
        });
      }

      // Nếu có commentId, kiểm tra comment cha có tồn tại
      if (commentId) {
        const parentComment = await Comment.findByPk(commentId);
        if (!parentComment) {
          return res.status(404).json({
            success: false,
            message: "Comment được trả lời không tồn tại."
          });
        }
        if (parentComment.commentId) {
          return res.status(400).json({
            success: false,
            message: "Comment này là comment con, không được trả lời"
          });
        }
      }

      // Tạo comment
      const newComment = await Comment.create({
        content,
        userId,
        // ID người dùng
        postId,
        // ID bài viết
        commentId: commentId || null // ID comment cha (nếu có)
      });
      const notification = `Có ai đó vừa bình luận vào ${post.title} mà bạn theo dõi!`;
      sendNotificationToUsers(postId, notification);

      // Tăng số lượng comment cho bài viết
      await Post.increment('cmt_count', {
        where: {
          post_id: postId
        }
      });
      res.status(201).json({
        success: true,
        message: "Tạo bình luận thành công!",
        data: newComment
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo bình luận.",
        error: error.message
      });
    }
  },
  async update(req, res) {
    try {
      const userId = req.user.id; // ID người dùng từ session
      const commentId = req.params.id; // ID comment cần cập nhật
      const {
        content
      } = req.body;

      // Kiểm tra nội dung không được để trống
      if (!content || content.trim() === '') {
        return res.status(400).json({
          success: false,
          message: "Nội dung không được để trống."
        });
      }

      // Tìm comment cần cập nhật
      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment không tồn tại."
        });
      }

      // Kiểm tra quyền: chỉ người tạo hoặc admin mới được cập nhật
      if (comment.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật comment này."
        });
      }

      // Cập nhật comment
      await comment.update({
        content
      });
      res.status(200).json({
        success: true,
        message: "Cập nhật bình luận thành công!",
        data: comment
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật bình luận.",
        error: error.message
      });
    }
  },
  async delete(req, res) {
    try {
      const userId = req.user.id; // ID người dùng từ session
      const commentId = req.params.id; // ID comment cần xóa

      // Tìm comment cần xóa
      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment không tồn tại."
        });
      }

      // Kiểm tra quyền: chỉ người tạo hoặc admin mới được xóa
      if (comment.userId !== userId && !['admin', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa comment này."
        });
      }

      // Xóa comment
      await comment.destroy();

      // Giảm số lượng comment trong bài viết
      await Post.decrement('cmt_count', {
        where: {
          post_id: comment.postId
        }
      });
      res.status(202).json({
        success: true,
        message: "Xóa bình luận thành công!"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa bình luận.",
        error: error.message
      });
    }
  },
  async findAll(req, res) {
    try {
      const comments = await Comment.findAll();
      res.status(200).json({
        success: true,
        message: "Lấy tất cả comment thành công!",
        data: comments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  },
  async findAllofPostId(req, res) {
    try {
      const comments = await Comment.findAll({
        where: {
          postId: req.params.id
        }
      });
      for (const comment of comments) {
        const user = await User.findByPk(comment.userId, {
          attributes: ['name', 'avatar'] // Chỉ lấy các thuộc tính cần thiết
        });
        if (user) {
          comment.dataValues.user = user; // Gán user đã lọc vào comment
        }
        delete comment.dataValues.updatedAt;
        delete comment.dataValues.userId; // Loại bỏ userId nếu không cần thiết
      }
      const transformComments = comments => {
        comments = comments.map(cmt => ({
          ...cmt.toJSON(),
          createdAt: formatDistanceToNow(new Date(cmt.createdAt), {
            addSuffix: true,
            locale: vi
          })
        }));
        const rootComments = comments.filter(comment => comment.commentId === null);
        const nestedComments = rootComments.map(rootComment => {
          const children = comments.filter(comment => comment.commentId === rootComment.id);
          return [rootComment, ...children];
        });
        return nestedComments;
      };
      const nestedCommentList = transformComments(comments);
      const post = await Post.findOne({
        where: {
          post_id: req.params.id
        }
      });
      res.status(200).json({
        success: true,
        message: `Lấy tất cả comment của post ${post.title} thành công!`,
        data: nestedCommentList
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }
};
module.exports = commentController;
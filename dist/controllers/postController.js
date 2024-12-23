const Post = require('../models/index').Post;
const PostLike = require('../models/index').PostLike;
const PostImage = require('../models/index').PostImage;
const PostNotification = require('../models/index').PostNotification;
const Report = require('../models/index').Report;
const {
  User
} = require('../models');
const {
  Op
} = require('sequelize'); // Dùng để tạo các điều kiện lọc
const {
  formatDistanceToNow
} = require('date-fns');
const {
  vi
} = require('date-fns/locale'); // Định dạng tiếng Việt nếu cần
const uuid = require('uuid').v4;
const path = require('path');
const removeAccents = require('remove-accents');
const {
  Sequelize
} = require('sequelize');
const fs = require('fs');
const {
  sendNotificationToUsers
} = require('../ws/websocketHandler');
const formatAvatarUrl = (avatarPath, req) => {
  if (!avatarPath) return null;
  return `${req.protocol}://${req.get("host")}/${avatarPath.replace(/\\/g, "/")}`;
};
const formatContentImages = (content, req) => {
  return content.replace(/<img[^>]+src="([^"]+)"/g, (match, src) => {
    // Nếu src là đường dẫn tương đối (không phải URL tuyệt đối), thay thế nó
    if (!src.startsWith('http')) {
      return match.replace(src, `${req.protocol}://${req.get("host")}${src.replace(/\\/g, "/")}`);
    }
    return match;
  });
};
exports.getPopularPosts = async (req, res) => {
  try {
    const now = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);
    const filterByTime = req.query.time === 'month' ? lastMonth : lastWeek;
    const results = await Post.findAll({
      where: {
        createdAt: {
          [Op.gte]: filterByTime
        }
      },
      attributes: ['post_id', 'title', 'avatar', 'like_count', 'cmt_count'],
      order: [['like_count', 'DESC'], ['createdAt', 'DESC']]
    });
    if (results.length === 0) {
      return res.status(200).json({
        message: 'Không có bài viết phổ biến trong khoảng thời gian này.',
        data: []
      });
    }
    const formattedResults = results.map(post => ({
      ...post.toJSON(),
      avatar: formatAvatarUrl(post.avatar, req)
    }));
    res.status(200).json({
      message: 'Lấy bài viết phổ biến thành công!',
      data: formattedResults
    });
  } catch (err) {
    res.status(500).json({
      message: 'Lỗi khi lấy bài viết phổ biến.',
      error: err.message
    });
  }
};

// Lấy tất cả bài đăng
exports.getAllPosts = async (req, res) => {
  try {
    // Lấy tham số `isQna` từ query string, mặc định là `null`
    const {
      is_qna
    } = req.query;

    // Cấu hình điều kiện where dựa trên giá trị của isQna
    const whereCondition = is_qna !== undefined ? {
      is_qna: is_qna === 'true'
    } : {};

    // Truy vấn cơ sở dữ liệu với điều kiện where
    const results = await Post.findAll({
      attributes: ['post_id', 'title', 'avatar', 'createdAt', 'like_count', 'is_qna', 'cmt_count'],
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar']
      }],
      where: whereCondition,
      order: [['createdAt', 'DESC']]
    });

    // Định dạng lại kết quả trước khi trả về
    const formattedResults = results.map(post => ({
      ...post.toJSON(),
      avatar: formatAvatarUrl(post.avatar, req),
      createdAt: formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
        locale: vi
      })
    }));
    res.status(200).json(formattedResults);
  } catch (err) {
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách bài đăng',
      error: err.message
    });
  }
};

// Lấy bài đăng theo ID
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.postId;
    const result = await Post.findByPk(postId, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar', 'like_count']
      }]
    });
    if (!result) {
      return res.status(404).json({
        message: 'Không tìm thấy bài đăng.'
      });
    }
    const formattedResult = {
      ...result.toJSON(),
      avatar: formatAvatarUrl(result.avatar, req),
      content: formatContentImages(result.content, req),
      // Format images in content
      createdAt: formatDistanceToNow(new Date(result.createdAt), {
        addSuffix: true,
        locale: vi
      })
    };
    res.status(200).json(formattedResult);
  } catch (err) {
    res.status(500).json({
      message: 'Lỗi khi lấy bài đăng.',
      error: err.message
    });
  }
};
exports.getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.userId; // Lấy userId từ route params

    const posts = await Post.findAll({
      where: {
        author_id: userId
      },
      // Lọc theo ID tác giả
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar', 'like_count'] // Bao gồm thông tin tác giả
      }],
      order: [['createdAt', 'DESC']] // Sắp xếp bài viết theo thời gian tạo mới nhất
    });
    if (!posts || posts.length === 0) {
      return res.status(404).json({
        message: 'Người dùng này chưa có bài viết nào.'
      });
    }

    // Định dạng lại thời gian tạo bài viết
    const formattedPosts = posts.map(post => ({
      ...post.toJSON(),
      avatar: formatAvatarUrl(post.avatar, req),
      content: formatContentImages(post.content, req),
      // Format images in content
      createdAt: formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
        locale: vi
      })
    }));
    res.status(200).json(formattedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách bài viết.',
      error: err.message
    });
  }
};

// Hàm xử lý ảnh base64
exports.createPost = async (req, res) => {
  try {
    console.log(req.user);
    const author_id = req.user.id; // Lấy user ID từ session
    let {
      title,
      is_qna,
      content
    } = req.body;

    // Kiểm tra nếu content không phải là chuỗi, chuyển thành chuỗi
    if (typeof content !== 'string') {
      content = String(content); // Chuyển content thành chuỗi nếu cần thiết
    }

    // Kiểm tra nội dung bài viết
    if (!content || content.trim() === '') {
      return res.status(400).json({
        message: 'Nội dung bài viết không được để trống.'
      });
    }

    // Giới hạn nội dung nếu là Q&A
    if (is_qna) {
      const textContent = content.replace(/<[^>]*>/g, ''); // Loại bỏ HTML
      if (textContent.split(' ').length > 500) {
        return res.status(400).json({
          message: 'Nội dung Q&A không được vượt quá 500 từ.'
        });
      }
    }

    // Xử lý ảnh từ CKEditor nếu có
    const imageUrls = [];
    const base64Images = content.match(/data:image\/(png|jpg|jpeg|gif|bmp);base64,[^\"]+/g); // Tìm tất cả ảnh base64

    if (base64Images) {
      // Lưu các ảnh base64 vào thư mục uploads
      for (let i = 0; i < base64Images.length; i++) {
        const imageUrl = await uploadImageFromBase64(base64Images[i]); // Lưu ảnh và trả về URL
        imageUrls.push(imageUrl); // Lưu URL ảnh vào mảng
      }

      // Thay thế base64 bằng đường dẫn ảnh trong nội dung bài viết
      imageUrls.forEach((imageUrl, index) => {
        content = content.replace(base64Images[index], imageUrl);
      });
    }

    // Xử lý avatar
    let avatar = null;
    if (req.files && req.files.avatar && req.files.avatar[0]) {
      avatar = `uploads/${path.basename(req.files.avatar[0].path)}`; // Đường dẫn ảnh được tải lên (chuyển thành URL tương đối)
    }

    // Tạo bài viết
    const newPost = await Post.create({
      title,
      author_id,
      is_qna,
      content,
      // Lưu toàn bộ HTML (bao gồm cả thẻ <img>)
      avatar // Lưu đường dẫn ảnh đại diện (nếu có)
    });

    // Lưu các ảnh vào bảng PostImage nếu có ảnh
    if (imageUrls.length > 0) {
      const postImages = imageUrls.map(url => ({
        post_id: newPost.post_id,
        image_url: url
      }));
      await PostImage.bulkCreate(postImages);
    }

    // Trả về kết quả với đường dẫn ảnh đầy đủ (URL tuyệt đối)

    res.status(201).json({
      message: 'Tạo bài viết thành công',
      postId: newPost.post_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Lỗi khi tạo bài đăng.',
      error: err.message
    });
  }
};

// Hàm xử lý ảnh base64
const uploadImageFromBase64 = async base64Data => {
  const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  if (matches.length !== 3) {
    throw new Error('Dữ liệu không phải ảnh base64 hợp lệ');
  }
  const type = matches[1]; // Tên loại ảnh (png, jpg, ...)
  const imageBuffer = Buffer.from(matches[2], 'base64');

  // Tạo tên file duy nhất
  const fileName = `${uuid()}.${type}`; // Sử dụng uuid() để tạo tên file duy nhất
  const uploadPath = path.join(__dirname, '..', '../uploads', fileName);

  // Lưu ảnh vào thư mục
  await fs.promises.writeFile(uploadPath, imageBuffer);

  // Trả về URL ảnh
  return `/uploads/${fileName}`;
};

// Cập nhật bài đăng
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const {
      title,
      is_qna,
      content
    } = req.body;

    // Lấy bài viết cần cập nhật
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        message: 'Không tìm thấy bài viết.'
      });
    }

    // Kiểm tra quyền (nếu cần)
    if (post.author_id !== req.user.id) {
      return res.status(403).json({
        message: 'Bạn không có quyền cập nhật bài viết này.'
      });
    }

    // Xử lý avatar mới (nếu có)
    let avatar = post.avatar; // Giữ nguyên avatar cũ
    if (req.files && req.files.avatar && req.files.avatar[0]) {
      avatar = req.files.avatar[0].path; // Cập nhật avatar mới
    }

    // Cập nhật bài viết
    post.title = title || post.title;
    post.content = content || post.content;
    post.avatar = avatar;
    await post.save();

    // Trích xuất URL ảnh từ nội dung bài viết mới
    const imageUrls = content.match(/<img[^>]+src="([^">]+)"/g)?.map(img => {
      return img.match(/src="([^">]+)"/)[1];
    });

    // Xóa ảnh cũ trong PostImage (nếu cần) và thêm ảnh mới
    if (imageUrls && imageUrls.length > 0) {
      await PostImage.destroy({
        where: {
          post_id: postId
        }
      });
      const postImages = imageUrls.map(url => ({
        post_id: postId,
        image_url: url
      }));
      await PostImage.bulkCreate(postImages);
    }
    res.status(200).json({
      message: 'Cập nhật bài viết thành công.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Lỗi khi cập nhật bài đăng.',
      error: err.message
    });
  }
};
// Xóa bài đăng

exports.deletePost = async (req, res) => {
  try {
    const {
      postId
    } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Tìm bài viết
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        message: 'Không tìm thấy bài viết.'
      });
    }

    // Kiểm tra quyền
    if (post.author_id !== userId && !['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({
        message: 'Bạn không có quyền xóa bài viết này.'
      });
    }
    const notification = `Bài viết ${post.title} đã bị xoá!`;
    sendNotificationToUsers(postId, notification, {
      delete: true
    });
    await Report.destroy({
      where: {
        post_id: postId
      }
    });

    // Xóa hình ảnh liên quan
    await PostImage.destroy({
      where: {
        post_id: postId
      }
    });

    // Xóa bài viết
    await Post.destroy({
      where: {
        post_id: postId
      }
    });
    res.status(200).json({
      message: 'Xóa bài viết thành công.'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi xóa bài viết.',
      error: error.message
    });
  }
};
exports.searchPosts = async (req, res) => {
  try {
    const {
      query
    } = req.query; // Lấy từ khóa tìm kiếm từ query parameter

    if (!query || query.trim() === '') {
      return res.status(400).json({
        message: 'Vui lòng nhập từ khóa tìm kiếm.'
      });
    }

    // Loại bỏ dấu và chuẩn hóa chuỗi tìm kiếm
    const normalizedQuery = removeAccents(query).toLowerCase();
    const results = await Post.findAll({
      attributes: ['post_id', 'title', 'avatar', 'createdAt', 'like_count'],
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar']
      }],
      where: {
        [Op.or]: [
        // Tìm kiếm trong title bài viết
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('title')), {
          [Op.like]: `%${normalizedQuery}%`
        }),
        // Tìm kiếm trong name của author
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('author.name')), {
          [Op.like]: `%${normalizedQuery}%`
        })]
      },
      order: [['createdAt', 'DESC']]
    });

    // Định dạng lại kết quả
    const formattedResults = results.map(post => ({
      ...post.toJSON(),
      avatar: formatAvatarUrl(post.avatar, req),
      createdAt: formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
        locale: vi
      })
    }));
    res.status(200).json(formattedResults);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Lỗi khi tìm kiếm bài viết',
      error: err.message
    });
  }
};

// Like bài đăng (toggle)
exports.likePost = async (req, res) => {
  try {
    const {
      postId
    } = req.params;
    const userId = req.user?.id; // Lấy user_id từ thông tin user trong token

    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!userId) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để thực hiện hành động này.'
      });
    }

    // Kiểm tra xem người dùng đã like bài viết chưa

    const post = await Post.findByPk(postId);
    const existingLike = await PostLike.findOne({
      where: {
        post_id: postId,
        user_id: userId
      }
    });
    if (!existingLike) {
      // Nếu chưa like, tạo mới bản ghi và tăng like_count
      await PostLike.create({
        post_id: postId,
        user_id: userId
      });
      await Post.increment('like_count', {
        where: {
          post_id: postId
        }
      });
      const notification = `Có ai đó vừa thích bài viết ${post.title} của bạn!`;
      sendNotificationToUsers(notification);
      return res.status(200).json({
        message: 'Đã like bài viết thành công!'
      });
    } else {
      // Nếu đã like, xóa bản ghi và giảm like_count
      await PostLike.destroy({
        where: {
          post_id: postId,
          user_id: userId
        }
      });
      await Post.decrement('like_count', {
        where: {
          post_id: postId
        }
      });
      return res.status(200).json({
        message: 'Đã bỏ like bài viết thành công!'
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Lỗi khi xử lý lượt thích',
      error: err.message
    });
  }
};
exports.followPost = async (req, res) => {
  try {
    const {
      postId
    } = req.params;
    const userId = req.user?.id; // Lấy user_id từ thông tin user trong token

    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!userId) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để thực hiện hành động này.'
      });
    }

    // Kiểm tra xem người dùng đã like bài viết chưa
    const existingLike = await PostNotification.findOne({
      where: {
        post_id: postId,
        user_id: userId
      }
    });
    if (!existingLike) {
      await PostNotification.create({
        post_id: postId,
        user_id: userId
      });
      return res.status(200).json({
        message: 'Đã theo dõi bài viết thành công!'
      });
    } else {
      await PostNotification.destroy({
        where: {
          post_id: postId,
          user_id: userId
        }
      });
      return res.status(200).json({
        message: 'Đã bỏ theo dõi bài viết thành công!'
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Lỗi khi xử lý theo dõi',
      error: err.message
    });
  }
};
exports.followStatus = async (req, res) => {
  try {
    const {
      postId
    } = req.params;
    const userId = req.user?.id; // Lấy user_id từ thông tin user trong token

    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!userId) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để thực hiện hành động này.'
      });
    }
    // Kiểm tra xem người dùng đã like bài viết chưa
    const existingNotification = await PostNotification.findOne({
      where: {
        post_id: postId,
        user_id: userId
      }
    });
    return res.status(200).json({
      message: `Bạn ${existingNotification != null ? "đã" : "chưa"} theo dõi bài viết.`,
      data: existingNotification != null
    });
  } catch (err) {
    res.status(500).json({
      message: 'Lỗi khi xử lý theo dõi',
      error: err.message
    });
  }
};
exports.likeStatus = async (req, res) => {
  try {
    const {
      postId
    } = req.params;
    const userId = req.user?.id; // Lấy user_id từ thông tin user trong token

    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!userId) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để thực hiện hành động này.'
      });
    }

    // Kiểm tra xem người dùng đã like bài viết chưa
    const existingLike = await PostLike.findOne({
      where: {
        post_id: postId,
        user_id: userId
      }
    });
    return res.status(200).json({
      message: `Bạn ${existingLike != null ? "đã" : "chưa"} like bài viết.`,
      data: existingLike != null
    });
  } catch (err) {
    res.status(500).json({
      message: 'Lỗi khi xử lý lượt thích',
      error: err.message
    });
  }
};
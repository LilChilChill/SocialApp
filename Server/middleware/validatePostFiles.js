module.exports = (req, res, next) => {
    if (!req.files || req.files.length === 0) return next();
  
    const images = req.files.filter(f => f.mimetype.startsWith('image/'));
    const videos = req.files.filter(f => f.mimetype.startsWith('video/'));
    const documents = req.files.filter(
      f => !f.mimetype.startsWith('image/') && !f.mimetype.startsWith('video/')
    );
  
    if (images.length > 8) {
      return res.status(400).json({ message: 'Tối đa 8 ảnh cho mỗi bài viết' });
    }
  
    if (videos.length > 1) {
      return res.status(400).json({ message: 'Chỉ được upload 1 video' });
    }
  
    if (documents.length > 3) {
      return res.status(400).json({ message: 'Tối đa 3 tài liệu' });
    }
  
    next();
  };
  
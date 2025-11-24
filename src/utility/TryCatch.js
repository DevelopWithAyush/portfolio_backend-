export const TryCatch = (passedFunc) => async (req, res, next) => {
  try {
    await passedFunc(req, res);
  } catch (error) {
    if (next && typeof next === 'function') {
      next(error);
    } else {
      console.error('Error in TryCatch:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal Server Error'
      });
    }
  }
};

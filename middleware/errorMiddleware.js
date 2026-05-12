const notFound = (req, res, next) => {
  const error = new Error('Route not found');
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Log real error only in backend terminal
  console.error('SERVER ERROR:', {
    message: err.message,
    stack: err.stack,
  });

  let message = 'Something went wrong. Please try again.';

  if (statusCode === 400) {
    message = err.message || 'Invalid request. Please check your input.';
  } else if (statusCode === 401) {
    message = 'Invalid email or password.';
  } else if (statusCode === 403) {
    message = err.message || 'Access denied.';
  } else if (statusCode === 404) {
    message = 'The requested resource was not found.';
  } else if (statusCode >= 500) {
    message = 'Unable to complete request. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export { notFound, errorHandler };
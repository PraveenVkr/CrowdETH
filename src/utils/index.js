// utils/index.js

export const daysLeft = (deadline) => {
  const difference = new Date(deadline).getTime() - Date.now();
  const remainingDays = difference / (1000 * 60 * 60 * 24);

  return Math.max(0, Math.floor(remainingDays)); // Avoid negative days
};

export const calculateBarPercentage = (goal, raisedAmount) => {
  if (goal === 0) return 0;

  const percentage = Math.round((raisedAmount * 100) / goal);
  return Math.min(percentage, 100); // Optional: Cap at 100%
};

export const checkIfImage = (url, callback) => {
  if (!url) return callback(false);

  const img = new Image();
  img.src = url;

  if (img.complete) {
    callback(true);
  } else {
    img.onload = () => callback(true);
    img.onerror = () => callback(false);
  }
};

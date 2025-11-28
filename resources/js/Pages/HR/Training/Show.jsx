// This file is deprecated - Training details are now shown via modal or within the main Training Index page
// Following Leave Management patterns, training details use modal components instead of separate pages
// See: resources/js/Pages/HR/Training/Index.jsx

export default function TrainingShow() {
  // Redirect to training index page
  window.location.href = route('hr.training.index');
  return null;
}
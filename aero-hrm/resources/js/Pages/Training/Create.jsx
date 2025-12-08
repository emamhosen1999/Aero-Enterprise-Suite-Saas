// This file is deprecated - Training CRUD operations are now handled via modal forms in the main Training Index page
// Following Leave Management patterns, training operations use TrainingForm component instead of separate pages
// See: resources/js/Forms/TrainingForm.jsx and resources/js/Pages/HR/Training/Index.jsx

export default function TrainingCreate() {
  // Redirect to training index page
  window.location.href = route('hr.training.index');
  return null;
}

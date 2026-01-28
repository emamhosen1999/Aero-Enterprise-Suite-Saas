<?php

use Illuminate\Support\Facades\Route;
use Aero\Education\Http\Controllers\StudentController;
use Aero\Education\Http\Controllers\FacultyController;
use Aero\Education\Http\Controllers\CourseController;
use Aero\Education\Http\Controllers\EnrollmentController;
use Aero\Education\Http\Controllers\GradeController;
use Aero\Education\Http\Controllers\TranscriptController;
use Aero\Education\Http\Controllers\AttendanceController;

Route::middleware(['web', 'auth'])->prefix('education')->name('education.')->group(function () {
    
    // Student Management Routes
    Route::prefix('students')->name('students.')->group(function () {
        Route::get('/', [StudentController::class, 'index'])->name('index');
        Route::get('/create', [StudentController::class, 'create'])->name('create');
        Route::post('/', [StudentController::class, 'store'])->name('store');
        Route::get('/{student}', [StudentController::class, 'show'])->name('show');
        Route::get('/{student}/edit', [StudentController::class, 'edit'])->name('edit');
        Route::put('/{student}', [StudentController::class, 'update'])->name('update');
        Route::delete('/{student}', [StudentController::class, 'destroy'])->name('destroy');
        
        // Student specific routes
        Route::get('/{student}/transcript', [StudentController::class, 'transcript'])->name('transcript');
        Route::get('/{student}/grades', [StudentController::class, 'grades'])->name('grades');
        Route::get('/{student}/attendance', [StudentController::class, 'attendance'])->name('attendance');
        Route::get('/{student}/financial-aid', [StudentController::class, 'financialAid'])->name('financial-aid');
    });
    
    // Faculty Management Routes
    Route::prefix('faculty')->name('faculty.')->group(function () {
        Route::get('/', [FacultyController::class, 'index'])->name('index');
        Route::get('/create', [FacultyController::class, 'create'])->name('create');
        Route::post('/', [FacultyController::class, 'store'])->name('store');
        Route::get('/{faculty}', [FacultyController::class, 'show'])->name('show');
        Route::get('/{faculty}/edit', [FacultyController::class, 'edit'])->name('edit');
        Route::put('/{faculty}', [FacultyController::class, 'update'])->name('update');
        Route::delete('/{faculty}', [FacultyController::class, 'destroy'])->name('destroy');
    });
    
    // Course Management Routes
    Route::prefix('courses')->name('courses.')->group(function () {
        Route::get('/', [CourseController::class, 'index'])->name('index');
        Route::get('/create', [CourseController::class, 'create'])->name('create');
        Route::post('/', [CourseController::class, 'store'])->name('store');
        Route::get('/{course}', [CourseController::class, 'show'])->name('show');
        Route::get('/{course}/edit', [CourseController::class, 'edit'])->name('edit');
        Route::put('/{course}', [CourseController::class, 'update'])->name('update');
        Route::delete('/{course}', [CourseController::class, 'destroy'])->name('destroy');
        
        // Course sections
        Route::get('/{course}/sections', [CourseController::class, 'sections'])->name('sections');
        Route::post('/{course}/sections', [CourseController::class, 'createSection'])->name('sections.create');
    });
    
    // Enrollment Management Routes
    Route::prefix('enrollment')->name('enrollment.')->group(function () {
        Route::get('/', [EnrollmentController::class, 'index'])->name('index');
        Route::post('/enroll', [EnrollmentController::class, 'enroll'])->name('enroll');
        Route::post('/drop', [EnrollmentController::class, 'drop'])->name('drop');
        Route::post('/withdraw', [EnrollmentController::class, 'withdraw'])->name('withdraw');
        Route::get('/waitlist', [EnrollmentController::class, 'waitlist'])->name('waitlist');
    });
    
    // Grade Management Routes
    Route::prefix('grades')->name('grades.')->group(function () {
        Route::get('/section/{section}', [GradeController::class, 'sectionGrades'])->name('section');
        Route::post('/section/{section}', [GradeController::class, 'updateSectionGrades'])->name('section.update');
        Route::get('/student/{student}', [GradeController::class, 'studentGrades'])->name('student');
    });
    
    // Transcript Routes
    Route::prefix('transcripts')->name('transcripts.')->group(function () {
        Route::get('/', [TranscriptController::class, 'index'])->name('index');
        Route::post('/request', [TranscriptController::class, 'request'])->name('request');
        Route::get('/{transcript}', [TranscriptController::class, 'show'])->name('show');
        Route::post('/{transcript}/generate', [TranscriptController::class, 'generate'])->name('generate');
    });
    
    // Attendance Routes
    Route::prefix('attendance')->name('attendance.')->group(function () {
        Route::get('/section/{section}', [AttendanceController::class, 'sectionAttendance'])->name('section');
        Route::post('/section/{section}', [AttendanceController::class, 'takeSectionAttendance'])->name('section.take');
        Route::get('/student/{student}', [AttendanceController::class, 'studentAttendance'])->name('student');
    });
    
    // Dashboard and Reports
    Route::get('/dashboard', [\Aero\Education\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/reports', [\Aero\Education\Http\Controllers\ReportController::class, 'index'])->name('reports');
});

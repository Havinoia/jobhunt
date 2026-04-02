<?php

use App\Http\Controllers\Web\ResumeWebController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/resume/{id}', [ResumeWebController::class, 'show'])->name('resume.show');

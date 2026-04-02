<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ResumeProfile;
use Illuminate\View\View;

class ResumeWebController extends Controller
{
    /**
     * Display the full details of a specific resume.
     *
     * @param  string  $id
     * @return \Illuminate\View\View
     */
    public function show(string $id): View
    {
        $resume = ResumeProfile::findOrFail($id);
        
        return view('resume.show', [
            'resume' => $resume,
            'report' => $resume->report
        ]);
    }
}

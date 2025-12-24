<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\PicnicParticipant;
use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Support\Str;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class PicnicController extends Controller
{
    public function index(): \Inertia\Response
    {
        $participants = PicnicParticipant::all();

        return Inertia::render('LeavesEmployee', [
            'title' => 'Leaves',
            'participants' => $participants,
        ]);
    }

    public function show($id)
    {
        $participant = PicnicParticipant::findOrFail($id);
        $randomCode = strtoupper(Str::random(6));

        // Update the participant's random number
        $participant->update(['random_number' => $randomCode]);

        $qrData = json_encode([
            'name' => $participant->name,
            'phone' => $participant->phone,
            'random_number' => $participant->random_number,
            'payment_amount' => $participant->payment_amount,
        ]);

        $qrCode = QrCode::size(300)->generate($qrData);

        return view('picnic.show', compact('participant', 'qrCode'));
    }
}

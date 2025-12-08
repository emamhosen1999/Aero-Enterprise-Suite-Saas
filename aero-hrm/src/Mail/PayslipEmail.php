<?php

namespace Aero\HRM\Mail;

use Aero\HRM\Models\Payslip;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PayslipEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $payslip;

    public $pdfContent;

    /**
     * Create a new message instance.
     */
    public function __construct(Payslip $payslip, $pdfContent)
    {
        $this->payslip = $payslip;
        $this->pdfContent = $pdfContent;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Payslip for '.$this->payslip->pay_period,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.payslip',
            with: [
                'payslip' => $this->payslip,
                'employee' => $this->payslip->employee,
                'payroll' => $this->payslip->payroll,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfContent, 'payslip.pdf')
                ->withMime('application/pdf'),
        ];
    }
}

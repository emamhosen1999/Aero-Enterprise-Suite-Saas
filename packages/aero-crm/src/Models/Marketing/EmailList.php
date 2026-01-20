<?php

namespace Aero\Crm\Models\Marketing;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailList extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'is_public',
        'double_optin',
        'welcome_email_template_id',
        'subscriber_count',
        'active_count',
        'unsubscribed_count',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'double_optin' => 'boolean',
        ];
    }

    /**
     * Get the creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the subscribers
     */
    public function subscribers(): HasMany
    {
        return $this->hasMany(EmailListSubscriber::class, 'list_id');
    }

    /**
     * Get the welcome email template
     */
    public function welcomeTemplate(): BelongsTo
    {
        return $this->belongsTo(EmailTemplate::class, 'welcome_email_template_id');
    }

    /**
     * Get campaigns targeting this list
     */
    public function campaigns(): HasMany
    {
        return $this->hasMany(EmailCampaign::class, 'list_id');
    }

    /**
     * Update subscriber counts
     */
    public function updateCounts(): void
    {
        $counts = $this->subscribers()
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = "unsubscribed" THEN 1 ELSE 0 END) as unsubscribed
            ')
            ->first();

        $this->update([
            'subscriber_count' => $counts->total ?? 0,
            'active_count' => $counts->active ?? 0,
            'unsubscribed_count' => $counts->unsubscribed ?? 0,
        ]);
    }

    /**
     * Add a subscriber
     */
    public function addSubscriber(string $email, array $data = []): EmailListSubscriber
    {
        $subscriber = $this->subscribers()->updateOrCreate(
            ['email' => $email],
            array_merge($data, [
                'status' => $this->double_optin ? 'pending' : 'active',
                'confirmed_at' => $this->double_optin ? null : now(),
            ])
        );

        $this->updateCounts();

        return $subscriber;
    }

    /**
     * Remove a subscriber
     */
    public function removeSubscriber(string $email): bool
    {
        $deleted = $this->subscribers()
            ->where('email', $email)
            ->delete();

        if ($deleted) {
            $this->updateCounts();
        }

        return $deleted > 0;
    }
}

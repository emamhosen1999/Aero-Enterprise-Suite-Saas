<?php

namespace Aero\Rfi\Support;

use Aero\Rfi\Models\DailyWork;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\PathGenerator;

class DailyWorkRfiPathGenerator implements PathGenerator
{
    /**
     * Get the path for the given media, relative to the root storage path.
     * Organizes files as: Daily Work RFIs/{date}/{incharge_name}/
     */
    public function getPath(Media $media): string
    {
        return $this->getBasePath($media).'/';
    }

    /**
     * Get the path for conversions of the given media.
     */
    public function getPathForConversions(Media $media): string
    {
        return $this->getBasePath($media).'/conversions/';
    }

    /**
     * Get the path for responsive images of the given media.
     */
    public function getPathForResponsiveImages(Media $media): string
    {
        return $this->getBasePath($media).'/responsive-images/';
    }

    /**
     * Build the base path for daily work RFI files.
     * Structure: Daily Work RFIs/{YYYY-MM-DD}/{Incharge Name}/
     */
    protected function getBasePath(Media $media): string
    {
        $model = $media->model;

        // Only apply custom path for DailyWork model with rfi_files collection
        if ($media->collection_name !== 'rfi_files' || ! ($model instanceof DailyWork)) {
            // Default path for other collections
            return (string) $media->id;
        }

        // Get the date from the daily work
        $date = $model->date ? $model->date->format('Y-m-d') : date('Y-m-d');

        // Get the in-charge user name
        $inchargeName = 'Unassigned';
        if ($model->incharge_user_id) {
            $inchargeUser = $model->inchargeUser;
            if ($inchargeUser) {
                // Sanitize name for file system (remove special characters)
                $inchargeName = preg_replace('/[^a-zA-Z0-9\s\-]/', '', $inchargeUser->name);
                $inchargeName = str_replace(' ', '_', trim($inchargeName));
            }
        }

        return 'Daily Work RFIs/'.$date.'/'.$inchargeName;
    }
}

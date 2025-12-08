<?php

namespace Aero\Core\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'companyName',
        'contactPerson',
        'address',
        'country',
        'city',
        'state',
        'postalCode',
        'email',
        'phoneNumber',
        'mobileNumber',
        'fax',
        'websiteUrl',
    ];
}

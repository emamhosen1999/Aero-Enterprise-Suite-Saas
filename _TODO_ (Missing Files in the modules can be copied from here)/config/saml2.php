<?php

return [
    /*
    |--------------------------------------------------------------------------
    | SAML2 SSO Configuration
    |--------------------------------------------------------------------------
    |
    | Configure your SAML2 Identity Providers (IdP) here. Each tenant can
    | have their own IdP configuration stored in tenant settings.
    |
    */

    'enabled' => env('SAML_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Default Identity Provider
    |--------------------------------------------------------------------------
    |
    | The default IdP to use when none is specified. This is typically used
    | for platform-level SSO.
    |
    */
    'default_idp' => env('SAML_DEFAULT_IDP', 'default'),

    /*
    |--------------------------------------------------------------------------
    | Identity Providers
    |--------------------------------------------------------------------------
    |
    | Configure your SAML Identity Providers here. You can add multiple IdPs
    | for different authentication scenarios.
    |
    */
    'idps' => [
        'default' => [
            'entityId' => env('SAML_IDP_ENTITY_ID'),
            'singleSignOnService' => [
                'url' => env('SAML_IDP_SSO_URL'),
                'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            ],
            'singleLogoutService' => [
                'url' => env('SAML_IDP_SLO_URL'),
                'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            ],
            'x509cert' => env('SAML_IDP_X509_CERT'),
            // Optional: Multiple certificates for key rollover
            'certFingerprint' => env('SAML_IDP_CERT_FINGERPRINT'),
            'certFingerprintAlgorithm' => 'sha256',
        ],

        // Azure AD (Microsoft Entra ID) preset
        'azure' => [
            'entityId' => env('AZURE_AD_ENTITY_ID'),
            'singleSignOnService' => [
                'url' => env('AZURE_AD_SSO_URL'),
                'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            ],
            'singleLogoutService' => [
                'url' => env('AZURE_AD_SLO_URL'),
                'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            ],
            'x509cert' => env('AZURE_AD_X509_CERT'),
        ],

        // Okta preset
        'okta' => [
            'entityId' => env('OKTA_ENTITY_ID'),
            'singleSignOnService' => [
                'url' => env('OKTA_SSO_URL'),
                'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            ],
            'singleLogoutService' => [
                'url' => env('OKTA_SLO_URL'),
                'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            ],
            'x509cert' => env('OKTA_X509_CERT'),
        ],

        // Google Workspace preset
        'google' => [
            'entityId' => env('GOOGLE_SAML_ENTITY_ID'),
            'singleSignOnService' => [
                'url' => env('GOOGLE_SAML_SSO_URL'),
                'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            ],
            'singleLogoutService' => [
                'url' => env('GOOGLE_SAML_SLO_URL'),
                'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            ],
            'x509cert' => env('GOOGLE_SAML_X509_CERT'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Service Provider Settings
    |--------------------------------------------------------------------------
    |
    | Configure your application as a SAML Service Provider (SP).
    |
    */
    'sp' => [
        'entityId' => env('SAML_SP_ENTITY_ID', env('APP_URL').'/saml2/metadata'),
        'assertionConsumerService' => [
            'url' => env('SAML_SP_ACS_URL', env('APP_URL').'/saml2/acs'),
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        ],
        'singleLogoutService' => [
            'url' => env('SAML_SP_SLS_URL', env('APP_URL').'/saml2/sls'),
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        ],
        'NameIDFormat' => 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

        // SP certificate and private key (optional, for signed requests)
        'x509cert' => env('SAML_SP_X509_CERT'),
        'privateKey' => env('SAML_SP_PRIVATE_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Settings
    |--------------------------------------------------------------------------
    */
    'security' => [
        'nameIdEncrypted' => false,
        'authnRequestsSigned' => env('SAML_SIGN_REQUESTS', false),
        'logoutRequestSigned' => env('SAML_SIGN_LOGOUT_REQUESTS', false),
        'logoutResponseSigned' => env('SAML_SIGN_LOGOUT_RESPONSES', false),
        'signMetadata' => false,
        'wantMessagesSigned' => env('SAML_WANT_MESSAGES_SIGNED', false),
        'wantAssertionsSigned' => env('SAML_WANT_ASSERTIONS_SIGNED', true),
        'wantAssertionsEncrypted' => false,
        'wantNameId' => true,
        'wantNameIdEncrypted' => false,
        'requestedAuthnContext' => false,
        'wantXMLValidation' => true,
        'relaxDestinationValidation' => false,
        'destinationStrictlyMatches' => true,
        'lowercaseUrlencoding' => false,
        'rejectUnsolicitedResponsesWithInResponseTo' => false,
        'signatureAlgorithm' => 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
        'digestAlgorithm' => 'http://www.w3.org/2001/04/xmlenc#sha256',
    ],

    /*
    |--------------------------------------------------------------------------
    | Attribute Mapping
    |--------------------------------------------------------------------------
    |
    | Map SAML attributes to user model fields.
    |
    */
    'attribute_mapping' => [
        'email' => [
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
            'email',
            'mail',
            'Email',
        ],
        'name' => [
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
            'displayName',
            'name',
            'Name',
        ],
        'first_name' => [
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
            'firstName',
            'first_name',
            'givenName',
        ],
        'last_name' => [
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
            'lastName',
            'last_name',
            'sn',
        ],
        'employee_id' => [
            'employeeId',
            'employee_id',
            'employeeNumber',
        ],
        'department' => [
            'department',
            'Department',
        ],
        'job_title' => [
            'jobTitle',
            'title',
            'job_title',
        ],
        'groups' => [
            'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups',
            'groups',
            'memberOf',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Auto-provisioning
    |--------------------------------------------------------------------------
    |
    | Automatically create users when they authenticate via SAML.
    |
    */
    'auto_provision' => env('SAML_AUTO_PROVISION', true),

    /*
    |--------------------------------------------------------------------------
    | Default Role for New Users
    |--------------------------------------------------------------------------
    */
    'default_role' => env('SAML_DEFAULT_ROLE', 'employee'),

    /*
    |--------------------------------------------------------------------------
    | Routes
    |--------------------------------------------------------------------------
    */
    'routes' => [
        'prefix' => 'saml2',
        'middleware' => ['web'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Debug Mode
    |--------------------------------------------------------------------------
    */
    'debug' => env('SAML_DEBUG', false),
];

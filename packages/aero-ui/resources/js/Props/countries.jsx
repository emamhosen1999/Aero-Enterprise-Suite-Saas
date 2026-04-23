/**
 * Props/countries.jsx
 *
 * Provides a getCountries() function returning a list of world countries,
 * each optionally with a states/provinces array.  Used by CompanyInformationForm.
 */

const COUNTRIES = [
    { name: 'Afghanistan', code: 'AF', states: [] },
    { name: 'Albania', code: 'AL', states: [] },
    { name: 'Algeria', code: 'DZ', states: [] },
    { name: 'Argentina', code: 'AR', states: [
        { name: 'Buenos Aires' }, { name: 'Cordoba' }, { name: 'Santa Fe' }, { name: 'Mendoza' }
    ]},
    { name: 'Australia', code: 'AU', states: [
        { name: 'New South Wales' }, { name: 'Victoria' }, { name: 'Queensland' },
        { name: 'Western Australia' }, { name: 'South Australia' }, { name: 'Tasmania' }
    ]},
    { name: 'Austria', code: 'AT', states: [] },
    { name: 'Bangladesh', code: 'BD', states: [
        { name: 'Dhaka' }, { name: 'Chittagong' }, { name: 'Rajshahi' }, { name: 'Khulna' },
        { name: 'Barishal' }, { name: 'Sylhet' }, { name: 'Rangpur' }, { name: 'Mymensingh' }
    ]},
    { name: 'Belgium', code: 'BE', states: [] },
    { name: 'Brazil', code: 'BR', states: [
        { name: 'Sao Paulo' }, { name: 'Rio de Janeiro' }, { name: 'Minas Gerais' },
        { name: 'Bahia' }, { name: 'Parana' }, { name: 'Rio Grande do Sul' }
    ]},
    { name: 'Canada', code: 'CA', states: [
        { name: 'Ontario' }, { name: 'Quebec' }, { name: 'British Columbia' },
        { name: 'Alberta' }, { name: 'Manitoba' }, { name: 'Saskatchewan' },
        { name: 'Nova Scotia' }, { name: 'New Brunswick' }
    ]},
    { name: 'Chile', code: 'CL', states: [] },
    { name: 'China', code: 'CN', states: [
        { name: 'Beijing' }, { name: 'Shanghai' }, { name: 'Guangdong' }, { name: 'Sichuan' }
    ]},
    { name: 'Colombia', code: 'CO', states: [] },
    { name: 'Czech Republic', code: 'CZ', states: [] },
    { name: 'Denmark', code: 'DK', states: [] },
    { name: 'Egypt', code: 'EG', states: [] },
    { name: 'Ethiopia', code: 'ET', states: [] },
    { name: 'Finland', code: 'FI', states: [] },
    { name: 'France', code: 'FR', states: [
        { name: 'Ile-de-France' }, { name: 'Provence-Alpes-Cote d Azur' }, { name: 'Auvergne-Rhone-Alpes' }
    ]},
    { name: 'Germany', code: 'DE', states: [
        { name: 'Bavaria' }, { name: 'North Rhine-Westphalia' }, { name: 'Baden-Wurttemberg' },
        { name: 'Berlin' }, { name: 'Hamburg' }, { name: 'Saxony' }
    ]},
    { name: 'Ghana', code: 'GH', states: [] },
    { name: 'Greece', code: 'GR', states: [] },
    { name: 'Hong Kong', code: 'HK', states: [] },
    { name: 'Hungary', code: 'HU', states: [] },
    { name: 'India', code: 'IN', states: [
        { name: 'Maharashtra' }, { name: 'Karnataka' }, { name: 'Tamil Nadu' },
        { name: 'Uttar Pradesh' }, { name: 'West Bengal' }, { name: 'Gujarat' },
        { name: 'Rajasthan' }, { name: 'Delhi' }, { name: 'Telangana' }, { name: 'Kerala' }
    ]},
    { name: 'Indonesia', code: 'ID', states: [] },
    { name: 'Iran', code: 'IR', states: [] },
    { name: 'Iraq', code: 'IQ', states: [] },
    { name: 'Ireland', code: 'IE', states: [] },
    { name: 'Israel', code: 'IL', states: [] },
    { name: 'Italy', code: 'IT', states: [
        { name: 'Lombardy' }, { name: 'Lazio' }, { name: 'Campania' }, { name: 'Sicily' }
    ]},
    { name: 'Japan', code: 'JP', states: [
        { name: 'Tokyo' }, { name: 'Osaka' }, { name: 'Kanagawa' }, { name: 'Aichi' }
    ]},
    { name: 'Jordan', code: 'JO', states: [] },
    { name: 'Kenya', code: 'KE', states: [] },
    { name: 'Kuwait', code: 'KW', states: [] },
    { name: 'Malaysia', code: 'MY', states: [
        { name: 'Selangor' }, { name: 'Johor' }, { name: 'Sabah' }, { name: 'Sarawak' }
    ]},
    { name: 'Mexico', code: 'MX', states: [
        { name: 'Mexico City' }, { name: 'Jalisco' }, { name: 'Nuevo Leon' }, { name: 'Veracruz' }
    ]},
    { name: 'Morocco', code: 'MA', states: [] },
    { name: 'Myanmar', code: 'MM', states: [] },
    { name: 'Nepal', code: 'NP', states: [] },
    { name: 'Netherlands', code: 'NL', states: [] },
    { name: 'New Zealand', code: 'NZ', states: [] },
    { name: 'Nigeria', code: 'NG', states: [
        { name: 'Lagos' }, { name: 'Kano' }, { name: 'Rivers' }, { name: 'Oyo' }
    ]},
    { name: 'Norway', code: 'NO', states: [] },
    { name: 'Pakistan', code: 'PK', states: [
        { name: 'Punjab' }, { name: 'Sindh' }, { name: 'Khyber Pakhtunkhwa' }, { name: 'Balochistan' }
    ]},
    { name: 'Peru', code: 'PE', states: [] },
    { name: 'Philippines', code: 'PH', states: [] },
    { name: 'Poland', code: 'PL', states: [] },
    { name: 'Portugal', code: 'PT', states: [] },
    { name: 'Qatar', code: 'QA', states: [] },
    { name: 'Romania', code: 'RO', states: [] },
    { name: 'Russia', code: 'RU', states: [
        { name: 'Moscow' }, { name: 'Saint Petersburg' }, { name: 'Novosibirsk' }
    ]},
    { name: 'Saudi Arabia', code: 'SA', states: [
        { name: 'Riyadh' }, { name: 'Makkah' }, { name: 'Eastern Province' }
    ]},
    { name: 'Singapore', code: 'SG', states: [] },
    { name: 'South Africa', code: 'ZA', states: [
        { name: 'Gauteng' }, { name: 'Western Cape' }, { name: 'KwaZulu-Natal' }
    ]},
    { name: 'South Korea', code: 'KR', states: [] },
    { name: 'Spain', code: 'ES', states: [
        { name: 'Madrid' }, { name: 'Catalonia' }, { name: 'Andalusia' }, { name: 'Valencia' }
    ]},
    { name: 'Sri Lanka', code: 'LK', states: [] },
    { name: 'Sweden', code: 'SE', states: [] },
    { name: 'Switzerland', code: 'CH', states: [] },
    { name: 'Taiwan', code: 'TW', states: [] },
    { name: 'Tanzania', code: 'TZ', states: [] },
    { name: 'Thailand', code: 'TH', states: [] },
    { name: 'Turkey', code: 'TR', states: [] },
    { name: 'Ukraine', code: 'UA', states: [] },
    { name: 'United Arab Emirates', code: 'AE', states: [
        { name: 'Abu Dhabi' }, { name: 'Dubai' }, { name: 'Sharjah' }, { name: 'Ajman' }
    ]},
    { name: 'United Kingdom', code: 'GB', states: [
        { name: 'England' }, { name: 'Scotland' }, { name: 'Wales' }, { name: 'Northern Ireland' }
    ]},
    { name: 'United States', code: 'US', states: [
        { name: 'Alabama' }, { name: 'Alaska' }, { name: 'Arizona' }, { name: 'Arkansas' },
        { name: 'California' }, { name: 'Colorado' }, { name: 'Connecticut' }, { name: 'Delaware' },
        { name: 'Florida' }, { name: 'Georgia' }, { name: 'Hawaii' }, { name: 'Idaho' },
        { name: 'Illinois' }, { name: 'Indiana' }, { name: 'Iowa' }, { name: 'Kansas' },
        { name: 'Kentucky' }, { name: 'Louisiana' }, { name: 'Maine' }, { name: 'Maryland' },
        { name: 'Massachusetts' }, { name: 'Michigan' }, { name: 'Minnesota' }, { name: 'Mississippi' },
        { name: 'Missouri' }, { name: 'Montana' }, { name: 'Nebraska' }, { name: 'Nevada' },
        { name: 'New Hampshire' }, { name: 'New Jersey' }, { name: 'New Mexico' }, { name: 'New York' },
        { name: 'North Carolina' }, { name: 'North Dakota' }, { name: 'Ohio' }, { name: 'Oklahoma' },
        { name: 'Oregon' }, { name: 'Pennsylvania' }, { name: 'Rhode Island' }, { name: 'South Carolina' },
        { name: 'South Dakota' }, { name: 'Tennessee' }, { name: 'Texas' }, { name: 'Utah' },
        { name: 'Vermont' }, { name: 'Virginia' }, { name: 'Washington' }, { name: 'West Virginia' },
        { name: 'Wisconsin' }, { name: 'Wyoming' }
    ]},
    { name: 'Uruguay', code: 'UY', states: [] },
    { name: 'Venezuela', code: 'VE', states: [] },
    { name: 'Vietnam', code: 'VN', states: [] },
    { name: 'Zimbabwe', code: 'ZW', states: [] },
];

/**
 * Returns the full list of countries (sorted alphabetically by name).
 * Each entry: { name: string, code: string, states: Array<{name: string}> }
 *
 * @returns {Array} country list
 */
export function getCountries() {
    return COUNTRIES;
}

export default getCountries;
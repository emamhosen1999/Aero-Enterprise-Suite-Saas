// Shared navigation configuration for public pages
// Used by PublicLayout header, Footer, and mobile menu

export const publicNavLinks = [
  { label: 'Home', routeName: 'platform.home', type: 'route' },
  { label: 'Platform', routeName: 'platform.features', type: 'route' },
  { label: 'Pricing', routeName: 'platform.pricing', type: 'route' },
  { label: 'About', routeName: 'platform.about', type: 'route' },
  { label: 'Resources', routeName: 'platform.resources', type: 'route' },
  { label: 'Support', routeName: 'platform.support', type: 'route' },
];

export const footerColumns = [
  {
    heading: 'Platform',
    links: [
      { label: 'Platform', routeName: 'platform.features' },
      { label: 'Pricing', routeName: 'platform.pricing' },
      { label: 'Resources', routeName: 'platform.resources' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', routeName: 'platform.about' },
      { label: 'Support', routeName: 'platform.support' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Support', routeName: 'platform.support' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', routeName: 'platform.legal.privacy' },
      { label: 'Terms of Service', routeName: 'platform.legal.terms' },
      { label: 'Cookie Policy', routeName: 'platform.legal.cookies' },
    ],
  },
];

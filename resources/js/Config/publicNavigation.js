// Shared navigation configuration for public pages
// Used by PublicLayout header, Footer, and mobile menu

export const publicNavLinks = [
  { label: 'Home', routeName: 'landing', type: 'route' },
  { label: 'Features', routeName: 'features', type: 'route' },
  { label: 'Pricing', routeName: 'pricing', type: 'route' },
  { label: 'About', routeName: 'about', type: 'route' },
  { label: 'Resources', routeName: 'resources', type: 'route' },
  { label: 'Support', routeName: 'support', type: 'route' },
  { label: 'Demo', routeName: 'demo', type: 'route' },
  { label: 'Contact', routeName: 'contact', type: 'route' },
];

export const footerColumns = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', routeName: 'features' },
      { label: 'Pricing', routeName: 'pricing' },
      { label: 'Demo', routeName: 'demo' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', routeName: 'about' },
      { label: 'Careers', routeName: 'careers' },
      { label: 'Blog', routeName: 'blog' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', routeName: 'docs' },
      { label: 'Support', routeName: 'support' },
      { label: 'Contact', routeName: 'contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', routeName: 'legal.privacy' },
      { label: 'Terms of Service', routeName: 'legal.terms' },
      { label: 'Cookie Policy', routeName: 'legal.cookies' },
    ],
  },
];

import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Button, Chip, Divider } from '@heroui/react';
import { BuildingOffice2Icon, PhoneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { hasRoute, safeRoute } from '@/utils/routing/routeUtils';

/**
 * Enterprise Plan Card Component
 * 
 * Special card for enterprise customers with Contact Sales CTA.
 * Highlights custom pricing, dedicated support, and enterprise features.
 */
export default function EnterprisePlanCard({
  className = '',
  onContactSales,
}) {
  const { isDark: isDarkMode } = useTheme();

  const palette = {
    surface: isDarkMode
      ? 'bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/10 border-2 border-primary/40'
      : 'bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 border-2 border-primary/30',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    muted: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    highlight: 'text-primary',
  };

  const enterpriseFeatures = [
    'Unlimited users & storage',
    'All modules included',
    'Dedicated account manager',
    'Custom integrations',
    'On-premise deployment option',
    '24/7 priority support',
    'Custom SLA guarantees',
    'Security audit & compliance',
    'Training & onboarding',
    'Custom branding',
  ];

  const handleContactSales = () => {
    if (onContactSales) {
      onContactSales();
      return;
    }

    // Default behavior: navigate to contact sales or open email
    if (hasRoute('contact.sales')) {
      window.location.href = safeRoute('contact.sales');
    } else {
      window.location.href = 'mailto:sales@eos365.com?subject=Enterprise%20Plan%20Inquiry';
    }
  };

  return (
    <Card
      className={`${palette.surface} ${className}`}
      shadow="lg"
    >
      <CardHeader className="flex flex-col items-center gap-3 pt-6 pb-4">
        <div className="p-3 rounded-xl bg-primary/20">
          <BuildingOffice2Icon className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <Chip color="primary" variant="flat" size="sm" className="mb-2">
            For Large Organizations
          </Chip>
          <h3 className={`text-2xl font-bold ${palette.text}`}>
            Enterprise
          </h3>
          <p className={`text-sm ${palette.muted} mt-1`}>
            Custom solutions for 100+ employees
          </p>
        </div>
      </CardHeader>

      <Divider />

      <CardBody className="px-6 py-5 space-y-5">
        {/* Custom Pricing */}
        <div className="text-center">
          <p className={`text-3xl font-bold ${palette.text}`}>
            Custom Pricing
          </p>
          <p className={`text-sm ${palette.muted}`}>
            Tailored to your organization's needs
          </p>
        </div>

        {/* Feature List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {enterpriseFeatures.map((feature) => (
            <div key={feature} className={`flex items-center gap-2 text-sm ${palette.muted}`}>
              <svg className="w-4 h-4 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <Divider />

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            color="primary"
            variant="shadow"
            size="lg"
            className="w-full"
            startContent={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
            onPress={handleContactSales}
          >
            Contact Sales
          </Button>

          <Button
            variant="bordered"
            size="md"
            className="w-full"
            startContent={<PhoneIcon className="w-4 h-4" />}
            onPress={() => window.location.href = 'tel:+1-800-AERO365'}
          >
            Schedule a Demo
          </Button>
        </div>

        <p className={`text-xs text-center ${palette.muted}`}>
          Get a response within 24 hours
        </p>
      </CardBody>
    </Card>
  );
}

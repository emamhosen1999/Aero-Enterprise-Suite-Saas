import React, { useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Chip } from '@heroui/react';
import AuthCard from '@/Components/UI/AuthCard.jsx'
import RegisterLayout from '@/Layouts/RegisterLayout.jsx'
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding';
import { hasRoute } from '@/utils/routeUtils';
import { showToast } from '@/utils/toastUtils';
import ProgressSteps from './components/ProgressSteps.jsx';

const accountOptions = [
  {
    type: 'company',
    headline: 'Company workspace',
    copy: 'Best for founding teams, HR, PMOs, and compliance pods rolling out across multiple departments.',
    bullets: ['Unlimited teammates', 'Module-level access controls', 'Centralized billing'],
  },
  {
    type: 'individual',
    headline: 'Solo or consultant',
    copy: 'Perfect for fractional operators validating processes before inviting the wider org.',
    bullets: ['Single-seat workspace', 'Upgrade anytime', 'Keep data isolated per client'],
  },
];

export default function AccountType({ steps = [], currentStep, savedData = {}, trialDays = 14 }) {
  const { data, setData, post, processing, errors } = useForm({
    type: savedData?.account?.type ?? 'company',
  });

  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const { siteName } = useBranding();

  const description = useMemo(
    () => trialDays > 0
      ? `Every workspace starts with a ${trialDays}-day sandbox. You will only add a card when you are ready to activate billing.`
      : 'Pick the tenant type that reflects how you plan to collaborate.',
    [trialDays]
  );

  const palette = useMemo(() => ({
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    copy: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    badge: isDarkMode ? 'text-slate-300' : 'text-slate-500',
    cardActive: isDarkMode
      ? 'bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-cyan-500/10 border border-blue-400/40'
      : 'bg-gradient-to-br from-white via-indigo-50 to-slate-50 border border-blue-200 shadow-lg',
    cardIdle: isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm',
    sublabel: isDarkMode ? 'text-slate-400' : 'text-slate-500',
  }), [isDarkMode]);

  const handleSubmit = (event) => {
    event.preventDefault();
    
    // Validate route exists before submission
    if (!hasRoute('platform.register.account-type.store')) {
      console.error('Route platform.register.account-type.store not found');
      showToast.error('Navigation route not found. Please contact support.');
      return;
    }
    
    const url = route('platform.register.account-type.store');
    post(url);
  };

  return (
    <RegisterLayout>
      <Head title={`Create your workspace - ${siteName || 'aeos365'}`} />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-5 text-center">
          <Chip color="secondary" variant="flat" className={`uppercase tracking-[0.3em] text-[10px] sm:text-xs ${palette.badge}`}>Step 1</Chip>
          <h1 className={`text-2xl sm:text-4xl md:text-5xl font-semibold ${palette.heading} px-2`}>Who is this workspace for?</h1>
          <p className={`${palette.copy} max-w-3xl mx-auto text-sm sm:text-base px-2`}>{description}</p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <AuthCard>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {accountOptions.map((option) => {
                const isSelected = data.type === option.type;
                return (
                  <Card
                    key={option.type}
                    isPressable
                    onPress={() => setData('type', option.type)}
                    className={isSelected ? palette.cardActive : palette.cardIdle}
                  >
                    <CardHeader className="justify-between pb-2">
                      <div>
                        <p className={`text-xs sm:text-sm ${palette.sublabel}`}>{option.type === 'company' ? 'Full suite' : 'Light mode'}</p>
                        <h2 className={`text-lg sm:text-2xl font-semibold ${palette.heading}`}>{option.headline}</h2>
                      </div>
                      {isSelected && (
                        <Chip color="success" variant="flat" size="sm" className="text-xs">Selected</Chip>
                      )}
                    </CardHeader>
                    <CardBody className="space-y-2 sm:space-y-3 pt-2">
                      <p className={`text-sm sm:text-base ${palette.copy}`}>{option.copy}</p>
                      <ul className={`text-xs sm:text-sm space-y-1 list-disc list-inside ${palette.copy}`}>
                        {option.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </CardBody>
                  </Card>
                );
              })}
            </div>

            {errors.type && <p className="text-sm text-red-400">{errors.type}</p>}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <p className={`text-xs sm:text-sm ${palette.sublabel}`}>
                Need to onboard multiple subsidiaries? You can add them later from the admin console.
              </p>
              <Button color="primary" className="bg-gradient-to-r from-blue-500 to-purple-600 w-full sm:w-auto" type="submit" isLoading={processing}>
                Continue to details
              </Button>
            </div>
          </form>
        </AuthCard>
      </section>
    </RegisterLayout>
  );
}

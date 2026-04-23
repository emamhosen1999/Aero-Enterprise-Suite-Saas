import { Head } from '@inertiajs/react';
import RegistrationLayout from './RegistrationLayout';
import StepAccountType from './components/StepAccountType';
import StepDetails from './components/StepDetails';
import StepVerifyEmail from './components/StepVerifyEmail';
import StepVerifyPhone from './components/StepVerifyPhone';
import StepPlan from './components/StepPlan';
import StepPayment from './components/StepPayment';
import StepProvisioning from './components/StepProvisioning';
import StepSuccess from './components/StepSuccess';
import '../styles/public.css';

export default function RegistrationPage(props) {
    const {
        steps = [],
        currentStep = 'account',
        savedData = {},
        trialDays = 14,
        accountType,
        email,
        companyName,
        phone,
        plans = [],
        modules = [],
        baseDomain,
        tenant,
        result,
    } = props;

    return (
        <>
            <Head title="Registration" />
            <RegistrationLayout steps={steps} currentStep={currentStep}>
                {currentStep === 'account' && <StepAccountType savedData={savedData} />}
                {currentStep === 'details' && (
                    <StepDetails
                        savedData={savedData}
                        accountType={accountType || savedData?.account?.type}
                        baseDomain={baseDomain}
                    />
                )}
                {currentStep === 'verify-email' && <StepVerifyEmail email={email} companyName={companyName} />}
                {currentStep === 'verify-phone' && <StepVerifyPhone phone={phone} companyName={companyName} />}
                {currentStep === 'plan' && <StepPlan plans={plans} modules={modules} savedData={savedData} />}
                {currentStep === 'payment' && (
                    <StepPayment
                        savedData={savedData}
                        plans={plans}
                        trialDays={trialDays}
                        baseDomain={baseDomain}
                    />
                )}
                {currentStep === 'provisioning' && <StepProvisioning tenant={tenant} />}
                {currentStep === 'success' && <StepSuccess result={result} baseDomain={baseDomain} />}
            </RegistrationLayout>
        </>
    );
}

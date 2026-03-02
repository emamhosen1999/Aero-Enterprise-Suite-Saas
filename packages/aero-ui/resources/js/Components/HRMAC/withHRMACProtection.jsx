/**
 * withHRMACProtection Higher-Order Component
 * 
 * Automatically protects a page component with HRMAC access checks.
 * Shows access denied page if user doesn't have required access.
 * Super Administrators bypass all checks automatically.
 */

import React from 'react';
import { usePage, router } from '@inertiajs/react';
import { hasAccess, isSuperAdmin } from '@/utils/moduleAccessUtils';
import { Card, CardBody, CardHeader, Button, Chip } from '@heroui/react';
import { 
    LockClosedIcon, 
    HomeIcon,
    ShieldExclamationIcon 
} from '@heroicons/react/24/outline';

const DefaultAccessDenied = ({ accessPath, message }) => {
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen p-6">
            <Card 
                className="max-w-md w-full transition-all duration-200"
                style={{
                    border: `var(--borderWidth, 2px) solid transparent`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    background: `linear-gradient(135deg, 
                        var(--theme-content1, #FAFAFA) 20%, 
                        var(--theme-content2, #F4F4F5) 10%, 
                        var(--theme-content3, #F1F3F4) 20%)`,
                }}
            >
                <CardHeader 
                    className="flex flex-col items-center gap-3 pt-8"
                    style={{
                        borderColor: `var(--theme-divider, #E4E4E7)`,
                    }}
                >
                    <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ 
                            backgroundColor: 'color-mix(in srgb, var(--theme-danger, #F31260) 20%, transparent)',
                            borderRadius: getThemeRadius()
                        }}
                    >
                        <LockClosedIcon 
                            className="w-10 h-10" 
                            style={{ color: 'var(--theme-danger, #F31260)' }} 
                        />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-foreground">
                        Access Denied
                    </h2>
                    
                    {accessPath && (
                        <Chip 
                            color="danger" 
                            variant="flat"
                            size="sm"
                            startContent={<ShieldExclamationIcon className="w-4 h-4" />}
                        >
                            {accessPath}
                        </Chip>
                    )}
                </CardHeader>
                
                <CardBody className="text-center px-8 pb-8">
                    <p className="text-default-500 mb-6">
                        {message || "Access to this page is not permitted for your account. Contact your administrator if you require access."}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            color="primary"
                            variant="shadow"
                            startContent={<HomeIcon className="w-5 h-5" />}
                            onPress={() => router.visit('/dashboard')}
                        >
                            Go to Dashboard
                        </Button>
                        <Button
                            variant="flat"
                            onPress={() => router.visit(-1)}
                        >
                            Go Back
                        </Button>
                    </div>
                    
                    <p className="text-xs text-default-400 mt-6">
                        Need access? Contact your system administrator
                    </p>
                </CardBody>
            </Card>
        </div>
    );
};

export const withHRMACProtection = (accessPath, options = {}) => {
    const { 
        redirect = false, 
        redirectTo = '/dashboard',
        customDeniedComponent: CustomDeniedComponent = null,
        deniedMessage = null,
        onAccessDenied = null
    } = options;
    
    return (WrappedComponent) => {
        const ProtectedComponent = (props) => {
            const { auth } = usePage().props;
            
            if (isSuperAdmin(auth?.user)) {
                return <WrappedComponent {...props} />;
            }
            
            const userHasAccess = hasAccess(accessPath, auth);
            
            if (userHasAccess) {
                return <WrappedComponent {...props} />;
            }
            
            if (onAccessDenied) {
                onAccessDenied(accessPath, auth?.user);
            }
            
            if (redirect) {
                router.visit(redirectTo);
                return null;
            }
            
            if (CustomDeniedComponent) {
                return <CustomDeniedComponent accessPath={accessPath} auth={auth} />;
            }
            
            return <DefaultAccessDenied accessPath={accessPath} message={deniedMessage} />;
        };
        
        ProtectedComponent.displayName = `withHRMACProtection(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
        
        return ProtectedComponent;
    };
};

export const withModuleProtection = (moduleCode, options = {}) =>
    withHRMACProtection(moduleCode, options);

export const withSubModuleProtection = (moduleCode, subModuleCode, options = {}) =>
    withHRMACProtection(`${moduleCode}.${subModuleCode}`, options);

export const withComponentProtection = (moduleCode, subModuleCode, componentCode, options = {}) =>
    withHRMACProtection(`${moduleCode}.${subModuleCode}.${componentCode}`, options);

export const withActionProtection = (moduleCode, subModuleCode, componentCode, actionCode, options = {}) =>
    withHRMACProtection(`${moduleCode}.${subModuleCode}.${componentCode}.${actionCode}`, options);

export default withHRMACProtection;

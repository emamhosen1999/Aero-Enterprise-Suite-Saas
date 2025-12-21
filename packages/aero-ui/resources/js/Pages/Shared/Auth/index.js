/**
 * Shared Auth Pages - Named Exports
 * 
 * Centralized auth pages used by both tenant and platform admin contexts.
 * These pages use relative URLs/routes that work across contexts.
 */

export { default as Login } from './Login/Index';
export { default as Register } from './Register/Index';
export { default as ForgotPassword } from './ForgotPassword/Index';
export { default as ResetPassword } from './ResetPassword/Index';
export { default as VerifyEmail } from './VerifyEmail/Index';
export { default as AcceptInvitation } from './AcceptInvitation/Index';
export { default as InvitationExpired } from './InvitationExpired/Index';
export { default as AdminSetup } from './AdminSetup/Index';

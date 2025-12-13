/**
 * Aero SaaS Host - Entry Point
 * 
 * This is a "Zero-Touch" host app. All logic is in the packages.
 * The host simply boots the Aero Platform and everything works.
 */
import '../css/app.css';
import './bootstrap';
import { bootAeroApp } from '@platform/boot';

// Boot the Aero SaaS application
bootAeroApp('Aero Enterprise Suite');

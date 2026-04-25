import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
  ButtonGroup,
} from '@heroui/react';
import { useTheme } from '@/Context/ThemeContext';
import {
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * ThemeSettingDrawer — aeos365 (v3, Foundation Pass)
 *
 * The aeos365 design system locks brand colors, typography, density, and
 * card styles. Tenant-level theme customization (color presets, font choice,
 * card variants, dim/midnight modes) is removed.
 *
 * What remains:
 *   - Mode toggle: Dark · Light · System
 *   - Reduce Motion (accessibility)
 *   - Reset
 *
 * The legacy controls block can be opened (read-only deprecation notice)
 * via `?legacy_theme=1` for one release.
 *
 * @see docs/superpowers/specs/2026-04-25-aeos365-design-system-foundation-design.md
 */
const ThemeSettingDrawer = ({ isOpen, onClose }) => {
  const { mode, setMode, reduceMotion, setReduceMotion, resetTheme } = useTheme();

  const showLegacy = typeof window !== 'undefined' && window.location.search.includes('legacy_theme=1');

  const ModeButton = ({ value, label, icon: Icon }) => {
    const active = mode === value;
    return (
      <Button
        size="sm"
        radius="md"
        variant={active ? 'solid' : 'flat'}
        color={active ? 'primary' : 'default'}
        startContent={<Icon className="w-4 h-4" />}
        onPress={() => setMode(value)}
        className="flex-1"
      >
        {label}
      </Button>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      size="md"
      backdrop="blur"
      classNames={{
        base: 'aeos-glass-strong',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span
            className="aeos-label-mono"
            style={{ color: 'var(--aeos-cyan, #00E5FF)' }}
          >
            / Theme
          </span>
          <h2
            style={{
              fontFamily: 'var(--aeos-font-display, "Syne"), system-ui, sans-serif',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              fontSize: '1.4rem',
            }}
          >
            Appearance
          </h2>
        </ModalHeader>

        <ModalBody className="gap-5 pb-2">
          {/* Brand-locked banner */}
          <div
            className="flex items-start gap-2 p-3 rounded-md"
            style={{
              background: 'rgba(0, 229, 255, 0.06)',
              border: '1px solid rgba(0, 229, 255, 0.18)',
            }}
          >
            <InformationCircleIcon
              className="w-5 h-5 shrink-0 mt-0.5"
              style={{ color: 'var(--aeos-cyan, #00E5FF)' }}
            />
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--aeos-ink-muted, #8892A4)' }}
            >
              The aeos365 design system locks brand colors, typography, and card styles.
              Customisation is limited to mode and accessibility.
            </p>
          </div>

          {/* Mode */}
          <div>
            <p
              className="aeos-label-mono mb-2"
              style={{ color: 'var(--aeos-ink-muted, #8892A4)' }}
            >
              / Mode
            </p>
            <ButtonGroup className="w-full" radius="md">
              <ModeButton value="aeos"       label="Dark"   icon={MoonIcon} />
              <ModeButton value="aeos-light" label="Light"  icon={SunIcon} />
              <ModeButton value="system"     label="System" icon={ComputerDesktopIcon} />
            </ButtonGroup>
          </div>

          {/* Reduce motion */}
          <div className="flex items-center justify-between">
            <div>
              <p
                className="aeos-label-mono"
                style={{ color: 'var(--aeos-ink-muted, #8892A4)' }}
              >
                / Reduce Motion
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--aeos-ink-faint, #4A5468)' }}
              >
                Disables animations and transitions for accessibility.
              </p>
            </div>
            <Switch
              isSelected={!!reduceMotion}
              onValueChange={setReduceMotion}
              color="primary"
              size="sm"
            />
          </div>

          {showLegacy && (
            <div
              className="p-3 rounded-md text-xs"
              style={{
                background: 'rgba(255, 179, 71, 0.06)',
                border: '1px solid rgba(255, 179, 71, 0.20)',
                color: 'var(--aeos-amber, #FFB347)',
              }}
            >
              <strong>Legacy controls</strong> have been removed. Per-tenant theme presets,
              card-style variants, and font choice are no longer configurable. Existing
              localStorage preferences are migrated automatically on first load.
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="light"
            startContent={<ArrowPathIcon className="w-4 h-4" />}
            onPress={resetTheme}
            size="sm"
          >
            Reset
          </Button>
          <Button color="primary" onPress={onClose} size="sm">
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ThemeSettingDrawer;

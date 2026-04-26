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
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  Bars3BottomLeftIcon,
  SparklesIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

/**
 * ThemeSettingDrawer — aeos365 (v3.1, Component Library Pass)
 *
 * Surfaces every locked-but-tunable axis in one drawer:
 *   - Mode      (aeos / aeos-light / system)
 *   - Density   (compact / cozy / comfortable)
 *   - Intensity (brand / soft / high-contrast) — accent intensity, not new colors
 *   - Contrast  (standard / high) — accessibility add-on
 *   - Reduce motion
 *
 * No tenant brand color picker, no per-tenant fonts. The aeos365 spec is
 * the source of truth; this drawer only adjusts how strongly that source
 * speaks.
 *
 * @see docs/superpowers/specs/2026-04-25-aeos365-design-system-foundation-design.md
 */
const ThemeSettingDrawer = ({ isOpen, onClose }) => {
  const {
    mode, setMode,
    density, setDensity,
    intensity, setIntensity,
    contrast, setContrast,
    reduceMotion, setReduceMotion,
    resetTheme,
  } = useTheme();

  const Section = ({ kicker, children }) => (
    <div>
      <p
        className="aeos-label-mono mb-2"
        style={{ color: 'var(--aeos-ink-muted, #8892A4)' }}
      >
        / {kicker}
      </p>
      {children}
    </div>
  );

  const SegBtn = ({ active, label, icon: Icon, onPress }) => (
    <Button
      size="sm"
      radius="md"
      variant={active ? 'solid' : 'flat'}
      color={active ? 'primary' : 'default'}
      startContent={Icon ? <Icon className="w-4 h-4" /> : null}
      onPress={onPress}
      className="flex-1"
    >
      {label}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      size="md"
      backdrop="blur"
      classNames={{ base: 'aeos-glass-strong' }}
      scrollBehavior="inside"
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
            Appearance &amp; ergonomics
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
              Brand colors and typography are locked by the aeos365 design system.
              These controls adjust intensity, density, and accessibility — never the palette.
            </p>
          </div>

          {/* Mode */}
          <Section kicker="Mode">
            <ButtonGroup className="w-full" radius="md">
              <SegBtn active={mode === 'aeos'}       label="Dark"   icon={MoonIcon}             onPress={() => setMode('aeos')} />
              <SegBtn active={mode === 'aeos-light'} label="Light"  icon={SunIcon}              onPress={() => setMode('aeos-light')} />
              <SegBtn active={mode === 'system'}     label="System" icon={ComputerDesktopIcon} onPress={() => setMode('system')} />
            </ButtonGroup>
          </Section>

          {/* Density */}
          <Section kicker="Density">
            <ButtonGroup className="w-full" radius="md">
              <SegBtn active={density === 'compact'}     label="Compact"      icon={ArrowsPointingInIcon}  onPress={() => setDensity('compact')} />
              <SegBtn active={density === 'cozy'}        label="Cozy"         icon={Bars3BottomLeftIcon}  onPress={() => setDensity('cozy')} />
              <SegBtn active={density === 'comfortable'} label="Comfortable"  icon={ArrowsPointingOutIcon} onPress={() => setDensity('comfortable')} />
            </ButtonGroup>
            <p className="text-xs mt-2" style={{ color: 'var(--aeos-ink-faint, #4A5468)' }}>
              Compact tightens spacing for data-heavy screens.
            </p>
          </Section>

          {/* Intensity */}
          <Section kicker="Intensity">
            <ButtonGroup className="w-full" radius="md">
              <SegBtn active={intensity === 'brand'}         label="Brand"          icon={SparklesIcon}             onPress={() => setIntensity('brand')} />
              <SegBtn active={intensity === 'soft'}          label="Soft"           icon={AdjustmentsHorizontalIcon} onPress={() => setIntensity('soft')} />
              <SegBtn active={intensity === 'high-contrast'} label="High contrast"  icon={EyeIcon}                  onPress={() => setIntensity('high-contrast')} />
            </ButtonGroup>
            <p className="text-xs mt-2" style={{ color: 'var(--aeos-ink-faint, #4A5468)' }}>
              Soft lowers saturation for long reading sessions; High contrast brightens accents.
            </p>
          </Section>

          {/* Contrast */}
          <Section kicker="Accessibility — contrast">
            <ButtonGroup className="w-full" radius="md">
              <SegBtn active={contrast === 'standard'} label="Standard" onPress={() => setContrast('standard')} />
              <SegBtn active={contrast === 'high'}     label="High"     onPress={() => setContrast('high')} />
            </ButtonGroup>
          </Section>

          {/* Reduce motion */}
          <div className="flex items-center justify-between">
            <div>
              <p className="aeos-label-mono" style={{ color: 'var(--aeos-ink-muted, #8892A4)' }}>
                / Reduce motion
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--aeos-ink-faint, #4A5468)' }}>
                Disables animations and transitions.
              </p>
            </div>
            <Switch
              isSelected={!!reduceMotion}
              onValueChange={setReduceMotion}
              color="primary"
              size="sm"
            />
          </div>
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

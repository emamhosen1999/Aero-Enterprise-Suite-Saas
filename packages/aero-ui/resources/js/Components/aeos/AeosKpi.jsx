import React from 'react';

/**
 * AeosKpi — KPI tile from preview/app-shell.html (`.stat`).
 *
 *   <AeosKpi label="HEADCOUNT" value="12,847" deltaText="+247 this quarter" deltaDir="up" />
 *   <AeosKpi label="PAYROLL · MTD" value="£4.82M" amber />
 *
 * Renders mono-kicker label + mono stat number + optional ▲/▼ delta.
 *
 * @see aeos365-design-system/project/preview/app-shell.html (.stat)
 */
const AeosKpi = React.forwardRef(function AeosKpi(
  { label, value, deltaText, deltaDir, amber, cyan, indigo, sparkline, icon, className = '', style, ...rest },
  ref
) {
  const valueColor = amber
    ? 'var(--aeos-int-amber, var(--aeos-amber, #FFB347))'
    : cyan
      ? 'var(--aeos-int-cyan, var(--aeos-cyan, #00E5FF))'
      : indigo
        ? 'var(--aeos-int-indigo, var(--aeos-indigo, #6366F1))'
        : 'var(--aeos-ink, #E8EDF5)';

  return (
    <div
      ref={ref}
      className={`aeos-kpi ${className}`.trim()}
      style={{
        padding: '16px 18px',
        borderRadius: 'var(--aeos-r-lg, 12px)',
        background: 'rgba(13, 17, 32, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'border-color var(--aeos-dur-base) var(--aeos-ease-out)',
        ...style,
      }}
      {...rest}
    >
      {(label || icon) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--aeos-ink-muted, #8892A4)',
          }}
        >
          {icon}
          <span>{label}</span>
        </div>
      )}
      <div
        style={{
          fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
          fontSize: '1.5rem',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: valueColor,
          fontFeatureSettings: '"tnum"',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {deltaText && (
        <div
          style={{
            marginTop: 4,
            fontFamily: 'var(--aeos-font-mono)',
            fontSize: '0.7rem',
            color: deltaDir === 'down'
              ? 'var(--aeos-danger, #FF6B6B)'
              : deltaDir === 'flat'
                ? 'var(--aeos-ink-muted, #8892A4)'
                : 'var(--aeos-success, #22C55E)',
          }}
        >
          {deltaDir === 'down' ? '▼' : deltaDir === 'flat' ? '◆' : '▲'} {deltaText}
        </div>
      )}
      {sparkline && (
        <div style={{ marginTop: 10 }}>{sparkline}</div>
      )}
    </div>
  );
});

export default AeosKpi;

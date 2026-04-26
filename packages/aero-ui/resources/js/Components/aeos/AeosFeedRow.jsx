import React from 'react';
import AeosIconTile from './AeosIconTile';

/**
 * AeosFeedRow — activity-feed row matching `.feed-row` in app-shell.html.
 *
 *   <AeosFeedRow
 *     icon={<UserPlusIcon />}
 *     iconColor="cyan"
 *     who="Sofia Kotka"
 *     meta="joined Design Systems · Kraków"
 *     when="2m ago"
 *   />
 *
 * @see aeos365-design-system/project/preview/app-shell.html (.feed-row)
 */
const AeosFeedRow = React.forwardRef(function AeosFeedRow(
  { icon, iconColor = 'cyan', who, meta, when, isLast = false, className = '', style, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={`aeos-feed-row ${className}`.trim()}
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr auto',
        gap: 12,
        padding: '10px 0',
        borderBottom: isLast ? '0' : '1px solid var(--aeos-divider)',
        alignItems: 'flex-start',
        fontSize: '0.84rem',
        ...style,
      }}
      {...rest}
    >
      <AeosIconTile color={iconColor} size={28} radius={6}>{icon}</AeosIconTile>
      <div style={{ minWidth: 0 }}>
        {who && (
          <div style={{ color: 'var(--aeos-ink, #E8EDF5)', fontWeight: 500 }}>{who}</div>
        )}
        {meta && (
          <div style={{ color: 'var(--aeos-ink-muted, #8892A4)', fontSize: '0.78rem' }}>{meta}</div>
        )}
      </div>
      {when && (
        <div
          style={{
            fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
            fontSize: '0.7rem',
            color: 'var(--aeos-ink-faint, #4A5468)',
            whiteSpace: 'nowrap',
          }}
        >
          {when}
        </div>
      )}
    </div>
  );
});

export default AeosFeedRow;

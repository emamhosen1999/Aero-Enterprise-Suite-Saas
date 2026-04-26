import React from 'react';

/**
 * AeosKpiRow — responsive grid wrapper for AeosKpi tiles.
 *
 *   <AeosKpiRow columns={4}>
 *     <AeosKpi … />
 *     <AeosKpi … />
 *   </AeosKpiRow>
 *
 * @see aeos365-design-system/project/preview/app-shell.html (.stats-row)
 */
const AeosKpiRow = ({ columns = 4, children, className = '', style, ...rest }) => (
  <div
    className={`aeos-kpi-row ${className}`.trim()}
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
      gap: 12,
      marginBottom: 24,
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

export default AeosKpiRow;

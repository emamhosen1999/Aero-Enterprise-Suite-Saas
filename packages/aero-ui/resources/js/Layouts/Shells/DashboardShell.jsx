import React from 'react';
import App from '@/Layouts/App';
import { AeosPageHeader, AeosKpiRow } from '@/Components/aeos';

/**
 * DashboardShell — sidebar shell + opinionated dashboard scaffold.
 *
 *   <DashboardShell
 *     title="Workforce overview"
 *     kicker="/ workforce"
 *     subtitle="Mercury Logistics · 12,847 employees"
 *     actions={...}
 *     kpis={[<AeosKpi … />, <AeosKpi … />, …]}
 *   >
 *     <AeosGrid>
 *       <AeosPanel title="Activity">…</AeosPanel>
 *       <AeosPanel title="Approvals">…</AeosPanel>
 *     </AeosGrid>
 *   </DashboardShell>
 *
 * @see aeos365-design-system/project/preview/app-shell.html
 */
const DashboardShell = ({
  title,
  subtitle,
  kicker,
  actions,
  kpis,
  children,
  className = '',
}) => (
  <App>
    <div className={className}>
      {(title || subtitle || kicker || actions) && (
        <AeosPageHeader title={title} subtitle={subtitle} kicker={kicker} actions={actions} />
      )}
      {kpis && kpis.length > 0 && (
        <AeosKpiRow>{kpis}</AeosKpiRow>
      )}
      {children}
    </div>
  </App>
);

export default DashboardShell;

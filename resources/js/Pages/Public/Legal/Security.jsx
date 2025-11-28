import React from 'react';
import { Card, CardBody, Chip, Listbox, ListboxItem } from '@heroui/react';
import { securityHighlights } from '../../../constants/marketing';
import PublicLayout from '../../../Layouts/PublicLayout';

const Security = () => (
  <PublicLayout>
    <div className="text-white">
    <section className="max-w-4xl mx-auto px-6 pt-28 pb-12 text-center">
      <Chip color="success" variant="flat" className="uppercase tracking-[0.35em] text-xs">Security</Chip>
      <h1 className="text-4xl font-bold mt-5 mb-4">Security & Compliance Overview</h1>
      <p className="text-slate-300">
        Aero is built for high-trust environments. Below is a summary of our controls—detailed documentation lives in the Trust Center.
      </p>
    </section>

    <section className="px-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-white/5 border border-white/10">
          <CardBody>
            <h2 className="text-2xl font-semibold mb-3">Certifications & audits</h2>
            <p className="text-slate-300">SOC 2 Type II · ISO 27001 · ISO 27701 · HIPAA BAA · GDPR ready. Pen tests conducted twice yearly by CREST partners.</p>
          </CardBody>
        </Card>
        <Card className="bg-white/5 border border-white/10">
          <CardBody>
            <h2 className="text-2xl font-semibold mb-3">Highlights</h2>
            <Listbox aria-label="Security highlights" variant="flat" className="text-left">
              {securityHighlights.map((highlight) => (
                <ListboxItem key={highlight} className="text-slate-300 bg-transparent">
                  {highlight}
                </ListboxItem>
              ))}
            </Listbox>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-blue-500/20 border border-white/20">
          <CardBody>
            <h3 className="text-xl font-semibold mb-2">Contact our security team</h3>
            <p className="text-slate-100">security@aero-suite.com · PGP fingerprint available in the Trust Center.</p>
          </CardBody>
        </Card>
      </div>
    </section>
    </div>
  </PublicLayout>
);

export default Security;

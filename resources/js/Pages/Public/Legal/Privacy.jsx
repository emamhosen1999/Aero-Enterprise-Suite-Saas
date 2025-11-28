import React from 'react';
import { Chip, Card, CardBody } from '@heroui/react';
import { privacySections } from '../../../constants/marketing';
import PublicLayout from '../../../Layouts/PublicLayout';

const Privacy = () => (
  <PublicLayout>
    <div className="text-white">
    <section className="max-w-4xl mx-auto px-6 pt-28 pb-12 text-center">
      <Chip color="primary" variant="flat" className="uppercase tracking-[0.35em] text-xs">Privacy</Chip>
      <h1 className="text-4xl font-bold mt-5 mb-4">Privacy Notice</h1>
      <p className="text-slate-300">
        Updated November 2025. This notice explains what data we collect, how we process it, and the rights you have over it.
      </p>
    </section>

    <section className="px-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {privacySections.map((section) => (
          <Card key={section.heading} className="bg-white/5 border border-white/10">
            <CardBody className="space-y-3 text-left">
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              <p className="text-slate-300">{section.body}</p>
            </CardBody>
          </Card>
        ))}
        <Card className="bg-gradient-to-r from-blue-600/30 via-purple-600/20 to-cyan-500/20 border border-white/20">
          <CardBody>
            <h3 className="text-xl font-semibold mb-2">Contact</h3>
            <p className="text-slate-100">privacy@aero-suite.com · DSR portal inside tenant admin.</p>
          </CardBody>
        </Card>
      </div>
    </section>
    </div>
  </PublicLayout>
);

export default Privacy;

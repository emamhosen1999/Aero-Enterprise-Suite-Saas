import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const controls = [
    'Policy-based access and approval routing by entity and region',
    'Traceable audit history across workflows and user actions',
    'Data residency alignment through tenant and domain boundaries',
    'Built-in segregation principles for sensitive processes',
];

export default function EnterpriseGovernance() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-90px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 60% 45% at 20% 55%, rgba(255,179,71,0.08) 0%, transparent 68%)',
                }}
            />

            <div className="relative z-10 mx-auto grid max-w-screen-2xl gap-8 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="space-y-5"
                >
                    <motion.p variants={fadeUp} custom={0} className="label-mono" style={{ color: 'var(--amber-aeos)' }}>
                        GOVERNANCE & COMPLIANCE
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="display-section"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                    >
                        Operate with confidence in regulated environments.
                    </motion.h2>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="text-base leading-relaxed md:text-lg"
                        style={{ color: isDark ? 'rgba(232,237,245,0.62)' : '#64748B' }}
                    >
                        Enterprise teams need more than features. They need control architecture that scales with risk,
                        regulatory change, and stakeholder accountability. aeos365 embeds governance patterns directly
                        into operational workflows.
                    </motion.p>
                </motion.div>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="rounded-2xl border p-7 md:p-8"
                    style={{
                        borderColor: isDark ? 'rgba(255,179,71,0.24)' : 'rgba(217,119,6,0.24)',
                        background: isDark
                            ? 'linear-gradient(145deg, rgba(255,179,71,0.06), rgba(255,255,255,0.01))'
                            : 'linear-gradient(145deg, rgba(255,251,235,0.95), rgba(255,255,255,0.92))',
                    }}
                >
                    <motion.ul variants={staggerContainer} className="space-y-4">
                        {controls.map((control, index) => (
                            <motion.li
                                key={control}
                                variants={fadeUp}
                                custom={index}
                                className="flex items-start gap-3"
                            >
                                <span
                                    className="mt-1.5 h-2.5 w-2.5 rounded-full"
                                    style={{ background: 'var(--amber-aeos)' }}
                                />
                                <span
                                    className="text-sm leading-relaxed md:text-base"
                                    style={{ color: isDark ? 'rgba(232,237,245,0.75)' : '#334155' }}
                                >
                                    {control}
                                </span>
                            </motion.li>
                        ))}
                    </motion.ul>
                </motion.div>
            </div>
        </section>
    );
}

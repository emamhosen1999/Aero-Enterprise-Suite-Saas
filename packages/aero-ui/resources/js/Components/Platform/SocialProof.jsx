import React from 'react';
import { Divider } from '@heroui/react';
import { StarIcon } from '@heroicons/react/24/solid';
import { useTheme } from '@/Context/ThemeContext.jsx';

/**
 * Social Proof Component
 * 
 * Displays trust signals like customer count, ratings, and uptime guarantee.
 * Used on pricing/plan selection pages to build trust during checkout.
 */

const defaultStats = [
  {
    id: 'customers',
    value: '2,500+',
    label: 'Companies trust us',
    color: 'primary',
  },
  {
    id: 'rating',
    value: '4.9',
    label: 'Average rating',
    showStars: true,
    color: 'warning',
  },
  {
    id: 'uptime',
    value: '99.9%',
    label: 'Uptime SLA',
    color: 'success',
  },
];

const defaultLogos = [
  { id: 1, name: 'Trusted by', src: null },
  // Add actual customer logo URLs here
];

const defaultTestimonials = [
  {
    id: 1,
    quote: "EOS365 transformed how we manage our operations. The all-in-one approach saved us from juggling multiple tools.",
    author: "Sarah Chen",
    role: "COO",
    company: "TechFlow Industries",
    avatar: null,
  },
  {
    id: 2,
    quote: "Implementation was smooth and the support team was exceptional. We were up and running in just 2 weeks.",
    author: "Michael Rodriguez",
    role: "IT Director",
    company: "Global Manufacturing Co.",
    avatar: null,
  },
];

export default function SocialProof({
  stats = defaultStats,
  testimonials = defaultTestimonials,
  showLogos = false,
  logos = defaultLogos,
  variant = 'compact', // 'compact' | 'full' | 'minimal'
  className = '',
}) {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = {
    surface: isDarkMode
      ? 'bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 border border-white/10'
      : 'bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border border-slate-200',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    muted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    card: isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm',
  };

  // Minimal variant - just stats bar
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center gap-6 py-3 ${palette.muted} ${className}`}>
        {stats.map((stat, index) => (
          <React.Fragment key={stat.id}>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${palette.text}`}>{stat.value}</span>
              <span className="text-sm">{stat.label}</span>
            </div>
            {index < stats.length - 1 && (
              <Divider orientation="vertical" className="h-4" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Compact variant - stats in a nice banner
  if (variant === 'compact') {
    return (
      <div className={`rounded-xl p-4 sm:p-6 ${palette.surface} ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 flex-wrap">
          {stats.map((stat, index) => (
            <React.Fragment key={stat.id}>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {stat.showStars ? (
                    <>
                      <span className={`text-2xl sm:text-3xl font-bold text-${stat.color}`}>
                        {stat.value}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-warning"
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className={`text-2xl sm:text-3xl font-bold text-${stat.color}`}>
                      {stat.value}
                    </span>
                  )}
                </div>
                <p className={`text-xs sm:text-sm ${palette.muted}`}>
                  {stat.label}
                </p>
              </div>
              {index < stats.length - 1 && (
                <Divider
                  orientation="vertical"
                  className="hidden sm:block h-12"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // Full variant - stats + testimonials
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Stats Banner */}
      <div className={`rounded-xl p-6 ${palette.surface}`}>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {stats.map((stat, index) => (
            <React.Fragment key={stat.id}>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {stat.showStars ? (
                    <>
                      <span className={`text-3xl font-bold text-${stat.color}`}>
                        {stat.value}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon key={star} className="w-5 h-5 text-warning" />
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className={`text-3xl font-bold text-${stat.color}`}>
                      {stat.value}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${palette.muted}`}>{stat.label}</p>
              </div>
              {index < stats.length - 1 && (
                <Divider orientation="vertical" className="hidden sm:block h-12" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`rounded-xl p-5 ${palette.card}`}
            >
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} className="w-4 h-4 text-warning" />
                ))}
              </div>
              <blockquote className={`text-sm mb-4 ${palette.text}`}>
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                {testimonial.avatar ? (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                    {testimonial.author.charAt(0)}
                  </div>
                )}
                <div>
                  <p className={`font-medium text-sm ${palette.text}`}>
                    {testimonial.author}
                  </p>
                  <p className={`text-xs ${palette.muted}`}>
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Logos */}
      {showLogos && logos.length > 0 && (
        <div className="text-center">
          <p className={`text-sm mb-4 ${palette.muted}`}>
            Trusted by leading companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {logos.map((logo) => (
              <div key={logo.id}>
                {logo.src ? (
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-8 grayscale hover:grayscale-0 transition-all"
                  />
                ) : (
                  <div className={`text-lg font-semibold ${palette.muted}`}>
                    {logo.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

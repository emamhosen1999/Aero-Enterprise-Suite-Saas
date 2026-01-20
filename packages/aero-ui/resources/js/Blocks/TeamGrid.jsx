import React from 'react';
import { Card, CardBody, Avatar, Link } from '@heroui/react';
import { motion } from 'framer-motion';

const TeamGrid = ({ content = {}, settings = {} }) => {
  const {
    title = 'Meet Our Team',
    subtitle = '',
    members = [],
    columns = 4,
    showSocial = true,
  } = content;

  const {
    bgColor = '#ffffff',
    textColor = '#000000',
    padding = 'lg',
    textAlign = 'center',
  } = settings;

  const paddingMap = {
    none: 'p-0',
    sm: 'p-4 md:p-6',
    md: 'p-6 md:p-8 lg:p-12',
    lg: 'p-8 md:p-12 lg:p-16',
    xl: 'p-12 md:p-16 lg:p-20',
  };

  const colMap = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'lg:grid-cols-4',
  };

  const SocialIcon = ({ type }) => {
    const icons = {
      linkedin: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      twitter: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      github: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
    };
    return icons[type] || null;
  };

  return (
    <div
      className={`w-full ${paddingMap[padding]}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="container mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className={`mb-12 ${textAlign === 'center' ? 'text-center' : ''}`}>
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold mb-3">{title}</h2>
            )}
            {subtitle && (
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Team Grid */}
        {members && members.length > 0 ? (
          <div className={`grid grid-cols-2 ${colMap[columns] || 'lg:grid-cols-4'} gap-6 md:gap-8`}>
            {members.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 text-center group hover:shadow-lg transition-all">
                  <CardBody className="gap-4 p-6">
                    {/* Avatar */}
                    <div className="relative mx-auto">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover mx-auto border-4 border-white dark:border-slate-800 shadow-lg"
                        />
                      ) : (
                        <Avatar
                          name={member.name}
                          className="w-24 h-24 md:w-32 md:h-32 text-2xl"
                        />
                      )}
                    </div>

                    {/* Name */}
                    {member.name && (
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {member.name}
                      </h3>
                    )}

                    {/* Role */}
                    {member.role && (
                      <p className="text-primary font-medium text-sm">
                        {member.role}
                      </p>
                    )}

                    {/* Bio */}
                    {member.bio && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                        {member.bio}
                      </p>
                    )}

                    {/* Social Links */}
                    {showSocial && member.social && (
                      <div className="flex justify-center gap-3 pt-2">
                        {member.social.linkedin && (
                          <Link
                            href={member.social.linkedin}
                            isExternal
                            className="text-slate-500 hover:text-primary transition-colors"
                          >
                            <SocialIcon type="linkedin" />
                          </Link>
                        )}
                        {member.social.twitter && (
                          <Link
                            href={member.social.twitter}
                            isExternal
                            className="text-slate-500 hover:text-primary transition-colors"
                          >
                            <SocialIcon type="twitter" />
                          </Link>
                        )}
                        {member.social.github && (
                          <Link
                            href={member.social.github}
                            isExternal
                            className="text-slate-500 hover:text-primary transition-colors"
                          >
                            <SocialIcon type="github" />
                          </Link>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No team members added
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamGrid;

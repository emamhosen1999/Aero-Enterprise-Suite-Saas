import React from 'react';
import { Card, CardBody, Avatar, Tooltip } from '@heroui/react';

const TeamMembersBlock = ({ data = {} }) => {
    const members = data.members || [];
    const columns = data.columns || 4;

    const gridColsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    }[Math.min(columns, 4)];

    const renderSocialLink = (url, platform) => {
        if (!url) return null;

        const platformLinks = {
            twitter: { icon: '𝕏', color: 'text-[#1DA1F2]' },
            linkedin: { icon: 'in', color: 'text-[#0A66C2]' },
            github: { icon: '⚡', color: 'text-gray-700' },
        };

        const config = platformLinks[platform];
        if (!config) return null;

        return (
            <Tooltip content={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg hover:bg-default-100 transition ${config.color}`}
                >
                    <span className="font-bold">{config.icon}</span>
                </a>
            </Tooltip>
        );
    };

    if (!members || members.length === 0) {
        return (
            <div className="text-center text-default-500 py-8">
                <p>No team members to display</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {data.title && (
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-foreground">
                        {data.title}
                    </h2>
                    {data.description && (
                        <p className="text-default-600 mt-3 max-w-2xl mx-auto">
                            {data.description}
                        </p>
                    )}
                </div>
            )}

            <div className={`grid ${gridColsClass} gap-6`}>
                {members.map((member, index) => (
                    <div key={index}>
                        <Card
                            className="h-full transition-all duration-200 hover:shadow-lg group"
                            style={{
                                background: `var(--theme-content1, #FAFAFA)`,
                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                borderWidth: `var(--borderWidth, 2px)`,
                                borderRadius: `var(--borderRadius, 12px)`,
                            }}
                        >
                            <CardBody className="p-0 overflow-hidden flex flex-col">
                                {member.image && (
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}

                                <div className="p-5 grow flex flex-col">
                                    <div className="mb-3">
                                        <h3 className="text-lg font-bold text-foreground">
                                            {member.name}
                                        </h3>
                                        {member.role && (
                                            <p className="text-sm text-primary font-medium">
                                                {member.role}
                                            </p>
                                        )}
                                    </div>

                                    {member.bio && (
                                        <p className="text-sm text-default-600 line-clamp-2 mb-4 grow">
                                            {member.bio}
                                        </p>
                                    )}

                                    {member.social_links && (
                                        <div className="flex gap-2 items-center">
                                            {renderSocialLink(
                                                member.social_links.twitter,
                                                'twitter'
                                            )}
                                            {renderSocialLink(
                                                member.social_links.linkedin,
                                                'linkedin'
                                            )}
                                            {renderSocialLink(
                                                member.social_links.github,
                                                'github'
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamMembersBlock;

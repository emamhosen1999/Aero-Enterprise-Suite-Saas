import React, { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Divider,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Progress,
    Select,
    SelectItem,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tabs,
    Textarea,
} from '@heroui/react';
import {
    BriefcaseIcon,
    CheckCircleIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    SparklesIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { showToast } from '@/utils/ui/toastUtils';
import axios from 'axios';

const statusColorMap = {
    open: 'success',
    closed: 'default',
    filled: 'primary',
};

const recommendationTypeColorMap = {
    promotion: 'success',
    lateral_move: 'primary',
    leadership_track: 'secondary',
    mentorship: 'warning',
    retention: 'danger',
};

const recommendationTypeLabelMap = {
    promotion: 'Promotion',
    lateral_move: 'Lateral Move',
    leadership_track: 'Leadership Track',
    mentorship: 'Mentorship',
    retention: 'Retention',
};

const normalizeRecommendationType = (type) => recommendationTypeLabelMap[type] || 'Opportunity';

const TalentMarketplaceIndex = ({ title, opportunities = [], myRecommendations = [], stats = {}, error }) => {
    const themeRadius = useThemeRadius();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [search, setSearch] = useState('');
    const [applyModal, setApplyModal] = useState(false);
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [coverNote, setCoverNote] = useState('');
    const [activeTab, setActiveTab] = useState('browse');
    const [recommendationTypeFilter, setRecommendationTypeFilter] = useState('all');
    const [minimumMatch, setMinimumMatch] = useState('0');

    const recommendationInsights = useMemo(() => {
        const totalRecommendations = myRecommendations.length;

        if (totalRecommendations === 0) {
            return {
                averageMatch: 0,
                promotionCount: 0,
                upskillNeededCount: 0,
                topSkillGaps: [],
            };
        }

        const averageMatch = Math.round(
            myRecommendations.reduce((sum, recommendation) => sum + Number(recommendation.match_score || 0), 0) /
                totalRecommendations
        );

        const promotionCount = myRecommendations.filter((recommendation) => recommendation.type === 'promotion').length;

        const upskillNeededCount = myRecommendations.filter(
            (recommendation) => (recommendation.skill_gaps || []).length > 0
        ).length;

        const topSkillGaps = Object.entries(
            myRecommendations.reduce((accumulator, recommendation) => {
                (recommendation.skill_gaps || []).forEach((skillGap) => {
                    const key = String(skillGap).trim();
                    if (key.length === 0) {
                        return;
                    }
                    accumulator[key] = (accumulator[key] || 0) + 1;
                });
                return accumulator;
            }, {})
        )
            .sort((left, right) => right[1] - left[1])
            .slice(0, 8)
            .map(([skill, count]) => ({ skill, count }));

        return {
            averageMatch,
            promotionCount,
            upskillNeededCount,
            topSkillGaps,
        };
    }, [myRecommendations]);

    const statsData = useMemo(
        () => [
            {
                title: 'Open Positions',
                value: stats.open_positions ?? 0,
                icon: <BriefcaseIcon className="w-6 h-6" />,
                color: 'text-primary',
                iconBg: 'bg-primary/20',
            },
            {
                title: 'Total Applicants',
                value: stats.total_applicants ?? 0,
                icon: <UserGroupIcon className="w-6 h-6" />,
                color: 'text-secondary',
                iconBg: 'bg-secondary/20',
            },
            {
                title: 'Successful Placements',
                value: stats.successful_placements ?? 0,
                icon: <CheckCircleIcon className="w-6 h-6" />,
                color: 'text-success',
                iconBg: 'bg-success/20',
            },
            {
                title: 'Avg AI Match',
                value: `${recommendationInsights.averageMatch}%`,
                icon: <SparklesIcon className="w-6 h-6" />,
                color: 'text-warning',
                iconBg: 'bg-warning/20',
            },
        ],
        [stats, recommendationInsights.averageMatch]
    );

    const filteredOpportunities = useMemo(() => {
        return opportunities.filter((opportunity) => {
            if (!search) {
                return true;
            }

            const searchTerm = search.toLowerCase();
            return (
                opportunity.title?.toLowerCase().includes(searchTerm) ||
                opportunity.department?.name?.toLowerCase().includes(searchTerm)
            );
        });
    }, [opportunities, search]);

    const filteredRecommendations = useMemo(() => {
        const minimumMatchScore = Number(minimumMatch || 0);

        return myRecommendations.filter((recommendation) => {
            const role = recommendation.target_role_name || '';
            const rationale = recommendation.rationale || '';
            const recommendationType = recommendation.type || '';
            const matchScore = Number(recommendation.match_score || 0);

            const matchesSearch =
                search.length === 0 ||
                role.toLowerCase().includes(search.toLowerCase()) ||
                rationale.toLowerCase().includes(search.toLowerCase());

            const matchesType = recommendationTypeFilter === 'all' || recommendationType === recommendationTypeFilter;
            const matchesScore = matchScore >= minimumMatchScore;

            return matchesSearch && matchesType && matchesScore;
        });
    }, [myRecommendations, recommendationTypeFilter, minimumMatch, search]);

    const openApply = (opportunity) => {
        setSelectedOpportunity(opportunity);
        setCoverNote('');
        setApplyModal(true);
    };

    const handleApply = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.talent-marketplace.apply', selectedOpportunity.id), {
                    cover_note: coverNote,
                });
                if (response.status === 200 || response.status === 201) {
                    setApplyModal(false);
                    resolve([response.data.message || 'Applied successfully']);
                }
            } catch (requestError) {
                reject(requestError.response?.data?.errors || ['Failed to apply']);
            }
        });

        showToast.promise(promise, {
            loading: 'Submitting application...',
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : data),
        });
    };

    const columns = [
        { uid: 'title', name: 'Opportunity' },
        { uid: 'department', name: 'Department' },
        { uid: 'type', name: 'Type' },
        { uid: 'skills', name: 'Required Skills' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (opportunity, columnKey) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{opportunity.title}</span>
                        <span className="text-xs text-default-400">{opportunity.description?.substring(0, 85)}...</span>
                    </div>
                );
            case 'department':
                return <span className="text-sm">{opportunity.department?.name || '—'}</span>;
            case 'type':
                return (
                    <Chip size="sm" variant="flat" color="primary" className="capitalize">
                        {opportunity.type || 'role'}
                    </Chip>
                );
            case 'skills':
                return (
                    <div className="flex gap-1 flex-wrap max-w-xs">
                        {(opportunity.required_skills || []).slice(0, 3).map((skill, index) => (
                            <Chip key={index} size="sm" variant="dot" color="secondary">
                                {skill}
                            </Chip>
                        ))}
                        {(opportunity.required_skills || []).length > 3 && (
                            <Chip size="sm" variant="flat">
                                +{opportunity.required_skills.length - 3}
                            </Chip>
                        )}
                    </div>
                );
            case 'status':
                return (
                    <Chip size="sm" color={statusColorMap[opportunity.status] || 'default'} variant="flat" className="capitalize">
                        {opportunity.status}
                    </Chip>
                );
            case 'actions':
                return opportunity.status === 'open' ? (
                    <Button size="sm" color="primary" variant="shadow" onPress={() => openApply(opportunity)}>
                        Apply
                    </Button>
                ) : null;
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title} />

            <Modal
                isOpen={applyModal}
                onOpenChange={setApplyModal}
                size="lg"
                scrollBehavior="inside"
                classNames={{
                    base: 'bg-content1',
                    header: 'border-b border-divider',
                    body: 'py-6',
                    footer: 'border-t border-divider',
                }}
            >
                <ModalContent>
                    <ModalHeader>
                        <div>
                            <h2 className="text-lg font-semibold">Apply — {selectedOpportunity?.title}</h2>
                            <p className="text-sm text-default-400">{selectedOpportunity?.department?.name}</p>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            {selectedOpportunity?.description && (
                                <div className="p-3 rounded-lg bg-default-50 border border-divider text-sm">
                                    {selectedOpportunity.description}
                                </div>
                            )}
                            {(selectedOpportunity?.required_skills || []).length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Required Skills</p>
                                    <div className="flex gap-1 flex-wrap">
                                        {selectedOpportunity.required_skills.map((skill, index) => (
                                            <Chip key={index} size="sm" color="secondary" variant="flat">
                                                {skill}
                                            </Chip>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <Textarea
                                label="Cover Note"
                                placeholder="Why are you a good fit for this opportunity?"
                                value={coverNote}
                                onValueChange={setCoverNote}
                                radius={themeRadius}
                                minRows={3}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setApplyModal(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleApply}>
                            Submit Application
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Talent Marketplace">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                            <Card
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader className="border-b p-0" style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}>
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <BriefcaseIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Internal Talent Marketplace</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Discover opportunities, map your readiness, and close skill gaps faster.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {error && (
                                        <div className="mb-5 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                                        <Input
                                            label="Search"
                                            placeholder="Search opportunities or AI recommendations..."
                                            value={search}
                                            onValueChange={setSearch}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        <Select
                                            label="Recommendation Type"
                                            selectedKeys={recommendationTypeFilter === 'all' ? [] : [recommendationTypeFilter]}
                                            onSelectionChange={(keys) => setRecommendationTypeFilter(Array.from(keys)[0] || 'all')}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            className="max-w-xs"
                                            startContent={<FunnelIcon className="w-4 h-4 text-default-400" />}
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            <SelectItem key="promotion">Promotion</SelectItem>
                                            <SelectItem key="lateral_move">Lateral Move</SelectItem>
                                            <SelectItem key="leadership_track">Leadership Track</SelectItem>
                                            <SelectItem key="mentorship">Mentorship</SelectItem>
                                            <SelectItem key="retention">Retention</SelectItem>
                                        </Select>
                                        <Select
                                            label="Minimum Match"
                                            selectedKeys={[minimumMatch]}
                                            onSelectionChange={(keys) => setMinimumMatch(Array.from(keys)[0] || '0')}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            className="max-w-xs"
                                        >
                                            <SelectItem key="0">0%+</SelectItem>
                                            <SelectItem key="50">50%+</SelectItem>
                                            <SelectItem key="60">60%+</SelectItem>
                                            <SelectItem key="70">70%+</SelectItem>
                                            <SelectItem key="80">80%+</SelectItem>
                                            <SelectItem key="90">90%+</SelectItem>
                                        </Select>
                                    </div>

                                    <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(String(key))} aria-label="Talent Marketplace tabs">
                                        <Tab key="browse" title="Browse Opportunities">
                                            <div className="pt-4">
                                                <Table
                                                    aria-label="Open opportunities"
                                                    isHeaderSticky
                                                    classNames={{
                                                        wrapper: 'shadow-none border border-divider rounded-lg',
                                                        th: 'bg-default-100 text-default-600 font-semibold',
                                                        td: 'py-3',
                                                    }}
                                                >
                                                    <TableHeader columns={columns}>
                                                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                                    </TableHeader>
                                                    <TableBody
                                                        items={filteredOpportunities}
                                                        emptyContent={
                                                            <div className="py-12 text-center text-default-400">
                                                                <BriefcaseIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                                <p>No matching opportunities right now</p>
                                                                <p className="text-xs mt-1">Try a wider search or check recommendations</p>
                                                            </div>
                                                        }
                                                    >
                                                        {(item) => (
                                                            <TableRow key={item.id}>
                                                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </Tab>

                                        <Tab key="recommendations" title="AI Recommendations">
                                            <div className="pt-4 space-y-4">
                                                {filteredRecommendations.length > 0 ? (
                                                    filteredRecommendations.map((recommendation, index) => (
                                                        <Card key={index} className="border border-divider" shadow="none">
                                                            <CardBody className="space-y-4">
                                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-base font-semibold">{recommendation.target_role_name || 'Recommended Opportunity'}</p>
                                                                        <Chip
                                                                            size="sm"
                                                                            variant="flat"
                                                                            color={recommendationTypeColorMap[recommendation.type] || 'default'}
                                                                        >
                                                                            {normalizeRecommendationType(recommendation.type)}
                                                                        </Chip>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Chip size="sm" color="warning" variant="flat">
                                                                            {Number(recommendation.match_score || 0)}% match
                                                                        </Chip>
                                                                        <Chip size="sm" color="primary" variant="flat">
                                                                            Ready in {Number(recommendation.estimated_readiness_months || 0)} mo
                                                                        </Chip>
                                                                    </div>
                                                                </div>

                                                                <Progress
                                                                    aria-label="Recommendation match"
                                                                    size="sm"
                                                                    color={Number(recommendation.match_score || 0) >= 80 ? 'success' : 'warning'}
                                                                    value={Number(recommendation.match_score || 0)}
                                                                />

                                                                <p className="text-sm text-default-500">{recommendation.rationale || 'No rationale provided.'}</p>

                                                                <Divider />

                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-xs font-semibold uppercase text-default-500 mb-2">Matching Skills</p>
                                                                        <div className="flex gap-1 flex-wrap">
                                                                            {(recommendation.matching_skills || []).length > 0 ? (
                                                                                recommendation.matching_skills.map((skill, skillIndex) => (
                                                                                    <Chip key={skillIndex} size="sm" color="success" variant="dot">
                                                                                        {skill}
                                                                                    </Chip>
                                                                                ))
                                                                            ) : (
                                                                                <span className="text-xs text-default-400">No matching skills data</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-semibold uppercase text-default-500 mb-2">Skill Gaps To Close</p>
                                                                        <div className="flex gap-1 flex-wrap">
                                                                            {(recommendation.skill_gaps || []).length > 0 ? (
                                                                                recommendation.skill_gaps.map((skillGap, gapIndex) => (
                                                                                    <Chip key={gapIndex} size="sm" color="danger" variant="dot">
                                                                                        {skillGap}
                                                                                    </Chip>
                                                                                ))
                                                                            ) : (
                                                                                <Chip size="sm" color="success" variant="flat">
                                                                                    No critical gaps
                                                                                </Chip>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardBody>
                                                        </Card>
                                                    ))
                                                ) : (
                                                    <div className="py-12 text-center text-default-400 border border-dashed border-divider rounded-xl">
                                                        <SparklesIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                        <p>No recommendations match your current filters</p>
                                                        <p className="text-xs mt-1">Reset filters or lower minimum match threshold</p>
                                                    </div>
                                                )}
                                            </div>
                                        </Tab>

                                        <Tab key="skill-gaps" title="Skill Gap Radar">
                                            <div className="pt-4 space-y-4">
                                                <Card className="border border-divider" shadow="none">
                                                    <CardBody>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <WrenchScrewdriverIcon className="w-5 h-5 text-danger" />
                                                            <h5 className="font-semibold">Top Skill Gaps Across Recommendations</h5>
                                                        </div>
                                                        {recommendationInsights.topSkillGaps.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {recommendationInsights.topSkillGaps.map((skillGap, index) => {
                                                                    const percentage = Math.min(
                                                                        100,
                                                                        Math.round((skillGap.count / Math.max(filteredRecommendations.length || 1, 1)) * 100)
                                                                    );

                                                                    return (
                                                                        <div key={index} className="space-y-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-sm font-medium">{skillGap.skill}</span>
                                                                                <span className="text-xs text-default-500">{skillGap.count} recommendation(s)</span>
                                                                            </div>
                                                                            <Progress size="sm" color="danger" value={percentage} aria-label={`Gap frequency ${skillGap.skill}`} />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-default-500">No skill-gap data available yet.</p>
                                                        )}
                                                    </CardBody>
                                                </Card>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Card className="border border-divider" shadow="none">
                                                        <CardBody>
                                                            <p className="text-sm text-default-500 mb-1">Promotion-Ready Recommendations</p>
                                                            <p className="text-2xl font-bold">{recommendationInsights.promotionCount}</p>
                                                        </CardBody>
                                                    </Card>
                                                    <Card className="border border-divider" shadow="none">
                                                        <CardBody>
                                                            <p className="text-sm text-default-500 mb-1">Recommendations Needing Upskilling</p>
                                                            <p className="text-2xl font-bold">{recommendationInsights.upskillNeededCount}</p>
                                                        </CardBody>
                                                    </Card>
                                                </div>
                                            </div>
                                        </Tab>
                                    </Tabs>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

TalentMarketplaceIndex.layout = (page) => <App children={page} />;
export default TalentMarketplaceIndex;

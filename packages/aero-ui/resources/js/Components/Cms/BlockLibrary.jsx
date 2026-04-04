import React, { useMemo } from 'react';
import { Card, CardBody, Button, Grid } from "@heroui/react";
import { SparklesIcon, DocumentTextIcon, ArrowUpRightIcon, PhotoIcon, StarIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

const iconMap = {
    Hero: SparklesIcon,
    'Rich Text': DocumentTextIcon,
    CTA: ArrowUpRightIcon,
    'Image Gallery': PhotoIcon,
    Testimonials: StarIcon,
    FAQ: QuestionMarkCircleIcon,
};

const BlockLibrary = ({ blockTypes = [], onSelectType }) => {
    const blocksWithIcons = useMemo(() => {
        return blockTypes.map(type => ({
            ...type,
            Icon: iconMap[type.label] || PhotoIcon
        }));
    }, [blockTypes]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
            {blocksWithIcons.map(blockType => {
                const Icon = blockType.Icon;
                return (
                    <Card
                        key={blockType.id}
                        className="border border-divider hover:border-primary cursor-pointer transition-all"
                        isPressable
                        onPress={() => onSelectType(blockType)}
                    >
                        <CardBody className="p-4 gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/20">
                                    <Icon className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">{blockType.label}</p>
                                    <p className="text-xs text-default-500 line-clamp-2">{blockType.description}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                );
            })}
        </div>
    );
};

export default BlockLibrary;

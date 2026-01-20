import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CardBody, CardHeader, Button } from '@heroui/react';
import {
  EllipsisVerticalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const DraggableBlock = ({ block, isSelected, onSelect, onMove, onDuplicate, onDelete }) => {
  const ref = useRef(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'block',
    item: { id: block.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'block',
    hover: (item) => {
      if (item.id !== block.id) {
        // Handle reordering
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`mb-3 transition-all ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card
        isPressable
        onPress={() => onSelect(block.id)}
        className={`border-2 transition-all ${
          isSelected 
            ? 'border-primary bg-primary/5 dark:bg-primary/10' 
            : 'border-slate-200 dark:border-white/10 hover:border-primary/30'
        } ${isOver ? 'ring-2 ring-primary' : ''}`}
      >
        <CardHeader className="flex flex-col items-start px-4 py-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 flex-1">
              <div className="cursor-move px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs">
                ⋮⋮
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {block.block_type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())}
              </span>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                onPress={() => onMove(block.id, 'up')}
              >
                <ArrowUpIcon className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                onPress={() => onMove(block.id, 'down')}
              >
                <ArrowDownIcon className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                onPress={() => onDuplicate(block.id)}
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-danger hover:text-danger/80"
                onPress={() => onDelete(block.id)}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Block Preview */}
          {block.content?.title && (
            <p className="text-xs text-slate-500 mt-2 truncate">
              {block.content.title}
            </p>
          )}
        </CardHeader>

        {/* Block Preview Content */}
        <CardBody className="px-4 py-2">
          <BlockPreview block={block} />
        </CardBody>
      </Card>
    </div>
  );
};

const BlockPreview = ({ block }) => {
  const previewMap = {
    hero_standard: () => (
      <div className="text-xs text-slate-500">
        <p className="font-medium">{block.content?.title || 'Untitled'}</p>
        <p className="truncate">{block.content?.subtitle || 'No subtitle'}</p>
      </div>
    ),
    feature_grid: () => (
      <div className="text-xs text-slate-500">
        <p className="font-medium">{block.content?.title || 'Features'}</p>
        <p>{block.content?.items?.length || 0} features</p>
      </div>
    ),
    pricing_cards: () => (
      <div className="text-xs text-slate-500">
        <p className="font-medium">{block.content?.title || 'Pricing'}</p>
        <p>{block.content?.plans?.length || 0} plans</p>
      </div>
    ),
    testimonials: () => (
      <div className="text-xs text-slate-500">
        <p className="font-medium">{block.content?.title || 'Testimonials'}</p>
        <p>{block.content?.testimonials?.length || 0} testimonials</p>
      </div>
    ),
    text_block: () => (
      <div className="text-xs text-slate-500">
        <p className="line-clamp-2">{block.content?.text || 'Empty text block'}</p>
      </div>
    ),
    cta_section: () => (
      <div className="text-xs text-slate-500">
        <p className="font-medium">{block.content?.title || 'Call to Action'}</p>
        <p>{block.content?.button_text || 'No button text'}</p>
      </div>
    ),
  };

  const preview = previewMap[block.block_type];
  return preview ? preview() : (
    <div className="text-xs text-slate-400">Block preview unavailable</div>
  );
};

const BlockEditor = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
  onDuplicateBlock,
}) => {
  return (
    <div className="space-y-3">
      {blocks.map((block) => (
        <DraggableBlock
          key={block.id}
          block={block}
          isSelected={selectedBlockId === block.id}
          onSelect={onSelectBlock}
          onMove={onMoveBlock}
          onDuplicate={onDuplicateBlock}
          onDelete={onDeleteBlock}
        />
      ))}
    </div>
  );
};

export default BlockEditor;

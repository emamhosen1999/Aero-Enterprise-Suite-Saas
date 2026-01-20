import React, { useMemo, useState } from 'react';
import { Input, Button, ScrollShadow, Chip } from '@heroui/react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

const BlockPalette = ({ categories, blockTypes, onAddBlock }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        blocks: blockTypes.filter((block) => 
          block.category === category.id &&
          (block.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
           block.description.toLowerCase().includes(searchTerm.toLowerCase()))
        ),
      }))
      .filter((category) => category.blocks.length > 0);
  }, [categories, blockTypes, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10">
        <h2 className="font-semibold text-sm mb-3">Blocks</h2>
        <Input
          placeholder="Search blocks..."
          size="sm"
          value={searchTerm}
          onValueChange={setSearchTerm}
          startContent={<MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />}
          className="text-xs"
          classNames={{
            inputWrapper: 'bg-white dark:bg-slate-950',
            input: 'text-xs',
          }}
        />
      </div>

      {/* Block List */}
      <ScrollShadow className="flex-1 overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs">
            No blocks found
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="border-t border-slate-200 dark:border-white/10">
              <div className="px-4 py-3 bg-slate-100 dark:bg-slate-950 sticky top-0 z-10">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {category.label}
                </p>
              </div>
              
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {category.blocks.map((block) => (
                  <button
                    key={block.type}
                    onClick={() => onAddBlock(block.type)}
                    className="w-full px-4 py-3 text-left hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white group-hover:text-primary">
                          {block.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {block.description}
                        </p>
                      </div>
                      <PlusIcon className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-primary flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </ScrollShadow>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400">
        <p>💡 Drag blocks to reorder them</p>
      </div>
    </div>
  );
};

export default BlockPalette;

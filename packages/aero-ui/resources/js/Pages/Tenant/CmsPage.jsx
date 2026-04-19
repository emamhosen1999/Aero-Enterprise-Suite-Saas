import React, { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import BlockRenderer from '@/Blocks/BlockRenderer';
import PublicLayout from '@/Layouts/PublicLayout';
import { motion } from 'framer-motion';

const CmsPage = ({ page, blocks = [] }) => {
  // Sort blocks by order_index
  const sortedBlocks = useMemo(
    () => blocks.sort((a, b) => a.order_index - b.order_index),
    [blocks]
  );

  // Prepare head metadata
  const headData = {
    title: page.meta_title || page.title,
    description: page.meta_description,
  };

  return (
    <>
      <Head title={headData.title} description={headData.description} />

      <div className="min-h-screen bg-background">
        {/* Render all blocks in order */}
        {sortedBlocks.length === 0 ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {page.title}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                This page is empty. Please add some blocks.
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {sortedBlocks.map((block, index) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <BlockRenderer block={block} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
};

// Use public layout wrapper
CmsPage.layout = (page) => <PublicLayout children={page} />;

export default CmsPage;

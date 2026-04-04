import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader } from "@heroui/react";

/**
 * CMS Public Page Component
 * 
 * Renders CMS-managed pages on the platform domain with block-based content.
 * Fallback route handles all unmapped URLs and displays published CMS pages.
 */
export default function CmsPage({ page, title }) {
    if (!page) {
        return (
            <>
                <Head title="Page Not Found" />
                <div className="w-full h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-800">404</h1>
                        <p className="text-gray-600 mt-2">Page not found</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={title || page.title} />
            
            <div className="w-full min-h-screen bg-gray-50">
                {/* Hero/Header Section */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl font-bold mb-2">{page.title}</h1>
                        {page.meta_description && (
                            <p className="text-blue-100 text-lg">{page.meta_description}</p>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-4xl mx-auto py-12 px-4">
                    {/* Render Blocks if they exist */}
                    {page.blocks && page.blocks.length > 0 ? (
                        <div className="space-y-6">
                            {page.blocks.map((block, index) => (
                                <Card key={index} className="border border-gray-200">
                                    <CardBody className="p-6">
                                        {/* Rich text block */}
                                        {block.type === 'text' && (
                                            <div dangerouslySetInnerHTML={{ __html: block.data?.content || '' }} />
                                        )}
                                        
                                        {/* Hero block */}
                                        {block.type === 'hero' && (
                                            <div className="py-8">
                                                <h2 className="text-3xl font-bold mb-4">{block.data?.title}</h2>
                                                <p className="text-gray-600 text-lg">{block.data?.subtitle}</p>
                                            </div>
                                        )}
                                        
                                        {/* CTA/Button block */}
                                        {block.type === 'cta' && (
                                            <div className="flex gap-4">
                                                <a href={block.data?.url} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                                    {block.data?.label}
                                                </a>
                                            </div>
                                        )}
                                        
                                        {/* Image block */}
                                        {block.type === 'image' && block.data?.src && (
                                            <img src={block.data.src} alt={block.data?.alt || 'CMS Image'} className="w-full rounded-lg" />
                                        )}
                                        
                                        {/* Generic fallback for unknown block types */}
                                        {!['text', 'hero', 'cta', 'image'].includes(block.type) && (
                                            <div className="text-gray-500 italic">
                                                Block type '{block.type}' not supported
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border border-gray-200">
                            <CardBody className="p-12 text-center">
                                <p className="text-gray-600 text-lg">No content blocks added yet.</p>
                                <p className="text-gray-500 mt-2">Visit the CMS admin to add content to this page.</p>
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Metadata (for reference in dev) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="max-w-4xl mx-auto px-4 py-4 text-xs text-gray-400">
                        <details>
                            <summary>Page Metadata</summary>
                            <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
                                {JSON.stringify({
                                    id: page.id,
                                    slug: page.slug,
                                    status: page.status,
                                    blocks: page.blocks?.length || 0,
                                }, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </>
    );
}

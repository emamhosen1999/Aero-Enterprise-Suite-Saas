import React, { useMemo, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import { showToast } from '@/utils/toastUtils';

const Create = ({ title, layouts, parentPages }) => {
  const { data, setData, post, processing, errors } = useForm({
    title: '',
    slug: '',
    meta_title: '',
    meta_description: '',
    layout: 'public',
    parent_id: '',
    show_in_nav: true,
    nav_label: '',
  });

  const [autoSlug, setAutoSlug] = useState(true);

  const handleTitleChange = (value) => {
    setData('title', value);
    if (autoSlug && value) {
      setData('slug', value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const promise = new Promise((resolve, reject) => {
      post(route('admin.cms.pages.store'), {
        onSuccess: () => resolve(),
        onError: () => reject(),
      });
    });

    showToast.promise(promise, {
      loading: 'Creating page...',
      success: 'Page created successfully',
      error: 'Failed to create page',
    });
  };

  return (
    <>
      <Head title={title} />

      <div className="flex flex-col w-full p-4">
        <div className="mb-6 flex items-center gap-2">
          <Button
            isIconOnly
            variant="light"
            onPress={() => window.history.back()}
            startContent={<ArrowLeftIcon className="w-5 h-5" />}
          />
          <h1 className="text-2xl font-bold">Create New Page</h1>
        </div>

        <Card className="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10">
          <CardHeader className="border-b border-slate-200 dark:border-white/10 p-6">
            <h2 className="font-semibold text-lg">Page Details</h2>
          </CardHeader>

          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <Input
                label="Page Title"
                placeholder="e.g., Pricing, About Us, Features"
                value={data.title}
                onValueChange={handleTitleChange}
                isInvalid={!!errors.title}
                errorMessage={errors.title}
                isRequired
                description="The page title shown in browser and navigation"
              />

              {/* Slug */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Page Slug</label>
                  <button
                    type="button"
                    onClick={() => setAutoSlug(!autoSlug)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {autoSlug ? 'Edit manually' : 'Auto-generate'}
                  </button>
                </div>
                <Input
                  placeholder="page-slug"
                  value={data.slug}
                  onValueChange={(value) => {
                    setData('slug', value);
                    setAutoSlug(false);
                  }}
                  isInvalid={!!errors.slug}
                  errorMessage={errors.slug}
                  startContent={<span className="text-sm text-slate-500">/</span>}
                  description="URL-friendly identifier for the page"
                />
              </div>

              {/* Parent Page */}
              <Select
                label="Parent Page (for hierarchy)"
                placeholder="None - this is a top-level page"
                selectedKeys={data.parent_id ? [String(data.parent_id)] : []}
                onSelectionChange={(keys) => setData('parent_id', Array.from(keys)[0] || '')}
              >
                {parentPages.map((page) => (
                  <SelectItem key={String(page.id)}>{page.title}</SelectItem>
                ))}
              </Select>

              {/* Layout */}
              <Select
                label="Page Layout"
                selectedKeys={[data.layout]}
                onSelectionChange={(keys) => setData('layout', Array.from(keys)[0])}
              >
                {layouts.map((layout) => (
                  <SelectItem key={layout.value}>{layout.label}</SelectItem>
                ))}
              </Select>

              <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                <h3 className="font-semibold mb-4">SEO Settings</h3>

                <div className="space-y-4">
                  {/* Meta Title */}
                  <Input
                    label="Meta Title"
                    placeholder="Title shown in search results"
                    value={data.meta_title}
                    onValueChange={(value) => setData('meta_title', value)}
                    isInvalid={!!errors.meta_title}
                    errorMessage={errors.meta_title}
                    description="Leave empty to use page title"
                    maxLength={60}
                  />

                  {/* Meta Description */}
                  <Textarea
                    label="Meta Description"
                    placeholder="Short description for search results"
                    value={data.meta_description}
                    onValueChange={(value) => setData('meta_description', value)}
                    isInvalid={!!errors.meta_description}
                    errorMessage={errors.meta_description}
                    description="Keep under 160 characters for best display"
                    maxRows={2}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                <h3 className="font-semibold mb-4">Navigation Settings</h3>

                <div className="space-y-4">
                  {/* Show in Nav */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.show_in_nav}
                      onChange={(e) => setData('show_in_nav', e.target.checked)}
                      className="rounded"
                    />
                    <label className="text-sm font-medium">Show in main navigation</label>
                  </div>

                  {/* Nav Label */}
                  {data.show_in_nav && (
                    <Input
                      label="Navigation Label"
                      placeholder="Label shown in menu"
                      value={data.nav_label}
                      onValueChange={(value) => setData('nav_label', value)}
                      description="Leave empty to use page title"
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-200 dark:border-white/10 pt-6 flex justify-end gap-3">
                <Button
                  variant="bordered"
                  onPress={() => window.history.back()}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={processing}
                  disabled={!data.title}
                >
                  Create & Build Page
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

Create.layout = (page) => <App children={page} />;
export default Create;

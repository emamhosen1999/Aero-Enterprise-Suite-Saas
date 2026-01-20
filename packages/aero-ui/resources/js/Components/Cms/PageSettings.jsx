import React from 'react';
import { Input, Select, SelectItem, Textarea, Divider, Switch } from '@heroui/react';

const PageSettings = ({ page, onChange, layouts }) => {
  const handleChange = (field, value) => {
    onChange('blocks', page.blocks);
    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="p-4 space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="font-semibold text-sm mb-4">Basic Information</h3>
        <div className="space-y-3">
          <Input
            label="Page Title"
            value={page.title}
            onValueChange={(value) => handleChange('title', value)}
            isRequired
            size="sm"
            classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
          />

          <Input
            label="URL Slug"
            value={page.slug}
            onValueChange={(value) => handleChange('slug', value)}
            description="auto-generated from title"
            size="sm"
            classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
          />

          <Select
            label="Layout"
            selectedKeys={[page.layout || 'default']}
            onSelectionChange={(keys) => handleChange('layout', Array.from(keys)[0])}
            size="sm"
            classNames={{ trigger: 'bg-slate-100 dark:bg-slate-950' }}
          >
            {layouts?.map((layout) => (
              <SelectItem key={layout.id}>{layout.name}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <Divider />

      {/* SEO Settings */}
      <div>
        <h3 className="font-semibold text-sm mb-4">SEO Settings</h3>
        <div className="space-y-3">
          <Input
            label="Meta Title"
            placeholder="Page title for search engines"
            value={page.meta_title || ''}
            onValueChange={(value) => handleChange('meta_title', value)}
            description={`${page.meta_title?.length || 0}/60 characters`}
            maxLength={60}
            size="sm"
            classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
          />

          <Textarea
            label="Meta Description"
            placeholder="Brief description for search engines"
            value={page.meta_description || ''}
            onValueChange={(value) => handleChange('meta_description', value)}
            description={`${page.meta_description?.length || 0}/160 characters`}
            maxLength={160}
            minRows={3}
            maxRows={4}
            size="sm"
            classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
          />
        </div>
      </div>

      <Divider />

      {/* Page Status */}
      <div>
        <h3 className="font-semibold text-sm mb-4">Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-950 rounded-lg">
            <span>Published</span>
            <span className="font-medium text-slate-600 dark:text-slate-400">
              {page.status === 'published' ? 'Yes' : 'No'}
            </span>
          </div>
          {page.published_at && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-950 rounded-lg text-xs">
              <span>Published Date</span>
              <span className="text-slate-600 dark:text-slate-400">
                {new Date(page.published_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* Advanced Options */}
      <div>
        <h3 className="font-semibold text-sm mb-4">Advanced Options</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-950 rounded-lg">
            <label htmlFor="homepage" className="text-sm font-medium">
              Set as Homepage
            </label>
            <Switch
              id="homepage"
              isSelected={page.is_homepage || false}
              onValueChange={(value) => handleChange('is_homepage', value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-950 rounded-lg">
            <label htmlFor="nav" className="text-sm font-medium">
              Show in Navigation
            </label>
            <Switch
              id="nav"
              isSelected={page.show_in_nav || false}
              onValueChange={(value) => handleChange('show_in_nav', value)}
            />
          </div>

          {page.show_in_nav && (
            <Input
              label="Navigation Label"
              placeholder="Label to display in menu"
              value={page.nav_label || ''}
              onValueChange={(value) => handleChange('nav_label', value)}
              size="sm"
              classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PageSettings;

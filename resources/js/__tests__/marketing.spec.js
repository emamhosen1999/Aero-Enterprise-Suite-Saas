import { describe, expect, it } from 'vitest';
import { docQuickLinks, productHighlights } from '../constants/marketing';

describe('marketing constants', () => {
  it('exposes product highlights data points', () => {
    expect(Array.isArray(productHighlights)).toBe(true);
    expect(productHighlights.length).toBeGreaterThan(0);
    productHighlights.forEach((highlight) => {
      expect(highlight).toMatchObject({
        title: expect.any(String),
        description: expect.any(String),
        stat: expect.any(String),
      });
    });
  });

  it('provides documentation quick links with descriptions', () => {
    expect(Array.isArray(docQuickLinks)).toBe(true);
    expect(docQuickLinks.length).toBeGreaterThan(0);
    docQuickLinks.forEach((link) => {
      expect(link).toMatchObject({
        label: expect.any(String),
        href: expect.any(String),
        description: expect.any(String),
      });
    });
  });
});

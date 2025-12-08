<?php

namespace Aero\Platform\Services;

use Exception;
use Illuminate\Support\Facades\Log;

class SvgSanitizer
{
    /**
     * Dangerous SVG elements and attributes
     */
    protected array $dangerousElements = [
        'script',
        'object',
        'embed',
        'foreignobject',
        'iframe',
        'form',
        'input',
        'textarea',
        'button',
        'select',
        'option',
        'audio',
        'video',
        'link',
        'meta',
        'style', // Can be dangerous with @import
    ];

    protected array $dangerousAttributes = [
        'onload',
        'onerror',
        'onclick',
        'onmouseover',
        'onmouseout',
        'onfocus',
        'onblur',
        'onchange',
        'onsubmit',
        'onreset',
        'onselect',
        'onunload',
        'onresize',
        'onscroll',
        'javascript:',
        'vbscript:',
        'data:text/html',
        'xlink:href',
    ];

    /**
     * Sanitize SVG content
     */
    public function sanitize(string $svgContent): string
    {
        try {
            // Basic validation
            if (! $this->isValidSvg($svgContent)) {
                throw new Exception('Invalid SVG content provided');
            }

            // Remove dangerous elements and attributes
            $sanitized = $this->removeDangerousElements($svgContent);
            $sanitized = $this->removeDangerousAttributes($sanitized);

            // Clean up whitespace and normalize
            $sanitized = $this->normalizeContent($sanitized);

            return $sanitized;

        } catch (Exception $e) {
            Log::error('SVG sanitization failed', [
                'error' => $e->getMessage(),
                'content_length' => strlen($svgContent),
            ]);
            throw $e;
        }
    }

    /**
     * Validate if content is a proper SVG
     */
    public function isValidSvg(string $content): bool
    {
        // Basic structure check
        if (! str_contains($content, '<svg') || ! str_contains($content, '</svg>')) {
            return false;
        }

        // Check for XML declaration issues
        if (str_contains($content, '<?xml') && ! str_starts_with(trim($content), '<?xml')) {
            return false;
        }

        // Try to load as DOMDocument for structure validation
        try {
            $dom = new \DOMDocument;
            $dom->loadXML($content, LIBXML_NOERROR | LIBXML_NOWARNING);

            // Check if it has an SVG root element
            $svgElements = $dom->getElementsByTagName('svg');

            return $svgElements->length > 0;

        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Remove dangerous elements
     */
    protected function removeDangerousElements(string $content): string
    {
        foreach ($this->dangerousElements as $element) {
            // Remove opening and closing tags
            $content = preg_replace(
                '/<'.preg_quote($element, '/').'[^>]*>.*?<\/'.preg_quote($element, '/').'>/si',
                '',
                $content
            );

            // Remove self-closing tags
            $content = preg_replace(
                '/<'.preg_quote($element, '/').'[^>]*\/>/si',
                '',
                $content
            );
        }

        return $content;
    }

    /**
     * Remove dangerous attributes
     */
    protected function removeDangerousAttributes(string $content): string
    {
        foreach ($this->dangerousAttributes as $attribute) {
            if (str_contains($attribute, ':')) {
                // Handle protocol-based attributes like javascript:
                $content = preg_replace(
                    '/\s[^=]*=\s*["\']?'.preg_quote($attribute, '/').'[^"\'>\s]*/i',
                    '',
                    $content
                );
            } else {
                // Handle regular attributes
                $content = preg_replace(
                    '/\s'.preg_quote($attribute, '/').'\s*=\s*["\'][^"\']*["\']/i',
                    '',
                    $content
                );
            }
        }

        return $content;
    }

    /**
     * Normalize SVG content
     */
    protected function normalizeContent(string $content): string
    {
        // Remove comments
        $content = preg_replace('/<!--.*?-->/s', '', $content);

        // Remove excessive whitespace
        $content = preg_replace('/\s+/', ' ', $content);
        $content = preg_replace('/>\s+</', '><', $content);

        // Trim
        $content = trim($content);

        return $content;
    }

    /**
     * Extract SVG dimensions
     */
    public function extractDimensions(string $svgContent): array
    {
        $dimensions = ['width' => null, 'height' => null, 'viewBox' => null];

        try {
            $dom = new \DOMDocument;
            $dom->loadXML($svgContent, LIBXML_NOERROR | LIBXML_NOWARNING);

            $svgElement = $dom->getElementsByTagName('svg')->item(0);
            if ($svgElement) {
                $dimensions['width'] = $svgElement->getAttribute('width');
                $dimensions['height'] = $svgElement->getAttribute('height');
                $dimensions['viewBox'] = $svgElement->getAttribute('viewBox');
            }

        } catch (Exception $e) {
            // If DOM parsing fails, try regex fallback
            if (preg_match('/width\s*=\s*["\']([^"\']+)["\']/i', $svgContent, $matches)) {
                $dimensions['width'] = $matches[1];
            }
            if (preg_match('/height\s*=\s*["\']([^"\']+)["\']/i', $svgContent, $matches)) {
                $dimensions['height'] = $matches[1];
            }
            if (preg_match('/viewBox\s*=\s*["\']([^"\']+)["\']/i', $svgContent, $matches)) {
                $dimensions['viewBox'] = $matches[1];
            }
        }

        return $dimensions;
    }

    /**
     * Optimize SVG content
     */
    public function optimize(string $svgContent): string
    {
        try {
            // First sanitize
            $optimized = $this->sanitize($svgContent);

            // Remove unnecessary attributes
            $optimized = $this->removeUnnecessaryAttributes($optimized);

            // Optimize paths (basic optimization)
            $optimized = $this->optimizePaths($optimized);

            return $optimized;

        } catch (Exception $e) {
            Log::warning('SVG optimization failed, returning sanitized version', [
                'error' => $e->getMessage(),
            ]);

            return $this->sanitize($svgContent);
        }
    }

    /**
     * Remove unnecessary attributes for web display
     */
    protected function removeUnnecessaryAttributes(string $content): string
    {
        $unnecessaryAttributes = [
            'xmlns:xlink',
            'xml:space',
            'xmlns:serif',
            'xmlns:sketch',
            'sketch:type',
            'data-name',
            'id', // Remove IDs to avoid conflicts (be careful with this)
        ];

        foreach ($unnecessaryAttributes as $attr) {
            $content = preg_replace(
                '/\s'.preg_quote($attr, '/').'\s*=\s*["\'][^"\']*["\']/i',
                '',
                $content
            );
        }

        return $content;
    }

    /**
     * Basic path optimization
     */
    protected function optimizePaths(string $content): string
    {
        // Remove unnecessary spaces in path data
        $content = preg_replace_callback(
            '/d\s*=\s*["\']([^"\']+)["\']/i',
            function ($matches) {
                $path = $matches[1];
                // Remove unnecessary spaces around path commands
                $path = preg_replace('/\s*([MmLlHhVvCcSsQqTtAaZz])\s*/', '$1', $path);
                // Remove unnecessary spaces around numbers
                $path = preg_replace('/\s+/', ' ', $path);

                return 'd="'.trim($path).'"';
            },
            $content
        );

        return $content;
    }
}

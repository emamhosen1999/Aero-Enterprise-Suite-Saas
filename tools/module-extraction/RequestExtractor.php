<?php

namespace Tools\ModuleExtraction;

/**
 * Request Extractor
 * 
 * Extracts form requests from app/Http/Requests/{Module}/ to package src/Http/Requests/
 */
class RequestExtractor extends BaseExtractor
{
    public function extract(): void
    {
        $this->log("📝 Extracting form requests...");

        $variants = $this->getModuleNameVariants();
        $sourceDir = $this->extractor->getBasePath() . "/app/Http/Requests/{$variants['studly']}";

        if (!is_dir($sourceDir)) {
            $this->log("   ℹ No form requests directory found (this is optional)");
            return;
        }

        $files = $this->findPhpFiles($sourceDir);
        $count = 0;

        foreach ($files as $file) {
            $relativePath = $this->getRelativePath($file, $sourceDir);
            $destinationPath = $this->outputPath . "/src/Http/Requests/" . $relativePath;

            if ($this->copyAndTransform($file, $destinationPath)) {
                $count++;
            }
        }

        $this->log("   📊 Extracted {$count} form request(s)");
        $this->log("");
    }
}

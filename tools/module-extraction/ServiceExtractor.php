<?php

namespace Tools\ModuleExtraction;

/**
 * Service Extractor
 * 
 * Extracts services from app/Services/{Module}/ to package src/Services/
 */
class ServiceExtractor extends BaseExtractor
{
    public function extract(): void
    {
        $this->log("⚙️ Extracting services...");

        $variants = $this->getModuleNameVariants();
        $sourceDir = $this->extractor->getBasePath() . "/app/Services/{$variants['studly']}";

        if (!is_dir($sourceDir)) {
            $this->log("   ℹ No services directory found (this is optional)");
            return;
        }

        $files = $this->findPhpFiles($sourceDir);
        $count = 0;

        foreach ($files as $file) {
            $relativePath = $this->getRelativePath($file, $sourceDir);
            $destinationPath = $this->outputPath . "/src/Services/" . $relativePath;

            if ($this->copyAndTransform($file, $destinationPath)) {
                $count++;
            }
        }

        $this->log("   📊 Extracted {$count} service(s)");
        $this->log("");
    }
}

<?php

namespace Tools\ModuleExtraction;

/**
 * Model Extractor
 * 
 * Extracts models from app/Models/{Module}/ to package src/Models/
 */
class ModelExtractor extends BaseExtractor
{
    public function extract(): void
    {
        $this->log("📦 Extracting models...");

        $variants = $this->getModuleNameVariants();
        $sourceDir = $this->extractor->getBasePath() . "/app/Models/{$variants['studly']}";

        if (!is_dir($sourceDir)) {
            $this->log("   ⚠ No models directory found at: {$sourceDir}");
            return;
        }

        $files = $this->findPhpFiles($sourceDir);
        $count = 0;

        foreach ($files as $file) {
            $relativePath = $this->getRelativePath($file, $sourceDir);
            $destinationPath = $this->outputPath . "/src/Models/" . $relativePath;

            if ($this->copyAndTransform($file, $destinationPath)) {
                $count++;
            }
        }

        $this->log("   📊 Extracted {$count} model(s)");
        $this->log("");
    }
}

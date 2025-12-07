<?php

namespace Tools\ModuleExtraction;

/**
 * Policy Extractor
 * 
 * Extracts policies from app/Policies/{Module}/ to package src/Policies/
 */
class PolicyExtractor extends BaseExtractor
{
    public function extract(): void
    {
        $this->log("🛡️ Extracting policies...");

        $variants = $this->getModuleNameVariants();
        $sourceDir = $this->extractor->getBasePath() . "/app/Policies/{$variants['studly']}";

        if (!is_dir($sourceDir)) {
            // Try direct policies with module name in filename
            $sourceDir = $this->extractor->getBasePath() . "/app/Policies";
            
            if (!is_dir($sourceDir)) {
                $this->log("   ℹ No policies directory found (this is optional)");
                return;
            }

            // Filter only module-related policies
            $files = $this->findPhpFiles($sourceDir);
            $count = 0;

            foreach ($files as $file) {
                if ($this->isModuleFile($file)) {
                    $filename = basename($file);
                    $destinationPath = $this->outputPath . "/src/Policies/" . $filename;

                    if ($this->copyAndTransform($file, $destinationPath)) {
                        $count++;
                    }
                }
            }

            if ($count === 0) {
                $this->log("   ℹ No module-specific policies found");
            } else {
                $this->log("   📊 Extracted {$count} policy/policies");
            }
        } else {
            // Extract all policies from module directory
            $files = $this->findPhpFiles($sourceDir);
            $count = 0;

            foreach ($files as $file) {
                $relativePath = $this->getRelativePath($file, $sourceDir);
                $destinationPath = $this->outputPath . "/src/Policies/" . $relativePath;

                if ($this->copyAndTransform($file, $destinationPath)) {
                    $count++;
                }
            }

            $this->log("   📊 Extracted {$count} policy/policies");
        }

        $this->log("");
    }
}

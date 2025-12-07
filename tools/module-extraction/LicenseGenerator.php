<?php

namespace Tools\ModuleExtraction;

/**
 * License Generator
 */
class LicenseGenerator
{
    protected ModuleExtractor $extractor;

    public function __construct(ModuleExtractor $extractor)
    {
        $this->extractor = $extractor;
    }

    public function generate(): void
    {
        $content = $this->buildLicense();
        
        $licensePath = $this->extractor->getOutputPath() . "/LICENSE.md";
        file_put_contents($licensePath, $content);
    }

    protected function buildLicense(): string
    {
        $year = date('Y');
        $company = $this->extractor->getConfig('author_name');

        return <<<MD
# Proprietary Software License

Copyright (c) {$year} {$company}

All rights reserved.

This software and associated documentation files (the "Software") are the proprietary and confidential information of {$company}.

## License Grant

Subject to the terms and conditions of this License and payment of applicable fees, {$company} grants you a limited, non-exclusive, non-transferable license to use the Software in accordance with the purchased license tier.

## Restrictions

You may not:
- Copy, modify, or distribute the Software
- Reverse engineer, decompile, or disassemble the Software
- Remove or alter any proprietary notices
- Use the Software beyond the scope of your license

## Termination

This license terminates automatically if you fail to comply with any term. Upon termination, you must destroy all copies of the Software.

## Warranty Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

## Limitation of Liability

IN NO EVENT SHALL {$company} BE LIABLE FOR ANY DAMAGES ARISING FROM THE USE OF THE SOFTWARE.

For licensing inquiries, please contact: license@aero.com

MD;
    }
}

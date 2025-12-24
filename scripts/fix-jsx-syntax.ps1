# Fix JSX syntax errors: })); -> });
# This script fixes callbacks with extra closing parenthesis

$packagePath = "D:\laragon\www\Aero-Enterprise-Suite-Saas\packages\aero-ui\resources\js"
$filesFixed = 0
$replacements = 0

# Get all JSX files
Get-ChildItem -Path $packagePath -Filter "*.jsx" -Recurse | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content -Path $file -Raw
    $originalContent = $content
    
    # Replace })); with });
    $content = $content -replace '(\s+)}\)\);', '$1});'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file -Value $content -NoNewline
        $filesFixed++
        $changes = ([regex]::Matches($originalContent, '}\)\);')).Count
        $replacements += $changes
        Write-Host "Fixed $file - $changes replacements" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Fixed $filesFixed files with $replacements total replacements" -ForegroundColor Cyan

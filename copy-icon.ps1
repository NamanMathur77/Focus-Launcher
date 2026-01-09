# PowerShell script to copy app icon to all Android resource folders
param(
    [string]$SourceImage = ".\resources\clair_icon.png"
)

Write-Host "Checking if source image exists..." -ForegroundColor Cyan
if (-not (Test-Path $SourceImage)) {
    Write-Host "ERROR: Source image not found at $SourceImage" -ForegroundColor Red
    Write-Host "Please save your Clair logo as 'icon.png' in the 'resources' folder" -ForegroundColor Yellow
    exit 1
}

Write-Host "Source image found: $SourceImage" -ForegroundColor Green

# Define target folders and file names for Android app icons
$targets = @(
    @{Folder="android\app\src\main\res\mipmap-mdpi"; Files=@("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")},
    @{Folder="android\app\src\main\res\mipmap-hdpi"; Files=@("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")},
    @{Folder="android\app\src\main\res\mipmap-xhdpi"; Files=@("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")},
    @{Folder="android\app\src\main\res\mipmap-xxhdpi"; Files=@("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")},
    @{Folder="android\app\src\main\res\mipmap-xxxhdpi"; Files=@("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")}
)

$copiedCount = 0

foreach ($target in $targets) {
    $targetFolder = $target.Folder
    
    # Create folder if it doesn't exist
    if (-not (Test-Path $targetFolder)) {
        New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
        Write-Host "Created folder: $targetFolder" -ForegroundColor Yellow
    }
    
    foreach ($fileName in $target.Files) {
        $targetPath = Join-Path $targetFolder $fileName
        Copy-Item -Path $SourceImage -Destination $targetPath -Force
        $copiedCount++
        Write-Host "Copied to: $targetPath" -ForegroundColor Green
    }
}

# Copy to splash screen folders (portrait and landscape)
$splashFolders = @(
    "android\app\src\main\res\drawable",
    "android\app\src\main\res\drawable-land-hdpi",
    "android\app\src\main\res\drawable-land-mdpi",
    "android\app\src\main\res\drawable-land-xhdpi",
    "android\app\src\main\res\drawable-land-xxhdpi",
    "android\app\src\main\res\drawable-land-xxxhdpi",
    "android\app\src\main\res\drawable-port-hdpi",
    "android\app\src\main\res\drawable-port-mdpi",
    "android\app\src\main\res\drawable-port-xhdpi",
    "android\app\src\main\res\drawable-port-xxhdpi",
    "android\app\src\main\res\drawable-port-xxxhdpi"
)

foreach ($folder in $splashFolders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
    
    $splashPath = Join-Path $folder "splash.png"
    Copy-Item -Path $SourceImage -Destination $splashPath -Force
    $copiedCount++
    Write-Host "Copied splash to: $splashPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Successfully copied icon to $copiedCount locations" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Rebuild your app: ionic build" -ForegroundColor White
Write-Host "2. Sync with Android: npx cap sync android" -ForegroundColor White
Write-Host "3. Run on device" -ForegroundColor White

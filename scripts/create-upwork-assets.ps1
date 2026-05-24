Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$screenshots = Join-Path $root "screenshots"
$output = Join-Path $root "upwork-assets"
New-Item -ItemType Directory -Force -Path $output | Out-Null

function New-Canvas {
  param([int] $Width = 1000, [int] $Height = 750)

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#EDF2F7"))

  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Draw-Text {
  param(
    [System.Drawing.Graphics] $Graphics,
    [string] $Text,
    [int] $X,
    [int] $Y,
    [int] $Size,
    [string] $Color,
    [System.Drawing.FontStyle] $Style = [System.Drawing.FontStyle]::Regular
  )

  $font = New-Object System.Drawing.Font("Segoe UI", $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($Color))
  $Graphics.DrawString($Text, $font, $brush, $X, $Y)
  $brush.Dispose()
  $font.Dispose()
}

function Draw-Pill {
  param(
    [System.Drawing.Graphics] $Graphics,
    [string] $Text,
    [int] $X,
    [int] $Y,
    [int] $Width,
    [string] $Fill,
    [string] $TextColor
  )

  $rect = New-Object System.Drawing.Rectangle($X, $Y, $Width, 34)
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($Fill))
  $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#D7E1EA"), 1)
  $Graphics.FillRectangle($brush, $rect)
  $Graphics.DrawRectangle($pen, $rect)
  Draw-Text -Graphics $Graphics -Text $Text -X ($X + 13) -Y ($Y + 7) -Size 14 -Color $TextColor -Style ([System.Drawing.FontStyle]::Bold)
  $pen.Dispose()
  $brush.Dispose()
}

function Draw-FitImage {
  param(
    [System.Drawing.Graphics] $Graphics,
    [string] $Source,
    [int] $X,
    [int] $Y,
    [int] $MaxWidth,
    [int] $MaxHeight
  )

  $image = [System.Drawing.Image]::FromFile((Resolve-Path $Source))
  try {
    $scale = [Math]::Min($MaxWidth / $image.Width, $MaxHeight / $image.Height)
    $width = [int] [Math]::Round($image.Width * $scale)
    $height = [int] [Math]::Round($image.Height * $scale)
    $target = New-Object System.Drawing.Rectangle($X, $Y, $width, $height)
    $Graphics.DrawImage($image, $target)
  }
  finally {
    $image.Dispose()
  }
}

function Save-Asset {
  param(
    [System.Drawing.Bitmap] $Bitmap,
    [System.Drawing.Graphics] $Graphics,
    [string] $Path
  )

  $Graphics.Dispose()
  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Bitmap.Dispose()
}

function New-DesktopAsset {
  param(
    [string] $Source,
    [string] $Destination,
    [string] $Title,
    [string] $Subtitle
  )

  $canvas = New-Canvas
  $g = $canvas.Graphics
  $headerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $g.FillRectangle($headerBrush, 0, 0, 1000, 118)
  $headerBrush.Dispose()
  Draw-Text -Graphics $g -Text $Title -X 28 -Y 24 -Size 30 -Color "#172333" -Style ([System.Drawing.FontStyle]::Bold)
  Draw-Text -Graphics $g -Text $Subtitle -X 30 -Y 65 -Size 16 -Color "#536578"
  Draw-Pill -Graphics $g -Text "React + TypeScript" -X 612 -Y 34 -Width 154 -Fill "#F8FAFC" -TextColor "#172333"
  Draw-Pill -Graphics $g -Text "Mock integrations" -X 782 -Y 34 -Width 154 -Fill "#F8FAFC" -TextColor "#172333"
  Draw-FitImage -Graphics $g -Source $Source -X 18 -Y 132 -MaxWidth 964 -MaxHeight 600
  Save-Asset -Bitmap $canvas.Bitmap -Graphics $g -Path $Destination
}

function New-MobileAsset {
  param(
    [string] $Source,
    [string] $Destination
  )

  $canvas = New-Canvas
  $g = $canvas.Graphics
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $g.FillRectangle($white, 0, 0, 1000, 750)
  $white.Dispose()

  Draw-Text -Graphics $g -Text "Workflow Automation Builder" -X 58 -Y 76 -Size 34 -Color "#172333" -Style ([System.Drawing.FontStyle]::Bold)
  Draw-Text -Graphics $g -Text "A Zapier / Make / n8n style automation" -X 60 -Y 132 -Size 19 -Color "#455665"
  Draw-Text -Graphics $g -Text "demo with AI processing and API actions." -X 60 -Y 160 -Size 19 -Color "#455665"
  Draw-Pill -Graphics $g -Text "Trigger" -X 60 -Y 224 -Width 92 -Fill "#DCF4EF" -TextColor "#155E56"
  Draw-Pill -Graphics $g -Text "AI scoring" -X 168 -Y 224 -Width 116 -Fill "#ECE7FB" -TextColor "#503C89"
  Draw-Pill -Graphics $g -Text "CRM / Slack / Sheets" -X 300 -Y 224 -Width 184 -Fill "#E5F2FA" -TextColor "#155074"
  Draw-Text -Graphics $g -Text "Real project options:" -X 60 -Y 322 -Size 20 -Color "#172333" -Style ([System.Drawing.FontStyle]::Bold)
  Draw-Text -Graphics $g -Text "OpenAI or rules-based processing" -X 86 -Y 372 -Size 18 -Color "#344554"
  Draw-Text -Graphics $g -Text "CRM, Slack, Sheets, Airtable, Notion APIs" -X 86 -Y 414 -Size 18 -Color "#344554"
  Draw-Text -Graphics $g -Text "Error handling, retries, and execution logs" -X 86 -Y 456 -Size 18 -Color "#344554"
  Draw-Text -Graphics $g -Text "Custom dashboards and workflow controls" -X 86 -Y 498 -Size 18 -Color "#344554"

  $shadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 23, 32, 38))
  $g.FillRectangle($shadow, 640, 52, 324, 660)
  $shadow.Dispose()
  $phoneFrame = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#172734"))
  $g.FillRectangle($phoneFrame, 625, 38, 324, 660)
  $phoneFrame.Dispose()
  Draw-FitImage -Graphics $g -Source $Source -X 637 -Y 52 -MaxWidth 300 -MaxHeight 636

  Save-Asset -Bitmap $canvas.Bitmap -Graphics $g -Path $Destination
}

New-DesktopAsset `
  -Source (Join-Path $screenshots "desktop.png") `
  -Destination (Join-Path $output "01-cover-workflow-automation-builder.png") `
  -Title "Workflow Automation Builder" `
  -Subtitle "Visual automation demo with trigger, AI qualification, routing, and API actions."

New-DesktopAsset `
  -Source (Join-Path $screenshots "desktop.png") `
  -Destination (Join-Path $output "02-visual-workflow-canvas.png") `
  -Title "Trigger to AI to Actions" `
  -Subtitle "A sample lead moves through scoring, routing, CRM update, Slack, and Sheets steps."

New-DesktopAsset `
  -Source (Join-Path $screenshots "desktop.png") `
  -Destination (Join-Path $output "03-run-preview-and-mapping.png") `
  -Title "Execution Preview and Data Mapping" `
  -Subtitle "Shows lead score, AI summary, recommended action, mapped fields, and run logs."

New-MobileAsset `
  -Source (Join-Path $screenshots "mobile.png") `
  -Destination (Join-Path $output "04-mobile-responsive-workflow.png")

Write-Host "Created Upwork assets in $output"

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$forgeRelayRoot = (Resolve-Path (Join-Path $projectRoot "..\..\..")).Path
$uvPath = Join-Path $forgeRelayRoot ".datahub-tools\uv.exe"
$ffprobePath = Join-Path $projectRoot "node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe"
$outputDirectory = Join-Path $projectRoot "public\audio"

if (-not (Test-Path -LiteralPath $uvPath)) {
    throw "uv is not available at $uvPath"
}
if (-not (Test-Path -LiteralPath $ffprobePath)) {
    throw "ffprobe is not available at $ffprobePath. Run npm install first."
}

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$voice = "en-US-AvaNeural"
$rate = "-4%"
$pitch = "-2Hz"

$scenes = @(
    @{
        Id = "01-title"
        Text = "ForgeRelay turns an incomplete manufacturing R-F-Q into an auditable clarification package, without inventing the missing details."
    },
    @{
        Id = "02-problem"
        Text = "This synthetic request includes material, quantity, finish, and delivery date. But its critical interface tolerance and inspection method are missing. Pricing it now would create avoidable risk."
    },
    @{
        Id = "03-analysis"
        Text = "The operator loads the sample and runs quote readiness analysis. ForgeRelay separates confirmed facts from unknowns, assigns a readiness score, and turns every gap into a clear supplier question."
    },
    @{
        Id = "04-mcp"
        Text = "Next, the live DataHub M-C-P Server adds organizational context. ForgeRelay calls search, get entities, and get lineage against a local DataHub Core deployment. The tool trace is visible in the result."
    },
    @{
        Id = "05-lineage"
        Text = "The catalog contains five synthetic datasets connected by four lineage edges, from the R-F-Q source through extracted constraints and clarification planning to the quote ready package."
    },
    @{
        Id = "06-impact"
        Text = "Ownership, schema, and downstream impact explain who should review the case, which fields matter, and which quote artifact could be affected by an unanswered requirement."
    },
    @{
        Id = "07-safety"
        Text = "Safety stays explicit. The demo uses synthetic data. DataHub mutations are disabled. Live calls are disabled. And no customer document or credential is committed."
    },
    @{
        Id = "08-close"
        Text = "ForgeRelay is open source under Apache two point zero. The repository, implementation evidence, and reproducible local demo are ready for review."
    }
)

$manifest = foreach ($scene in $scenes) {
    $path = Join-Path $outputDirectory "$($scene.Id).mp3"
    $arguments = @(
        "tool", "run", "edge-tts",
        "--voice", $voice,
        "--rate=$rate",
        "--pitch=$pitch",
        "--text", $scene.Text,
        "--write-media", $path
    )

    $generated = $false
    for ($attempt = 1; $attempt -le 4; $attempt++) {
        if (Test-Path -LiteralPath $path) {
            Remove-Item -LiteralPath $path -Force
        }
        & $uvPath @arguments
        if ($LASTEXITCODE -eq 0 -and (Test-Path -LiteralPath $path)) {
            $generated = $true
            break
        }
        if ($attempt -lt 4) {
            Write-Warning "Voice generation attempt $attempt failed for $($scene.Id); retrying."
            Start-Sleep -Seconds (2 * $attempt)
        }
    }
    if (-not $generated) {
        throw "Neural voice generation failed for $($scene.Id)"
    }

    $durationText = & $ffprobePath `
        -v error `
        -show_entries format=duration `
        -of default=noprint_wrappers=1:nokey=1 `
        $path
    $durationSeconds = [double]::Parse(
        $durationText.Trim(),
        [System.Globalization.CultureInfo]::InvariantCulture
    )

    [PSCustomObject]@{
        id = $scene.Id
        text = $scene.Text
        file = "audio/$($scene.Id).mp3"
        voice = $voice
        rate = $rate
        pitch = $pitch
        durationSeconds = [Math]::Round($durationSeconds, 3)
    }
}

$manifest | ConvertTo-Json -Depth 4 |
    Set-Content -LiteralPath (Join-Path $outputDirectory "manifest.json") -Encoding utf8
$manifest | Format-Table id, durationSeconds, voice, file -AutoSize

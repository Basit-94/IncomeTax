# Wapsi plan explainer - voiceover synthesis via Windows SAPI (System.Speech).
# Reads vo-script.json, renders one WAV per narration line into vo/.
# Per-line files (not one blob) so make_audio.py can measure real durations
# and derive the composition's scene timings from them.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tts.ps1
#
# Optional: -Voice "Microsoft Zira Desktop" to override the script's voice.

param(
  [string]$ScriptJson = "$PSScriptRoot\vo-script.json",
  [string]$OutDir     = "$PSScriptRoot\vo",
  [string]$Voice      = ""
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$cfg = Get-Content -Raw -Encoding UTF8 $ScriptJson | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($Voice)) { $Voice = $cfg.voice }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Report what is actually installed, then bind the requested voice.
Write-Output "installed voices:"
foreach ($v in $synth.GetInstalledVoices()) {
  Write-Output ("  {0}  [{1}, {2}]" -f $v.VoiceInfo.Name, $v.VoiceInfo.Culture, $v.VoiceInfo.Gender)
}

$synth.SelectVoice($Voice)
$synth.Rate   = [int]$cfg.rate
$synth.Volume = [int]$cfg.volume
Write-Output ("`nusing voice: {0}  rate={1}  volume={2}  sampleRate={3}" -f `
  $synth.Voice.Name, $synth.Rate, $synth.Volume, $cfg.sampleRate)

$fmt = [System.Speech.AudioFormat.SpeechAudioFormatInfo]::new(
  [int]$cfg.sampleRate,
  [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
  [System.Speech.AudioFormat.AudioChannel]::Mono
)

foreach ($line in $cfg.lines) {
  $path = Join-Path $OutDir ("{0}.wav" -f $line.id)
  $synth.SetOutputToWaveFile($path, $fmt)
  $synth.Speak($line.text)
  $synth.SetOutputToNull()          # flush + release the file handle
  $len = (Get-Item $path).Length
  Write-Output ("  {0}  {1,8:N0} bytes  {2}" -f $line.id, $len, $line.text)
}

$synth.Dispose()
Write-Output ("`ndone: {0} lines -> {1}" -f $cfg.lines.Count, $OutDir)

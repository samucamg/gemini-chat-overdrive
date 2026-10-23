$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..\mcp-bridge')
try { node healthcheck.mjs --smoke; exit $LASTEXITCODE } finally { Pop-Location }

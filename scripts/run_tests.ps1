# Automated Test Runner for AstroAI Agent
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Running AstroAI Agent Automated Tests  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

python -m pytest backend/tests/ -v --tb=short
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[+] ALL TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
} else {
    Write-Host "`n[-] SOME TESTS FAILED. Inspect error log above." -ForegroundColor Red
}

param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$Email = "author1@culinaryblog.local",
    [string]$Password = "Author@123"
)

$ErrorActionPreference = "Stop"

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw "Smoke test failed: $Message" }
}

$imageId = $null
$recipeId = $null
$headers = $null
$tempImage = Join-Path ([IO.Path]::GetTempPath()) "culinary-blog-smoke.png"

try {
    $health = Invoke-RestMethod "$BaseUrl/health/ready"
    Assert-True ($health.status -eq "Healthy") "readiness is not Healthy"

    $auth = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/v1/auth/login" `
        -ContentType "application/json" `
        -Body (@{ email = $Email; password = $Password } | ConvertTo-Json)
    Assert-True (-not [string]::IsNullOrWhiteSpace($auth.accessToken)) "login returned no access token"
    $headers = @{ Authorization = "Bearer $($auth.accessToken)" }

    $recipes = Invoke-RestMethod "$BaseUrl/api/v1/recipes?page=1&pageSize=1"
    Assert-True (@($recipes.items).Count -eq 1) "public recipe list is empty; run seed first"
    $recipe = $recipes.items[0]
    $recipeId = $recipe.id

    $detail = Invoke-RestMethod "$BaseUrl/api/v1/recipes/$($recipe.slug)"
    Assert-True ($detail.id -eq $recipeId) "public recipe detail mismatch"

    $editResponse = Invoke-WebRequest -UseBasicParsing `
        -Uri "$BaseUrl/api/v1/recipes/by-id/$recipeId" -Headers $headers
    Assert-True ($editResponse.StatusCode -eq 200) "edit-by-id failed"
    Assert-True (-not [string]::IsNullOrWhiteSpace($editResponse.Headers["ETag"])) "edit response has no ETag"

    $search = Invoke-RestMethod "$BaseUrl/api/v1/recipes/search?q=cong%20thuc&page=1&pageSize=5"
    Assert-True ($search.totalCount -gt 0) "accent-insensitive search returned no seeded recipe"

    [IO.File]::WriteAllBytes(
        $tempImage,
        [Convert]::FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="))
    $uploadJson = curl.exe -sS -X POST `
        -H "Authorization: Bearer $($auth.accessToken)" `
        -F "file=@$tempImage;type=image/png" `
        "$BaseUrl/api/v1/recipes/$recipeId/images/"
    $upload = $uploadJson | ConvertFrom-Json
    Assert-True ($null -ne $upload.id) "image upload failed: $uploadJson"
    $imageId = $upload.id

    $download = Invoke-WebRequest -UseBasicParsing $upload.url
    Assert-True ($download.StatusCode -eq 200) "uploaded image is not publicly readable"

    Write-Host "PASS backend smoke test" -ForegroundColor Green
    [pscustomobject]@{
        health = $health.status
        recipeId = $recipeId
        searchResults = $search.totalCount
        imageDownloadStatus = $download.StatusCode
    } | ConvertTo-Json
}
finally {
    if ($headers -and $recipeId) {
        if ($imageId) {
            try {
                Invoke-WebRequest -UseBasicParsing -Method Delete `
                    -Uri "$BaseUrl/api/v1/recipes/$recipeId/images/$imageId" `
                    -Headers $headers | Out-Null
            } catch { Write-Warning "Could not clean image ${imageId}: $_" }
        }

    }

    if (Test-Path -LiteralPath $tempImage) {
        Remove-Item -LiteralPath $tempImage -Force
    }
}

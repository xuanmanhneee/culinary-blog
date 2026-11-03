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
$thumbnailUrl = $null
$tempImage = Join-Path ([IO.Path]::GetTempPath()) "culinary-blog-smoke.png"

try {
    $health = Invoke-RestMethod "$BaseUrl/health/ready"
    Assert-True ($health.status -eq "Healthy") "readiness is not Healthy"

    $categoriesResponse = Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/v1/categories/"
    $categories = $categoriesResponse.Content | ConvertFrom-Json
    Assert-True (@($categories).Count -gt 0) "category list is empty"
    Assert-True ($null -ne @($categories)[0].recipeCount) "category response has no recipeCount"
    $category = @($categories)[0]
    $categoryDetail = Invoke-RestMethod "$BaseUrl/api/v1/categories/$($category.slug)?page=1&pageSize=2"
    Assert-True ($categoryDetail.category.slug -eq $category.slug) "category detail mismatch"
    Assert-True (@($categoryDetail.recipes.items).Count -le 2) "category detail pagination failed"

    $correlation = $categoriesResponse.Headers["X-Correlation-ID"]
    Assert-True (-not [string]::IsNullOrWhiteSpace($correlation)) "response has no correlation id"

    try {
        Invoke-WebRequest -UseBasicParsing `
            -Uri "$BaseUrl/api/v1/auth/confirm-email?userId=00000000-0000-0000-0000-000000000000&token=invalid" | Out-Null
        $confirmationStatus = 200
    } catch {
        $confirmationStatus = [int]$_.Exception.Response.StatusCode
    }
    Assert-True ($confirmationStatus -eq 400) "invalid email confirmation was not rejected"

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
    $filteredSearch = Invoke-RestMethod "$BaseUrl/api/v1/recipes/search?q=cong%20thuc&page=1&pageSize=5&categoryId=$($category.id)&minServings=1"
    Assert-True ($filteredSearch.totalCount -ge 0) "filtered search failed"

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

    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 500
        $updatedRecipe = Invoke-RestMethod `
            -Uri "$BaseUrl/api/v1/recipes/by-id/$recipeId" `
            -Headers $headers
        $processedImage = @($updatedRecipe.images) | Where-Object { $_.id -eq $imageId } | Select-Object -First 1
        if (-not [string]::IsNullOrWhiteSpace($processedImage.thumbnailUrl) -and
            -not [string]::IsNullOrWhiteSpace($processedImage.mediumUrl)) {
            $thumbnailUrl = $processedImage.thumbnailUrl
            break
        }
    }
    Assert-True (-not [string]::IsNullOrWhiteSpace($thumbnailUrl)) "thumbnail job did not finish within 10 seconds"

    $thumbnailDownload = Invoke-WebRequest -UseBasicParsing $thumbnailUrl
    Assert-True ($thumbnailDownload.StatusCode -eq 200) "generated thumbnail is not publicly readable"

    Write-Host "PASS backend smoke test" -ForegroundColor Green
    [pscustomobject]@{
        health = $health.status
        recipeId = $recipeId
        searchResults = $search.totalCount
        imageDownloadStatus = $download.StatusCode
        thumbnailDownloadStatus = $thumbnailDownload.StatusCode
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

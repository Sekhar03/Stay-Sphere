# Full codebase emoji cleanup - handles all files and all emoji types
# Uses .NET for proper Unicode handling

function Clean-FileByPath {
    param([string]$FullPath, [hashtable[]]$Replacements)
    
    if (-not (Test-Path $FullPath)) {
        Write-Host "SKIP (not found): $FullPath"
        return
    }
    
    $content = [System.IO.File]::ReadAllText($FullPath)
    $changed = $false
    
    foreach ($r in $Replacements) {
        if ($content.Contains($r.Old)) {
            $content = $content.Replace($r.Old, $r.New)
            $changed = $true
        }
    }
    
    if ($changed) {
        [System.IO.File]::WriteAllText($FullPath, $content)
        Write-Host "SAVED: $FullPath"
    } else {
        Write-Host "NO CHANGES: $FullPath"
    }
}

$base = (Get-Location).Path

# Unicode characters
$shower = [char]::ConvertFromUtf32(0x1F6BF)      # 🚿
$leaf = [char]::ConvertFromUtf32(0x1F33F)         # 🌿
$snow = [char]::ConvertFromUtf32(0x2744)          # ❄
$fe0f = [char]::ConvertFromUtf32(0xFE0F)          # variation selector
$sunrise = [char]::ConvertFromUtf32(0x1F305)      # 🌅
$sun = [char]::ConvertFromUtf32(0x2600)           # ☀
$moon = [char]::ConvertFromUtf32(0x1F319)         # 🌙
$coffee = [char]::ConvertFromUtf32(0x2615)        # ☕
$building = [char]::ConvertFromUtf32(0x1F3E2)     # 🏢
$door = [char]::ConvertFromUtf32(0x1F6AA)         # 🚪
$house = [char]::ConvertFromUtf32(0x1F3E0)        # 🏠
$house2 = [char]::ConvertFromUtf32(0x1F3E1)       # 🏡
$hostel = [char]::ConvertFromUtf32(0x1F392)       # 🎒
$pot = [char]::ConvertFromUtf32(0x1F372)          # 🍲
$egg = [char]::ConvertFromUtf32(0x1F373)          # 🍳
$noentry = [char]::ConvertFromUtf32(0x1F6AB)      # 🚫
$boy = [char]::ConvertFromUtf32(0x1F466)          # 👦
$girl = [char]::ConvertFromUtf32(0x1F467)         # 👧
$people = [char]::ConvertFromUtf32(0x1F465)       # 👥
$check = [char]::ConvertFromUtf32(0x2713)         # ✓
$cross = [char]::ConvertFromUtf32(0x2717)         # ✗
$check2 = [char]::ConvertFromUtf32(0x2705)        # ✅
$cross2 = [char]::ConvertFromUtf32(0x274C)        # ❌
$warn = [char]::ConvertFromUtf32(0x26A0)          # ⚠
$zap = [char]::ConvertFromUtf32(0x26A1)           # ⚡
$green = [char]::ConvertFromUtf32(0x1F7E2)        # 🟢
$red = [char]::ConvertFromUtf32(0x1F534)          # 🔴
$doc = [char]::ConvertFromUtf32(0x1F4C4)          # 📄
$cam = [char]::ConvertFromUtf32(0x1F4F7)          # 📷
$clip = [char]::ConvertFromUtf32(0x1F4CE)         # 📎
$hourglass = [char]::ConvertFromUtf32(0x23F3)     # ⏳
$plate = [char]::ConvertFromUtf32(0x1F37D)        # 🍽
$globe = [char]::ConvertFromUtf32(0x1F310)        # 🌐

# --- properties/[id]/page.tsx ---
Write-Host "`n=== properties/[id]/page.tsx ==="
$f = [System.IO.Path]::Combine($base, 'src', 'app', 'properties', '[id]', 'page.tsx')
Clean-FileByPath $f @(
    @{ Old = "$door Private Rented Room"; New = "Private Rented Room" },
    @{ Old = "$house2 Flat / Apartment"; New = "Flat / Apartment" },
    @{ Old = "$house Flat / Apartment"; New = "Flat / Apartment" },
    @{ Old = "$hostel Student Hostel"; New = "Student Hostel" },
    @{ Old = "$building PG Hostel"; New = "PG Hostel" },
    @{ Old = "$cross Fully occupied"; New = "Fully occupied" },
    @{ Old = "$shower Attached Bath"; New = "Attached Bath" },
    @{ Old = "$leaf Balcony"; New = "Balcony" },
    @{ Old = "$snow$fe0f AC"; New = "AC" },
    @{ Old = "$snow AC"; New = "AC" }
)

# --- admin/page.tsx ---
Write-Host "`n=== admin/page.tsx ==="
$f = [System.IO.Path]::Combine($base, 'src', 'app', 'admin', 'page.tsx')
Clean-FileByPath $f @(
    @{ Old = "$check Verified"; New = "Verified" },
    @{ Old = "$cross Pending Review"; New = "Pending Review" },
    @{ Old = "$cross Pending ID Verification"; New = "Pending ID Verification" },
    @{ Old = "$building "; New = "" },
    @{ Old = "emoji: ""$sunrise"""; New = "emoji: """"" },
    @{ Old = "emoji: ""$sun$fe0f"""; New = "emoji: """"" },
    @{ Old = "emoji: ""$sun"""; New = "emoji: """"" },
    @{ Old = "emoji: ""$moon"""; New = "emoji: """"" },
    @{ Old = "emoji: ""$coffee"""; New = "emoji: """"" },
    @{ Old = "$plate$fe0f Daily Dining"; New = "Daily Dining" },
    @{ Old = "$plate Daily Dining"; New = "Daily Dining" },
    @{ Old = "$shower Attached Bath"; New = "Attached Bath" },
    @{ Old = "$leaf Balcony"; New = "Balcony" },
    @{ Old = "$snow$fe0f AC"; New = "AC" },
    @{ Old = "$snow AC"; New = "AC" },
    @{ Old = "$check Verified"; New = "Verified" }
)

# --- dashboard/page.tsx ---
Write-Host "`n=== dashboard/page.tsx ==="
$f = [System.IO.Path]::Combine($base, 'src', 'app', 'dashboard', 'page.tsx')
Clean-FileByPath $f @(
    @{ Old = "Under Admin Review $hourglass"; New = "Under Admin Review" },
    @{ Old = "$check Verified & Active"; New = "Verified & Active" },
    @{ Old = "$cross Pending Approval"; New = "Pending Approval" },
    @{ Old = "$warn$fe0f Notice Period Active"; New = "Notice Period Active" },
    @{ Old = "$warn Notice Period Active"; New = "Notice Period Active" }
)

# --- owner/dashboard/page.tsx ---
Write-Host "`n=== owner/dashboard/page.tsx ==="
$f = [System.IO.Path]::Combine($base, 'src', 'app', 'owner', 'dashboard', 'page.tsx')
Clean-FileByPath $f @(
    @{ Old = "$building "; New = "" },
    @{ Old = "$zap$fe0f "; New = "" },
    @{ Old = "$zap "; New = "" }
)

# --- owner/properties/new/page.tsx ---
Write-Host "`n=== owner/properties/new/page.tsx ==="
$f = [System.IO.Path]::Combine($base, 'src', 'app', 'owner', 'properties', 'new', 'page.tsx')
Clean-FileByPath $f @(
    @{ Old = "$house Flat / Apartment"; New = "Flat / Apartment" },
    @{ Old = "$house2 Flat / Apartment"; New = "Flat / Apartment" },
    @{ Old = "$pot 3 Homestyle Meals"; New = "3 Homestyle Meals" },
    @{ Old = "$egg "; New = "" },
    @{ Old = "$noentry No Food"; New = "No Food" },
    @{ Old = "$coffee Breakfast Only"; New = "Breakfast Only" }
)

# --- register/page.tsx ---
Write-Host "`n=== register/page.tsx ==="
$f = [System.IO.Path]::Combine($base, 'src', 'app', 'register', 'page.tsx')
Clean-FileByPath $f @(
    @{ Old = "emoji: ""$sunrise"""; New = "emoji: """"" },
    @{ Old = "emoji: ""$sun$fe0f"""; New = "emoji: """"" },
    @{ Old = "emoji: ""$sun"""; New = "emoji: """"" },
    @{ Old = "emoji: ""$moon"""; New = "emoji: """"" },
    @{ Old = "emoji: ""$coffee"""; New = "emoji: """"" },
    @{ Old = "$shower Attached Bath"; New = "Attached Bath" },
    @{ Old = "$leaf Balcony"; New = "Balcony" },
    @{ Old = "$snow$fe0f AC"; New = "AC" },
    @{ Old = "$snow AC"; New = "AC" },
    @{ Old = "emoji: ""$shower"""; New = "emoji: """"" },
    @{ Old = "emoji: ""$leaf"""; New = "emoji: """"" },
    @{ Old = "emoji: ""$snow$fe0f"""; New = "emoji: """"" },
    @{ Old = "emoji: ""$snow"""; New = "emoji: """"" }
)

# --- staff/dashboard/page.tsx ---
Write-Host "`n=== staff/dashboard/page.tsx ==="
$f = [System.IO.Path]::Combine($base, 'src', 'app', 'staff', 'dashboard', 'page.tsx')
Clean-FileByPath $f @(
    @{ Old = "$warn$fe0f Notice Period Watchlist"; New = "Notice Period Watchlist" },
    @{ Old = "$warn Notice Period Watchlist"; New = "Notice Period Watchlist" },
    @{ Old = "$doc ID Proof:"; New = "ID Proof:" },
    @{ Old = "$cam Photo:"; New = "Photo:" },
    @{ Old = "Uploaded $check"; New = "Uploaded" },
    @{ Old = "(UIDAI) $check"; New = "(UIDAI)" }
)

# --- aapkapg/page.tsx ---
Write-Host "`n=== aapkapg/page.tsx ==="
$f = [System.IO.Path]::Combine($base, 'src', 'app', 'aapkapg', 'page.tsx')
Clean-FileByPath $f @(
    @{ Old = "$building "; New = "" },
    @{ Old = "$zap$fe0f "; New = "" },
    @{ Old = "$zap "; New = "" }
)

# --- ElectricitySplitModal.tsx ---
Write-Host "`n=== ElectricitySplitModal.tsx ==="
$f = [System.IO.Path]::Combine($base, 'src', 'components', 'owner', 'ElectricitySplitModal.tsx')
Clean-FileByPath $f @(
    @{ Old = "$zap$fe0f "; New = "" },
    @{ Old = "$zap "; New = "" },
    @{ Old = "$zap"; New = "" }
)

Write-Host "`nAll files processed!"

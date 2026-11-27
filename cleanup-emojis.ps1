# Comprehensive emoji cleanup script
# Uses .NET to handle Unicode properly

function Clean-File {
    param([string]$Path, [hashtable[]]$Replacements)
    
    $fullPath = Join-Path (Get-Location) $Path
    if (-not (Test-Path $fullPath)) {
        Write-Host "SKIP: $Path (not found)"
        return
    }
    
    $content = [System.IO.File]::ReadAllText($fullPath)
    $changed = $false
    
    foreach ($r in $Replacements) {
        $old = $r.Old
        $new = $r.New
        if ($content.Contains($old)) {
            $content = $content.Replace($old, $new)
            $changed = $true
            Write-Host "  Replaced: '$old' -> '$new'"
        }
    }
    
    if ($changed) {
        [System.IO.File]::WriteAllText($fullPath, $content)
        Write-Host "SAVED: $Path"
    } else {
        Write-Host "NO CHANGES: $Path"
    }
}

# --- BedSelector.tsx ---
Write-Host "`n=== BedSelector.tsx ==="
Clean-File "src\components\booking\BedSelector.tsx" @(
    @{ Old = "Selected $([char]::ConvertFromUtf32(0x2713))"; New = "Selected" },
    @{ Old = "$([char]::ConvertFromUtf32(0x25CF)) "; New = "" },  # ● 
    @{ Old = "$([char]::ConvertFromUtf32(0x2715)) "; New = "" }   # ✕ 
)

# --- properties/[id]/page.tsx ---
# (already cleaned property types, now do remaining)
Write-Host "`n=== properties/[id]/page.tsx ==="
Clean-File "src\app\properties\[id]\page.tsx" @(
    @{ Old = "$([char]::ConvertFromUtf32(0x2715)) Fully occupied"; New = "Fully occupied" }
)

# --- owner/dashboard/page.tsx ---
Write-Host "`n=== owner/dashboard/page.tsx ==="

$checkmark = [char]::ConvertFromUtf32(0x2713)  # ✓
$crossmark = [char]::ConvertFromUtf32(0x2717)   # ✗  
$hourglass = [char]::ConvertFromUtf32(0x231B)   # ⌛
$hourglassFlow = [char]::ConvertFromUtf32(0x23F3) # ⏳
$docEmoji = [char]::ConvertFromUtf32(0x1F4C4)   # 📄
$cameraEmoji = [char]::ConvertFromUtf32(0x1F4F7) # 📷
$clipEmoji = [char]::ConvertFromUtf32(0x1F4CE)  # 📎
$checkEmoji = [char]::ConvertFromUtf32(0x2705)  # ✅
$crossEmoji = [char]::ConvertFromUtf32(0x274C)  # ❌

Clean-File "src\app\owner\dashboard\page.tsx" @(
    @{ Old = "$checkmark KYC Approved"; New = "KYC Approved" },
    @{ Old = "$crossmark Docs Rejected"; New = "Docs Rejected" },
    @{ Old = "$hourglassFlow Pending Verification"; New = "Pending Verification" },
    @{ Old = "$docEmoji "; New = "" },
    @{ Old = "$cameraEmoji Photo: "; New = "Photo: " },
    @{ Old = "Uploaded $checkmark"; New = "Uploaded" },
    @{ Old = "$clipEmoji View ID Doc"; New = "View ID Doc" },
    @{ Old = "$clipEmoji ID Doc: Not uploaded"; New = "ID Doc: Not uploaded" },
    @{ Old = "$checkEmoji T&C Accepted"; New = "T&C Accepted" },
    @{ Old = "$crossEmoji T&C: Not Accepted"; New = "T&C: Not Accepted" },
    @{ Old = "Reminder sent $checkmark"; New = "Reminder sent" },
    @{ Old = "Tenant Save Karo"; New = "Save Tenant" }
)

# --- staff/dashboard/page.tsx ---
Write-Host "`n=== staff/dashboard/page.tsx ==="
Clean-File "src\app\staff\dashboard\page.tsx" @(
    @{ Old = "Bill sent $checkmark"; New = "Bill sent" },
    @{ Old = "KYC Approved $checkmark"; New = "KYC Approved" },
    @{ Old = "Tenant Save Karo"; New = "Save Tenant" }
)

# --- owner/properties/new/page.tsx ---
Write-Host "`n=== owner/properties/new/page.tsx ==="

$pgEmoji = [char]::ConvertFromUtf32(0x1F3E2)       # 🏢
$doorEmoji = [char]::ConvertFromUtf32(0x1F6AA)      # 🚪
$houseEmoji = [char]::ConvertFromUtf32(0x1F3E0)     # 🏠
$hostelEmoji = [char]::ConvertFromUtf32(0x1F392)     # 🎒
$boyEmoji = [char]::ConvertFromUtf32(0x1F466)        # 👦
$girlEmoji = [char]::ConvertFromUtf32(0x1F467)       # 👧
$peopleEmoji = [char]::ConvertFromUtf32(0x1F465)     # 👥
$potEmoji = [char]::ConvertFromUtf32(0x1F372)        # 🍲
$eggEmoji = [char]::ConvertFromUtf32(0x1F373)        # 🍳
$coffeeEmoji = [char]::ConvertFromUtf32(0x2615)      # ☕
$noEmoji = [char]::ConvertFromUtf32(0x1F6AB)         # 🚫

Clean-File "src\app\owner\properties\new\page.tsx" @(
    @{ Old = "$pgEmoji PG Hostels"; New = "PG Hostels" },
    @{ Old = "$pgEmoji PG Hostel"; New = "PG Hostel" },
    @{ Old = "$doorEmoji Private Rented Room"; New = "Private Rented Room" },
    @{ Old = "$houseEmoji Flat / Apartment"; New = "Flat / Apartment" },
    @{ Old = "$houseEmoji Flat"; New = "Flat" },
    @{ Old = "$hostelEmoji Student Hostel"; New = "Student Hostel" },
    @{ Old = "$boyEmoji Boys Only"; New = "Boys Only" },
    @{ Old = "$girlEmoji Girls Only"; New = "Girls Only" },
    @{ Old = "$peopleEmoji Co-living"; New = "Co-living" },
    @{ Old = "$potEmoji 3 Meals"; New = "3 Meals" },
    @{ Old = "$eggEmoji 2 Meals"; New = "2 Meals" },
    @{ Old = "$coffeeEmoji Breakfast Only"; New = "Breakfast Only" },
    @{ Old = "$noEmoji No Food"; New = "No Food" }
)

Write-Host "`nDone!"

#!/bin/bash
set -euo pipefail

# Theme Update Script v2.0 - With Custom File Protection
# Compatible with new content/ structure (Astro 5 Content Layer)

# ============================================================================
# CONFIGURATION
# ============================================================================

THEME_REPO_URL="https://github.com/piratewebsite/pirate"
BRANCH_OR_TAG="main"

# Files/directories that should NEVER be updated (user content/config)
PROTECTED_PATHS=(
    "content/*"                    # User content (new structure)
    "public/images/*"              # User images
    ".env"                         # Environment variables
    ".env.local"
    "netlify.toml"                 # Deployment config (may be customized)
)

# Files that can be customized - track changes and prompt before overwriting
CUSTOMIZABLE_FILES=(
    "src/site.config.ts"           # Site configuration
    "src/components/layout/Header.astro"  # Often customized
    "src/components/layout/Footer.astro"
    "src/styles/global.css"        # Custom styles
    "astro.config.ts"              # May have custom integrations
    "tailwind.config.ts"           # Custom theme colors
)

# Force update flag
FORCE_UPDATE=false
if [[ "${1:-}" == "--force" ]]; then
    FORCE_UPDATE=true
    echo "⚠️  FORCE UPDATE MODE - Will overwrite all customizable files"
fi

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log_info() {
    echo "✓ [UPDATE] $1"
}

log_warn() {
    echo "⚠️  [WARN] $1"
}

log_error() {
    echo "❌ [ERROR] $1"
}

# Check if file has local modifications
has_local_changes() {
    local file="$1"
    if [ ! -f "$file" ]; then
        return 1 # File doesn't exist, no changes
    fi
    
    # Compare with theme version using checksum
    if [ -f "tmp_theme/$file" ]; then
        local_hash=$(md5 -q "$file" 2>/dev/null || md5sum "$file" 2>/dev/null | awk '{print $1}')
        theme_hash=$(md5 -q "tmp_theme/$file" 2>/dev/null || md5sum "tmp_theme/$file" 2>/dev/null | awk '{print $1}')
        
        if [ "$local_hash" != "$theme_hash" ]; then
            return 0 # Has changes
        fi
    fi
    return 1 # No changes
}

# Prompt user for file update decision
prompt_update() {
    local file="$1"
    echo ""
    echo "📝 File has local modifications: $file"
    echo "   Options:"
    echo "   [k] Keep local version (skip update)"
    echo "   [u] Update from theme (overwrite local changes)"
    echo "   [d] Show diff"
    echo "   [b] Backup local and update"
    read -p "   Choose [k/u/d/b]: " choice
    
    case "$choice" in
        u|U)
            return 0 # Update
            ;;
        d|D)
            echo "--- Local version vs Theme version ---"
            diff "$file" "tmp_theme/$file" || true
            prompt_update "$file" # Ask again after showing diff
            ;;
        b|B)
            cp "$file" "${file}.backup-$(date +%Y%m%d-%H%M%S)"
            log_info "Backed up to ${file}.backup-$(date +%Y%m%d-%H%M%S)"
            return 0 # Update
            ;;
        *)
            return 1 # Keep local
            ;;
    esac
}

# Check if path is protected
is_protected() {
    local path="$1"
    for pattern in "${PROTECTED_PATHS[@]}"; do
        if [[ "$path" == $pattern ]]; then
            return 0
        fi
    done
    return 1
}

# ============================================================================
# MAIN UPDATE PROCESS
# ============================================================================

echo "================================================"
echo "  Pirate Theme Updater v2.0"
echo "================================================"
echo ""

# Validate we're in a Pirate project
if [ ! -f "package.json" ] || ! grep -q "pirate" package.json; then
    log_error "Not in a Pirate project directory"
    exit 1
fi

# Check for uncommitted changes
if command -v git >/dev/null 2>&1 && [ -d .git ]; then
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_warn "You have uncommitted changes. Consider committing first."
        read -p "Continue anyway? [y/N]: " continue
        if [[ ! "$continue" =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi
fi

# Clone theme repository
log_info "Fetching theme from $THEME_REPO_URL ($BRANCH_OR_TAG)"
rm -rf tmp_theme || true
git clone --branch "$BRANCH_OR_TAG" --depth 1 "$THEME_REPO_URL" tmp_theme

if [ ! -d tmp_theme ]; then
    log_error "Failed to clone theme repository"
    exit 1
fi

# Create update log
UPDATE_LOG="theme-update-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$UPDATE_LOG") 2>&1

echo ""
log_info "Update started at $(date)"
echo ""

# ============================================================================
# UPDATE SOURCE FILES (src/)
# ============================================================================

log_info "Updating src/ directory..."

SKIPPED_SRC_FILES=()
UPDATED_SRC_FILES=()

# Process each file in theme src/
find tmp_theme/src -type f | while read -r theme_file; do
    rel=${theme_file#tmp_theme/src/}
    local_file="src/$rel"
    
    # Skip content directory
    if [[ "$rel" == content/* ]]; then
        continue
    fi
    
    # Create directory if needed
    mkdir -p "$(dirname "$local_file")"
    
    # Check if local file exists and has modifications
    if [ -f "$local_file" ] && has_local_changes "$local_file"; then
        if [ "$FORCE_UPDATE" = true ]; then
            # Force mode: backup and update
            cp "$local_file" "${local_file}.backup-$(date +%Y%m%d-%H%M%S)"
            cp -f "$theme_file" "$local_file"
            echo "  ⚠️  Force updated: $rel (backup created)"
        else
            # Skip modified files by default to preserve local changes
            echo "  ⏭️  Skipped (modified): $rel"
            SKIPPED_SRC_FILES+=("$rel")
            continue
        fi
    else
        # No local changes or file doesn't exist, safe to update
        cp -f "$theme_file" "$local_file"
        UPDATED_SRC_FILES+=("$rel")
    fi
done

log_info "Source files processed (updated: ${#UPDATED_SRC_FILES[@]}, skipped: ${#SKIPPED_SRC_FILES[@]})"

# ============================================================================
# UPDATE ROOT CONFIGURATION FILES
# ============================================================================

echo ""
log_info "Checking root configuration files..."

ROOT_FILES=(
    "package.json"
    "tsconfig.json"
    "postcss.config.js"
    "README.md"
)

for file in "${ROOT_FILES[@]}"; do
    if [ -f "tmp_theme/$file" ]; then
        cp -f "tmp_theme/$file" "$file"
        log_info "Updated: $file"
    fi
done

# ============================================================================
# HANDLE CUSTOMIZABLE FILES
# ============================================================================

echo ""
log_info "Checking customizable files for local modifications..."

SKIPPED_FILES=()
UPDATED_FILES=()

for file in "${CUSTOMIZABLE_FILES[@]}"; do
    if [ ! -f "tmp_theme/$file" ]; then
        continue # Theme doesn't have this file
    fi
    
    if [ ! -f "$file" ]; then
        # File doesn't exist locally, copy from theme
        mkdir -p "$(dirname "$file")"
        cp -f "tmp_theme/$file" "$file"
        UPDATED_FILES+=("$file")
        log_info "Added new file: $file"
        continue
    fi
    
    # Check if file has local changes
    if has_local_changes "$file"; then
        if [ "$FORCE_UPDATE" = true ]; then
            # Force mode: backup and update
            cp "$file" "${file}.backup-$(date +%Y%m%d-%H%M%S)"
            cp -f "tmp_theme/$file" "$file"
            UPDATED_FILES+=("$file (forced)")
            log_warn "Force updated: $file (backup created)"
        else
            # Interactive mode: prompt user
            if prompt_update "$file"; then
                cp -f "tmp_theme/$file" "$file"
                UPDATED_FILES+=("$file")
                log_info "Updated: $file"
            else
                SKIPPED_FILES+=("$file")
                log_warn "Skipped: $file (keeping local version)"
            fi
        fi
    else
        # No local changes, safe to update
        cp -f "tmp_theme/$file" "$file"
        UPDATED_FILES+=("$file")
    fi
done

# ============================================================================
# UPDATE CONTENT CONFIG (src/content/config.ts)
# ============================================================================

echo ""
log_info "Updating content configuration..."

if [ -f "tmp_theme/src/content/config.ts" ]; then
    mkdir -p src/content
    
    if [ -f "src/content/config.ts" ] && has_local_changes "src/content/config.ts"; then
        log_warn "src/content/config.ts has local changes"
        
        if [ "$FORCE_UPDATE" = true ]; then
            cp "src/content/config.ts" "src/content/config.ts.backup-$(date +%Y%m%d-%H%M%S)"
            cp -f "tmp_theme/src/content/config.ts" "src/content/config.ts"
            log_warn "Force updated content config (backup created)"
        else
            if prompt_update "src/content/config.ts"; then
                cp -f "tmp_theme/src/content/config.ts" "src/content/config.ts"
                log_info "Updated content config"
            else
                log_warn "Kept local content config"
            fi
        fi
    else
        cp -f "tmp_theme/src/content/config.ts" "src/content/config.ts"
        log_info "Updated content config"
    fi
fi

# ============================================================================
# PRESERVE KEYSTATIC CLOUD PROJECT ID
# ============================================================================

echo ""
log_info "Updating keystatic.config.ts..."

# Capture a literal cloud project id (project: 'team/site') if the site has
# one. Match by content, never by line number — file layouts drift between
# theme versions, and grafting a fixed line corrupts the config.
OLD_PROJECT=""
if [ -f keystatic.config.ts ]; then
    OLD_PROJECT=$(grep -oE "project:[[:space:]]*['\"][^'\"]+['\"]" keystatic.config.ts | head -1 || true)
fi

# Update keystatic config
if [ -f tmp_theme/keystatic.config.ts ]; then
    cp -f tmp_theme/keystatic.config.ts keystatic.config.ts

    # Re-apply the site's project id (skip placeholders; configs that read
    # the id from an env var have no literal id and need nothing preserved)
    if [ -n "$OLD_PROJECT" ] && ! printf '%s' "$OLD_PROJECT" | grep -q placeholder; then
        OLD_PROJECT="$OLD_PROJECT" perl -pi -e \
            's/project:\s*([\x27"])[^\x27"]*\1/$ENV{OLD_PROJECT}/ && ($done=1) unless $done;' \
            keystatic.config.ts
        log_info "Preserved Keystatic project id ($OLD_PROJECT)"
    fi
fi

# ============================================================================
# CLEANUP
# ============================================================================

echo ""
log_info "Cleaning up..."
rm -rf tmp_theme

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "================================================"
echo "  Update Summary"
echo "================================================"
echo ""

if [ ${#UPDATED_FILES[@]} -gt 0 ]; then
    echo "✓ Updated files (${#UPDATED_FILES[@]}):"
    for file in "${UPDATED_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
fi

if [ ${#SKIPPED_FILES[@]} -gt 0 ]; then
    echo "⚠️  Skipped customizable files (${#SKIPPED_FILES[@]}):"
    for file in "${SKIPPED_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
fi

if [ ${#SKIPPED_SRC_FILES[@]} -gt 0 ]; then
    echo "⚠️  Skipped modified src/ files (${#SKIPPED_SRC_FILES[@]}):"
    for file in "${SKIPPED_SRC_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
    echo "💡 These files have local modifications and were preserved."
    echo "   Use --force flag to overwrite (backups will be created)."
    echo ""
fi

echo "📋 Full update log saved to: $UPDATE_LOG"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test the site: npm run dev"
echo "  3. Update dependencies: npm install"
echo ""

log_info "Theme update completed at $(date)"
echo ""

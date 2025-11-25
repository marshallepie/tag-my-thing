#!/bin/bash
# Git-based migration restore script
# Restores migrations from a backup branch

set -e  # Exit on any error

BACKUP_PREFIX="migrations-backup"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🔄 Git Migration Restore Tool"
echo "=============================="
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# List available backup branches
echo "📚 Available backup branches:"
BACKUP_BRANCHES=$(git branch -a | grep "$BACKUP_PREFIX" | sed 's/^[ *]*//' | sed 's/remotes\/origin\///' | sort -u)

if [ -z "$BACKUP_BRANCHES" ]; then
    echo "❌ No backup branches found with prefix: $BACKUP_PREFIX"
    echo "   Run ./scripts/git-backup-migrations.sh to create a backup first"
    exit 1
fi

# Display backup branches with numbers
i=1
declare -a branch_array
while IFS= read -r branch; do
    if [ ! -z "$branch" ]; then
        echo "   $i) $branch"
        branch_array[$i]="$branch"
        i=$((i+1))
    fi
done <<< "$BACKUP_BRANCHES"

echo ""
read -p "Select backup to restore (1-$((i-1)), or 0 to cancel): " -r selection

# Validate selection
if [[ ! "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 0 ] || [ "$selection" -ge "$i" ]; then
    echo "❌ Invalid selection. Exiting."
    exit 1
fi

if [ "$selection" -eq 0 ]; then
    echo "❌ Restore cancelled."
    exit 0
fi

# Get selected branch
SELECTED_BRANCH="${branch_array[$selection]}"
echo "✅ Selected backup: $SELECTED_BRANCH"
echo ""

# Warning about overwriting current migrations
echo "⚠️  WARNING: This will overwrite your current migrations!"
echo "   Current migration count: $(find supabase/migrations/ -name "*.sql" -type f | wc -l | tr -d ' ')"
echo "   Target branch: $SELECTED_BRANCH"
echo ""

read -p "Are you sure you want to restore from this backup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled."
    exit 0
fi

# Create safety backup of current state first
SAFETY_BACKUP="safety-backup-$(date +%Y%m%d-%H%M%S)"
echo "🛡️  Creating safety backup of current state: $SAFETY_BACKUP"
git checkout -b "$SAFETY_BACKUP"
git add supabase/migrations/ supabase/config.toml .env.* 2>/dev/null || true
git commit -m "Safety backup before restore from $SELECTED_BRANCH" || echo "   (no changes to backup)"
git checkout "$CURRENT_BRANCH"

# Restore migrations from backup branch
echo "🔄 Restoring migrations from backup branch..."

# Get the migration files from the backup branch
echo "📁 Extracting migration files from $SELECTED_BRANCH..."
git show "$SELECTED_BRANCH:supabase/migrations/" > /dev/null 2>&1 || {
    echo "❌ Error: Could not access migrations in backup branch"
    exit 1
}

# Clear current migrations directory
echo "🗑️  Clearing current migrations..."
rm -rf supabase/migrations/*.sql 2>/dev/null || true

# Restore migration files
echo "📥 Restoring migration files..."
git checkout "$SELECTED_BRANCH" -- supabase/migrations/

# Also restore config if it exists
git checkout "$SELECTED_BRANCH" -- supabase/config.toml 2>/dev/null || echo "   (config.toml not in backup)"

# Count restored files
RESTORED_COUNT=$(find supabase/migrations/ -name "*.sql" -type f | wc -l | tr -d ' ')

echo ""
echo "✅ Restore completed successfully!"
echo "=============================="
echo "Restored migration count: $RESTORED_COUNT"
echo "Safety backup created: $SAFETY_BACKUP"
echo ""
echo "📋 Next Steps:"
echo "   1. Review restored migrations: ls -la supabase/migrations/"
echo "   2. Test migrations: supabase db reset --linked"
echo "   3. If issues, restore safety backup:"
echo "      git checkout $SAFETY_BACKUP -- supabase/migrations/"
echo ""

echo "🔍 Restored migration files:"
ls -la supabase/migrations/ | grep "\.sql$" | awk '{print "   " $9}' || echo "   (none found)"
echo ""

echo "🎉 Migration restore complete!"
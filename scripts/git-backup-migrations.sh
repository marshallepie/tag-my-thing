#!/bin/bash
# Git-based migration backup script
# Creates a dedicated backup branch with timestamped commits

set -e  # Exit on any error

# Configuration
BACKUP_PREFIX="migrations-backup"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_BRANCH="${BACKUP_PREFIX}-${TIMESTAMP}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🔄 Git Migration Backup Tool"
echo "=============================="
echo "Current branch: $CURRENT_BRANCH"
echo "Backup branch: $BACKUP_BRANCH"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if there are any changes in migrations directory
if git diff --quiet supabase/migrations/ && git diff --cached --quiet supabase/migrations/; then
    echo "ℹ️  No changes detected in migrations directory"
else
    echo "⚠️  Uncommitted changes detected in migrations directory"
    echo "   These will be included in the backup"
fi

# Count migration files
MIGRATION_COUNT=$(find supabase/migrations/ -name "*.sql" -type f | wc -l | tr -d ' ')
echo "📊 Migration files to backup: $MIGRATION_COUNT"
echo ""

# Create backup branch
echo "🌿 Creating backup branch: $BACKUP_BRANCH"
git checkout -b "$BACKUP_BRANCH"

# Add all migration files and related config
echo "📁 Adding migration files to backup..."
git add supabase/migrations/
git add supabase/config.toml
git add .env.staging 2>/dev/null || echo "   (no .env.staging found)"
git add .env.example 2>/dev/null || echo "   (no .env.example found)"

# Create detailed commit message
COMMIT_MSG="Migration backup: $TIMESTAMP

Backup Details:
- Created: $(date)
- Migration count: $MIGRATION_COUNT  
- Source branch: $CURRENT_BRANCH
- Backup branch: $BACKUP_BRANCH

Migration files included:
$(find supabase/migrations/ -name "*.sql" -type f -exec basename {} \; | sort)

This is an automated backup for safe keeping."

# Commit the backup
echo "💾 Committing backup..."
git commit -m "$COMMIT_MSG" || {
    echo "ℹ️  No changes to commit (migrations already backed up)"
}

# Push backup branch to remote (optional)
read -p "🚀 Push backup branch to remote origin? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⬆️  Pushing backup branch to remote..."
    if git push origin "$BACKUP_BRANCH"; then
        echo "✅ Backup branch pushed to remote"
        REMOTE_URL="https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/tree/$BACKUP_BRANCH"
        echo "🔗 View backup online: $REMOTE_URL"
    else
        echo "⚠️  Failed to push to remote (continuing anyway)"
    fi
else
    echo "📍 Backup branch created locally only"
fi

# Return to original branch
echo "🔙 Returning to original branch: $CURRENT_BRANCH"
git checkout "$CURRENT_BRANCH"

echo ""
echo "✅ Migration backup completed successfully!"
echo "=============================="
echo "Backup branch: $BACKUP_BRANCH"
echo "Original branch: $CURRENT_BRANCH"
echo ""
echo "📋 Backup Commands:"
echo "   View backup:    git log $BACKUP_BRANCH --oneline"
echo "   Switch to backup: git checkout $BACKUP_BRANCH"  
echo "   Delete backup:  git branch -D $BACKUP_BRANCH"
echo "   List all backups: git branch | grep $BACKUP_PREFIX"
echo ""

# List recent backup branches
echo "📚 Recent backup branches:"
git branch | grep "$BACKUP_PREFIX" | tail -5 || echo "   (no previous backups found)"
echo ""

echo "🎉 Backup process complete!"
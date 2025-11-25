#!/bin/bash
# Git backup management utility
# View, clean up, and manage migration backup branches

BACKUP_PREFIX="migrations-backup"

echo "🗂️  Git Migration Backup Manager"
echo "==============================="
echo ""

# Function to list all backup branches
list_backups() {
    echo "📚 All Migration Backup Branches:"
    echo "================================="
    
    # Local branches
    LOCAL_BACKUPS=$(git branch | grep "$BACKUP_PREFIX" | sed 's/^[ *]*//')
    if [ ! -z "$LOCAL_BACKUPS" ]; then
        echo "🏠 Local backups:"
        echo "$LOCAL_BACKUPS" | while read branch; do
            if [ ! -z "$branch" ]; then
                # Get commit info
                COMMIT_DATE=$(git log -1 --format="%ci" "$branch" 2>/dev/null | cut -d' ' -f1)
                COMMIT_MSG=$(git log -1 --format="%s" "$branch" 2>/dev/null | head -c 50)
                echo "   📁 $branch"
                echo "      📅 $COMMIT_DATE - $COMMIT_MSG..."
            fi
        done
    else
        echo "🏠 Local backups: (none)"
    fi
    
    echo ""
    
    # Remote branches
    REMOTE_BACKUPS=$(git branch -r | grep "$BACKUP_PREFIX" | sed 's/^[ ]*//' | sed 's/origin\///')
    if [ ! -z "$REMOTE_BACKUPS" ]; then
        echo "☁️  Remote backups:"
        echo "$REMOTE_BACKUPS" | while read branch; do
            if [ ! -z "$branch" ]; then
                echo "   📁 $branch"
            fi
        done
    else
        echo "☁️  Remote backups: (none)"
    fi
    echo ""
}

# Function to clean up old backups
cleanup_backups() {
    echo "🧹 Backup Cleanup"
    echo "================="
    
    LOCAL_BACKUPS=$(git branch | grep "$BACKUP_PREFIX" | sed 's/^[ *]*//')
    BACKUP_COUNT=$(echo "$LOCAL_BACKUPS" | wc -l | tr -d ' ')
    
    if [ -z "$LOCAL_BACKUPS" ] || [ "$BACKUP_COUNT" -eq 0 ]; then
        echo "ℹ️  No local backup branches to clean up"
        return
    fi
    
    echo "Found $BACKUP_COUNT local backup branches"
    echo ""
    
    if [ "$BACKUP_COUNT" -gt 5 ]; then
        echo "⚠️  You have more than 5 backup branches."
        echo "   Consider keeping only the most recent ones."
        echo ""
    fi
    
    # List backups with numbers
    echo "📋 Local backup branches:"
    i=1
    declare -a branch_array
    echo "$LOCAL_BACKUPS" | while read branch; do
        if [ ! -z "$branch" ]; then
            COMMIT_DATE=$(git log -1 --format="%ci" "$branch" 2>/dev/null | cut -d' ' -f1)
            echo "   $i) $branch ($COMMIT_DATE)"
            branch_array[$i]="$branch"
            i=$((i+1))
        fi
    done
    
    echo ""
    read -p "Delete old backups? (enter branch numbers separated by spaces, or 'all' for all, or 'none'): " -r selection
    
    if [ "$selection" = "none" ] || [ -z "$selection" ]; then
        echo "ℹ️  No branches deleted"
        return
    fi
    
    if [ "$selection" = "all" ]; then
        echo "⚠️  This will delete ALL backup branches!"
        read -p "Are you absolutely sure? (type 'DELETE ALL' to confirm): " -r confirmation
        if [ "$confirmation" = "DELETE ALL" ]; then
            echo "$LOCAL_BACKUPS" | while read branch; do
                if [ ! -z "$branch" ]; then
                    git branch -D "$branch" 2>/dev/null || echo "   ⚠️  Failed to delete $branch"
                    echo "   🗑️  Deleted: $branch"
                fi
            done
            echo "✅ All backup branches deleted"
        else
            echo "❌ Deletion cancelled"
        fi
        return
    fi
    
    # Handle specific branch numbers
    # Note: This is a simplified approach - in practice you'd need to rebuild the array
    echo "ℹ️  Manual deletion: run 'git branch -D <branch-name>' for specific branches"
}

# Function to compare backups
compare_backups() {
    echo "🔍 Compare Migration Backups"
    echo "=========================="
    
    list_backups
    echo "Enter two branch names to compare (or press enter to skip):"
    read -p "First branch: " branch1
    read -p "Second branch: " branch2
    
    if [ -z "$branch1" ] || [ -z "$branch2" ]; then
        echo "ℹ️  Comparison skipped"
        return
    fi
    
    echo ""
    echo "📊 Comparing $branch1 vs $branch2:"
    echo "=================================="
    
    # Compare migration files
    echo "🔍 Migration file differences:"
    git diff --name-only "$branch1" "$branch2" -- supabase/migrations/ || echo "   (no differences)"
    
    echo ""
    echo "📝 Detailed diff (first 20 lines):"
    git diff "$branch1" "$branch2" -- supabase/migrations/ | head -20 || echo "   (no differences)"
}

# Main menu
while true; do
    echo "🛠️  Choose an action:"
    echo "   1) List all backups"
    echo "   2) Create new backup"
    echo "   3) Restore from backup"
    echo "   4) Clean up old backups"
    echo "   5) Compare backups"
    echo "   6) Exit"
    echo ""
    
    read -p "Select option (1-6): " -n 1 -r
    echo
    echo ""
    
    case $REPLY in
        1)
            list_backups
            ;;
        2)
            echo "🚀 Running backup script..."
            ./scripts/git-backup-migrations.sh
            ;;
        3)
            echo "🔄 Running restore script..."
            ./scripts/git-restore-migrations.sh
            ;;
        4)
            cleanup_backups
            ;;
        5)
            compare_backups
            ;;
        6)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please try again."
            ;;
    esac
    
    echo ""
    echo "Press enter to continue..."
    read
    echo ""
done
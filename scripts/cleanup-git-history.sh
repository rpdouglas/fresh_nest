#!/usr/bin/env bash
# ==============================================================================
# Fresh Nest Co. — Git History Secrets Excision Script
#
# This script uses git-filter-repo to excise the committed .env.production file
# from the repository's history, securing the environment.
# ==============================================================================

set -euo pipefail

echo "=== Fresh Nest Co. Secrets Excision Tool ==="

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "Error: git-filter-repo is not installed."
    echo "Please install it using your system's package manager, e.g.:"
    echo "  - macOS (Homebrew): brew install git-filter-repo"
    echo "  - Debian/Ubuntu: sudo apt-get install git-filter-repo"
    echo "  - Python: pip install git-filter-repo"
    exit 1
fi

# Confirm with user
read -p "Warning: This will rewrite git history. Ensure you have backed up your repo. Proceed? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Run git filter-repo to strip .env.production
echo "Excising .env.production from git history..."
git filter-repo --path .env.production --invert-paths --force

echo "Git history cleaned successfully!"
echo "Please force-push to your remote repository: git push origin main --force"
echo "Notify all developers to perform a fresh clone of the repository."

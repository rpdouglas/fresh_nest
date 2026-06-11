#!/usr/bin/env python3
import os
import sys
import argparse
from datetime import datetime

def parse_args():
    parser = argparse.ArgumentParser(
        description="Export codebase files to a single file (default: markdown) for LLM ingestion."
    )
    parser.add_argument(
        "-o", "--output", 
        default="codebase_export.md",
        help="Output file path (default: codebase_export.md)"
    )
    parser.add_argument(
        "--include-env",
        action="store_true",
        help="Include sensitive local environment files (e.g. .env.local, excluded by default)"
    )
    parser.add_argument(
        "--no-tree",
        action="store_true",
        help="Skip generating the ASCII directory tree"
    )
    parser.add_argument(
        "--custom-exclude-dirs",
        nargs="*",
        default=[],
        help="Additional directory names to exclude"
    )
    parser.add_argument(
        "--custom-exclude-exts",
        nargs="*",
        default=[],
        help="Additional file extensions to exclude (with dot, e.g. .svg)"
    )
    return parser.parse_args()

def get_md_language(filename):
    _, ext = os.path.splitext(filename.lower())
    mapping = {
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.js': 'javascript',
        '.jsx': 'jsx',
        '.json': 'json',
        '.html': 'html',
        '.css': 'css',
        '.md': 'markdown',
        '.py': 'python',
        '.sh': 'bash',
        '.yml': 'yaml',
        '.yaml': 'yaml',
        '.sql': 'sql',
        '.graphql': 'graphql',
        '.xml': 'xml',
        '.toml': 'toml',
        '.rules': 'javascript',
    }
    return mapping.get(ext, '')

def main():
    args = parse_args()
    root_dir = os.getcwd()
    output_file = os.path.abspath(args.output)
    
    # Define default excluded directories
    default_exclude_dirs = {
        'node_modules',
        '.git',
        'dist',
        'docs',
        '.firebase',
        'test-results',
        '.claude',
        '.gemini',
        '__pycache__',
        '.venv',
        'env',
        'tmp',
        'temp',
        'out',
        'build',
    }
    # Add custom directories
    for d in args.custom_exclude_dirs:
        default_exclude_dirs.add(d)
        
    # Function to check if directory should be excluded
    def should_exclude_dir(rel_path):
        parts = rel_path.split(os.sep)
        for part in parts:
            if part in default_exclude_dirs:
                return True
        # Special case: firebase functions build output 'lib'
        if rel_path == 'functions/lib' or rel_path.startswith('functions/lib' + os.sep):
            return True
        return False

    # Define default excluded extensions and files
    default_exclude_exts = {
        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', 
        '.pdf', '.zip', '.gz', '.tar', '.mp4', '.mp3', 
        '.wav', '.woff', '.woff2', '.eot', '.ttf', '.svg', 
        '.pyc', '.o', '.a', '.so', '.dylib', '.dll', '.exe',
        '.tsbuildinfo'
    }
    for ext in args.custom_exclude_exts:
        default_exclude_exts.add(ext.lower())

    default_exclude_files = {
        'package-lock.json',
        '.DS_Store',
        os.path.basename(output_file),
        'export_codebase.py'
    }
    
    # Handle environment files exclusion
    if not args.include_env:
        default_exclude_files.add('.env.local')
        default_exclude_files.add('.env.development.local')
        default_exclude_files.add('.env.test.local')
        default_exclude_files.add('.env.production.local')

    def should_exclude_file(filename, rel_path):
        if filename in default_exclude_files:
            return True
        _, ext = os.path.splitext(filename.lower())
        if ext in default_exclude_exts:
            return True
        return False

    # 1. Gather all files and calculate stats
    files_to_export = []
    skipped_dirs = set()
    skipped_files = set()
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        rel_dir = os.path.relpath(dirpath, root_dir)
        if rel_dir == '.':
            rel_dir_path = ''
        else:
            rel_dir_path = rel_dir
            
        # Prune excluded directories in-place so os.walk does not traverse them
        pruned_dirs = []
        for d in list(dirnames):
            d_rel = os.path.join(rel_dir_path, d) if rel_dir_path else d
            if should_exclude_dir(d_rel):
                skipped_dirs.add(d_rel)
                dirnames.remove(d)
            else:
                pruned_dirs.append(d)
                
        for f in filenames:
            f_rel = os.path.join(rel_dir_path, f) if rel_dir_path else f
            if should_exclude_file(f, f_rel):
                skipped_files.add(f_rel)
            else:
                files_to_export.append((f_rel, os.path.join(dirpath, f)))

    # Sort files by path for deterministic output
    files_to_export.sort(key=lambda x: x[0])
    
    # 2. Generate tree representation if requested
    tree_content = ""
    if not args.no_tree:
        def build_tree_lines(current_dir, prefix=""):
            lines = []
            try:
                entries = sorted(os.scandir(current_dir), key=lambda e: (not e.is_dir(), e.name.lower()))
            except Exception:
                return lines
            
            filtered_entries = []
            for entry in entries:
                rel_path = os.path.relpath(entry.path, root_dir)
                if entry.is_dir():
                    if should_exclude_dir(rel_path):
                        continue
                    filtered_entries.append(entry)
                else:
                    if should_exclude_file(entry.name, rel_path):
                        continue
                    filtered_entries.append(entry)
                    
            count = len(filtered_entries)
            for i, entry in enumerate(filtered_entries):
                is_last = (i == count - 1)
                connector = "└── " if is_last else "├── "
                lines.append(f"{prefix}{connector}{entry.name}")
                
                if entry.is_dir():
                    extension = "    " if is_last else "│   "
                    lines.extend(build_tree_lines(entry.path, prefix + extension))
            return lines

        tree_lines = build_tree_lines(root_dir)
        tree_content = "\n".join(tree_lines)

    # 3. Write output file
    project_name = os.path.basename(root_dir)
    total_files = len(files_to_export)
    
    print(f"Exporting codebase from: {root_dir}")
    print(f"Target export file: {output_file}")
    print(f"Files to export: {total_files}")
    print(f"Excluded folders: {', '.join(sorted(default_exclude_dirs))}")
    print(f"Skipped {len(skipped_files)} files based on extension/name exclusions.")
    
    try:
        with open(output_file, 'w', encoding='utf-8') as out:
            # Header
            out.write(f"# Codebase Export: {project_name}\n\n")
            out.write(f"Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC  \n")
            out.write(f"Total Files: {total_files}  \n\n")
            
            # Directory Tree
            if not args.no_tree:
                out.write("## Directory Structure\n\n")
                out.write("```\n")
                out.write(f".\n{tree_content}\n")
                out.write("```\n\n")
                out.write("---\n\n")
                
            # Files contents
            for i, (rel_path, abs_path) in enumerate(files_to_export, 1):
                print(f"[{i}/{total_files}] Writing {rel_path}...", end='\r')
                out.write(f"## File: {rel_path}\n\n")
                
                lang = get_md_language(rel_path)
                out.write(f"```{lang}\n")
                try:
                    with open(abs_path, 'r', encoding='utf-8', errors='replace') as f_in:
                        out.write(f_in.read())
                except Exception as e:
                    out.write(f"[ERROR: Could not read file content. Details: {e}]\n")
                out.write("\n```\n\n")
                
                if i < total_files:
                    out.write("---\n\n")
                    
            print(f"\nSuccessfully exported codebase to {output_file}")
            
    except Exception as e:
        print(f"\nFailed to write export file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

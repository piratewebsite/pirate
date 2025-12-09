# Content Restructure Guide - Moving to Astro 5 Content Layer API

## Overview
This guide documents the restructuring of content from `src/content/` to `content/` at the project root, using Astro 5's Content Layer API with glob loaders. This separates user content from theme code, making theme updates safer and easier.

## What Changed

### Before (Old Structure)
```
project/
├── src/
│   ├── content/          # ❌ User content mixed with theme code
│   │   ├── post/
│   │   ├── pages/
│   │   ├── siteSettings/
│   │   └── config.ts
│   ├── components/
│   ├── layouts/
│   └── pages/
├── public/
│   └── images/
└── keystatic.config.ts
```

### After (New Structure)
```
project/
├── content/              # ✅ User content separate at root
│   ├── post/
│   ├── pages/
│   ├── siteSettings/
│   └── [all other collections]
├── src/                  # ✅ Theme code only
│   ├── content/
│   │   └── config.ts     # Uses Content Layer API
│   ├── components/
│   ├── layouts/
│   └── pages/
├── public/
│   └── images/           # Images stay here
└── keystatic.config.ts
```

## Step-by-Step Migration Instructions

### Step 1: Move Content Directory
```bash
# Move src/content to content (at project root)
mv src/content content-new

# Recreate src/content for config.ts
mkdir -p src/content

# Rename to final location
mv content-new content
```

### Step 2: Update src/content/config.ts

Replace the entire file with Content Layer API glob loaders:

```typescript
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Keep your existing schemas (postSchema, etc.) OR use z.any() for flexibility

export const collections = {
  // Posts collection
  post: defineCollection({
    loader: glob({ pattern: '**/[^_]*.mdoc', base: './content/post' }),
    schema: postSchema, // or z.any()
  }),

  // Pages collection
  pages: defineCollection({
    loader: glob({ pattern: '**/*.mdoc', base: './content/pages' }),
    schema: z.any(), // Use z.any() for flexible schemas
  }),

  // Site Settings singleton
  siteSettings: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/siteSettings' }),
    schema: z.any(),
  }),

  // Form Settings singleton
  formSettings: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/formSettings' }),
    schema: z.any(),
  }),

  // Repeat for all collections: bio, socialLinks, resume, testimonials, 
  // faqs, pitches, CTAs, menuItems, footerMenuItems, home, contactPage,
  // photoSettings, pwaSettings, resumeSettings, language, styleapps, youtubeFeeds
};
```

**Key points:**
- Use `glob({ pattern: '**/*.mdoc', base: './content/COLLECTION_NAME' })` for content loaders
- Pattern `**/[^_]*.mdoc` excludes files starting with underscore
- Pattern `**/*.yaml` or `**/*.{json,yaml}` for data files
- Base path is relative to project root: `./content/COLLECTION_NAME`
- Use `z.any()` for schemas if you encounter validation issues (can refine later)

### Step 3: Update keystatic.config.ts Paths

Replace all paths from `src/content/` to `content/`:

```bash
# Automated replacement
sed -i '' "s|path: 'src/content/|path: 'content/|g" keystatic.config.ts

# Also update template path if present
# Change: template: 'src/content/post/configuring-pirate'
# To: template: 'content/post/configuring-pirate'
```

**Manual verification needed for:**
- `path:` properties in all collections
- `template:` property in posts collection
- Any hardcoded content paths in the config

### Step 4: Update Code References

**Change `post.slug` to `post.id`:**

With Content Layer API, the entry identifier changes from `slug` to `id`.

Find and replace in all files:
```typescript
// Before
href={`/posts/${post.slug}/`}

// After  
href={`/posts/${post.id}/`}
```

Common files to check:
- `src/components/blog/PostPreview.astro`
- `src/pages/posts/[slug].astro` (if exists)
- Any component that links to posts

### Step 5: Fix Keystatic Column Definitions

Array fields can't be displayed as columns. Remove them:

```typescript
// Before
columns: ['title', 'sticky', 'draft', 'publishDate', 'tags'],

// After
columns: ['title', 'sticky', 'draft', 'publishDate'],
```

### Step 6: Create Missing Collection Folders

Ensure all collections referenced in keystatic.config.ts have folders:

```bash
# Check navigation array in keystatic.config.ts for collection names
# Create any missing folders
mkdir -p content/youtubeFeeds
mkdir -p content/faqs
mkdir -p content/resume
# etc.
```

### Step 7: Clear Caches and Test

```bash
# Clear all Astro caches
rm -rf .astro .data node_modules/.astro

# Start dev server
npm run dev
```

## Troubleshooting

### Schema Validation Errors

If you see `data does not match collection schema` errors:

**Option 1: Use z.any() (Quick Fix)**
```typescript
const collectionSchema = z.any();
```

**Option 2: Make Fields Optional**
```typescript
const collectionSchema = z.object({
  title: z.string(),
  description: z.string().optional(), // Add .optional()
  // ...
}).passthrough(); // Allow additional fields
```

### "No files found" Warnings

These are normal if collections are empty. Create at least one file or ignore the warnings.

### TypeScript Errors After Migration

1. Check for `post.slug` → `post.id` changes
2. Verify all collections in keystatic.config.ts exist in src/content/config.ts
3. Remove array fields from `columns` arrays
4. Clear TypeScript cache: `rm -rf .astro`

## Benefits of This Structure

1. **Separation of Concerns**: User content (`content/`) separate from theme code (`src/`)
2. **Easier Theme Updates**: Can update theme files without touching user content
3. **Better Organization**: Users can easily find "their stuff" in `content/` folder
4. **Future-Proof**: Uses Astro 5's recommended Content Layer API
5. **Flexible**: Content can live anywhere, not just in `src/content/`

## Important Notes

- **Images stay in `public/images/`** - No changes needed to image paths
- **Keystatic can write anywhere** - The `path:` in keystatic.config.ts tells it where to save
- **Glob patterns are flexible** - Use `**/*.{json,yaml,mdoc}` to match multiple file types
- **Entry IDs**: With Content Layer, `entry.id` is the file path (without extension) relative to the collection base
- **Schemas are optional**: Use `z.any()` for maximum flexibility, refine schemas later if needed

## Validation Checklist

✅ Content moved from `src/content/` to `content/`  
✅ `src/content/config.ts` uses glob loaders with Content Layer API  
✅ All keystatic.config.ts paths updated to `content/`  
✅ Template path updated (if applicable)  
✅ Changed `post.slug` to `post.id` in code  
✅ Removed array fields from Keystatic columns  
✅ Created folders for all collections  
✅ Dev server starts without errors  
✅ Keystatic admin can read and write content  
✅ Site renders correctly with content from new location  

## Reference: Complete Collection List

Make sure all these have corresponding `defineCollection()` entries in `src/content/config.ts`:

- post
- pages
- siteSettings
- formSettings
- bio
- socialLinks
- resume
- testimonials
- faqs
- pitches
- CTAs
- menuItems
- footerMenuItems
- home
- contactPage
- photoSettings
- pwaSettings
- resumeSettings
- language
- styleapps
- youtubeFeeds
- photoUpload (if used)
- rss-feeds (if used)

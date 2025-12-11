# Supabase Storage Setup for Event Images

## Step 1: Create Storage Bucket

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name**: `event-images`
   - **Public bucket**: ✅ **Enable** (so images can be accessed via public URLs)
   - **File size limit**: 5 MB (or your preferred limit)
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp, image/gif`
6. Click **"Create bucket"**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies. **Use the template-based approach** for easier setup:

### Policy 1: Allow authenticated users to upload images

1. Go to **Storage** → **Policies** → Select `event-images` bucket
2. Click **"New Policy"**
3. Choose **"Create a policy from scratch"** or use template
4. Policy name: `Allow authenticated users to upload images`
5. Allowed operation: `INSERT`
6. Target roles: `authenticated`
7. Policy definition (USING expression):
   ```
   bucket_id = 'event-images'
   ```
8. Click **"Review"** → **"Save policy"**

**Alternative: Using SQL Editor**

If you prefer SQL, go to **SQL Editor** and run **ONE statement at a time**:

```sql
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');
```

### Policy 2: Allow public read access

1. Click **"New Policy"** → **"Create a policy from scratch"**
2. Policy name: `Allow public read access`
3. Allowed operation: `SELECT`
4. Target roles: `public` (or leave empty for all)
5. Policy definition (USING expression):
   ```
   bucket_id = 'event-images'
   ```
6. Click **"Review"** → **"Save policy"**

**Alternative: Using SQL Editor**

Run this in SQL Editor (separate from the INSERT policy):

```sql
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');
```

### Policy 3: Allow users to delete their own images (Optional)

1. Click **"New Policy"** → **"Create a policy from scratch"**
2. Policy name: `Allow users to delete own images`
3. Allowed operation: `DELETE`
4. Target roles: `authenticated`
5. Policy definition (USING expression):
   ```
   bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
6. Click **"Review"** → **"Save policy"**

**Alternative: Using SQL Editor**

Run this in SQL Editor (separate from the other policies):

```sql
CREATE POLICY "Allow users to delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Step 2b: Quick SQL Setup (Recommended)

**Easiest method:** Run these SQL statements **ONE AT A TIME** in the SQL Editor:

**Statement 1 - Upload Policy:**
```sql
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');
```

**Statement 2 - Read Policy:**
```sql
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');
```

**Statement 3 - Delete Policy (Optional):**
```sql
CREATE POLICY "Allow users to delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Important:** Run each statement separately. Don't copy all three at once.

## Step 3: Verify Setup

After setting up the bucket and policies:

1. Try uploading an image through the post form
2. Check the Storage → `event-images` bucket to see if the file appears
3. Verify the image URL is accessible in your browser

## Troubleshooting

### Images not uploading
- Check that the bucket name is exactly `event-images` (case-sensitive)
- Verify RLS policies are correctly set up
- Check browser console for error messages

### Images not displaying
- Ensure the bucket is set to **Public**
- Verify the public URL is being generated correctly
- Check that the image URL is accessible

### Permission errors
- Make sure users are authenticated before uploading
- Verify RLS policies allow the operations you need
- Check that the user has the correct role (organizer)

## Notes

- Images are stored in folders named by user ID: `{userId}/{timestamp}-{random}.{ext}`
- Maximum file size is 5MB (configurable in bucket settings)
- Supported formats: JPEG, JPG, PNG, WebP, GIF
- All images are publicly accessible once uploaded


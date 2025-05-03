// Script to set up storage policies for the Stride Well app
import { createClient } from '@supabase/supabase-js'

// Configure Supabase client
const setupStorage = async () => {
  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables')
    console.log('Please set these variables and try again:')
    console.log('SUPABASE_URL=your-supabase-url')
    console.log('SUPABASE_SERVICE_KEY=your-service-role-key')
    process.exit(1)
  }
  
  try {
    // Initialize Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('🚀 Starting storage setup...')
    
    // 1. Create profiles bucket if it doesn't exist
    console.log('Creating profiles bucket...')
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .createBucket('profiles', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      })
    
    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Profiles bucket already exists')
      } else {
        throw bucketError
      }
    } else {
      console.log('✅ Profiles bucket created')
    }
    
    // 2. Execute SQL to set up policies
    console.log('Setting up storage policies...')
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Allow public access to avatars
        CREATE POLICY IF NOT EXISTS "Avatars are publicly accessible"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'profiles');
        
        -- Allow authenticated users to upload avatars
        CREATE POLICY IF NOT EXISTS "Users can upload their own avatars"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'profiles' 
          AND auth.uid() IS NOT NULL
          AND (storage.foldername(name))[1] = 'avatars'
          AND position(auth.uid()::text in name) > 0
        );
        
        -- Allow users to update their own avatars
        CREATE POLICY IF NOT EXISTS "Users can update their own avatars"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'profiles'
          AND auth.uid() IS NOT NULL
          AND position(auth.uid()::text in name) > 0
        );
        
        -- Allow users to delete their own avatars
        CREATE POLICY IF NOT EXISTS "Users can delete their own avatars"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'profiles'
          AND auth.uid() IS NOT NULL
          AND position(auth.uid()::text in name) > 0
        );
        
        -- Update user profile schema to include avatar_url if not exists
        ALTER TABLE public.user_profiles
        ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        
        -- Add policy for user profiles to allow updates
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'user_profiles' 
            AND policyname = 'Users can update their own profile'
          ) THEN
            CREATE POLICY "Users can update their own profile"
            ON public.user_profiles
            FOR UPDATE
            USING (auth.uid() = id);
          END IF;
        END
        $$;
      `
    })
    
    if (policiesError) {
      throw policiesError
    }
    
    console.log('✅ Storage policies configured successfully!')
    console.log('\n✨ Setup complete! Users can now upload profile pictures.')
    
  } catch (error) {
    console.error('❌ Error setting up storage:', error)
    process.exit(1)
  }
}

// Run the setup
setupStorage()

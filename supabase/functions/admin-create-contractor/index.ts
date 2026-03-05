import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, companyName, password } = await req.json();

    if (!email || !companyName) {
      throw new Error('Email and company name are required');
    }

    console.log('Creating contractor account for:', { email, companyName });

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      userId = existingUser.id;
    } else {
      // Create the user account with a password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || 'TempPassword123!',
        email_confirm: true,
        user_metadata: {
          company_name: companyName,
          full_name: companyName,
        },
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      if (!newUser.user) {
        throw new Error('Failed to create user account');
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log('Created new user:', userId);
    }

    // Check if contractor role already exists
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'contractor')
      .maybeSingle();

    if (!existingRole) {
      // Assign contractor role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'contractor',
        });

      if (roleError) {
        console.error('Error assigning contractor role:', roleError);
        throw roleError;
      }
      console.log('Assigned contractor role to user');
    } else {
      console.log('User already has contractor role');
    }

    // Upsert the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: companyName,
        profile_completed: true,
      }, { onConflict: 'id' });

    if (profileError) {
      console.log('Profile upsert warning:', profileError);
    }

    // Link the API key to this contractor if one exists
    const { error: apiKeyError } = await supabaseAdmin
      .from('api_keys')
      .update({ contractor_id: userId })
      .eq('organization_name', companyName);

    if (apiKeyError) {
      console.log('API key link warning:', apiKeyError);
    }

    console.log('Contractor account creation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        isNewUser,
        message: isNewUser 
          ? `Contractor account created. Login with: ${email} / ${password || 'TempPassword123!'}`
          : 'User already existed, contractor role verified',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in admin-create-contractor function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create contractor account',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

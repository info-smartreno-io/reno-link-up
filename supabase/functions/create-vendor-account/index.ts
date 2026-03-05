import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { securityLogger } from '../_shared/securityLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CreateVendorAccountSchema = z.object({
  applicationId: z.string().uuid(),
  email: z.string().trim().email().max(255),
  companyName: z.string().trim().min(1).max(200),
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    let validatedData;
    try {
      validatedData = CreateVendorAccountSchema.parse(requestBody);
    } catch (validationError) {
      await securityLogger.logValidationError(
        req,
        'create-vendor-account',
        validationError
      );
      throw new Error('Invalid vendor account data');
    }
    
    const { applicationId, email, companyName } = validatedData;

    console.log('Creating vendor account for:', { applicationId, email, companyName });

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

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      userId = existingUser.id;
    } else {
      // Create the user account
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
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
      console.log('Created new user:', userId);
    }

    // Check if role already exists
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

    // Update the profile if it exists
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: companyName,
      })
      .eq('id', userId);

    if (profileError) {
      console.log('Profile update warning:', profileError);
    }

    // Send welcome email with magic link
    console.log('Invoking send-vendor-welcome-email function');
    const { error: emailError } = await supabaseAdmin.functions.invoke('send-vendor-welcome-email', {
      body: {
        email,
        companyName,
        userId,
      },
    });

    if (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't throw error, account was created successfully
    }

    console.log('Vendor account creation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        message: 'Vendor account created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in create-vendor-account function:', error);
    
    await securityLogger.logEdgeFunctionError(
      req,
      'create-vendor-account',
      error instanceof Error ? error : new Error('Failed to create vendor account')
    );
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create vendor account',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

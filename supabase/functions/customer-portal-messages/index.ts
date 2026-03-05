import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-portal-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const portalToken = req.headers.get('x-portal-token');
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');

    if (!portalToken) {
      return new Response(
        JSON.stringify({ error: 'Portal access token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token and check project access
    const { data: access, error: accessError } = await supabase
      .from('homeowner_portal_access')
      .select('*')
      .eq('access_token', portalToken)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (accessError || !access) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this project' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // Send new message
      const body = await req.json();
      const { message } = body;

      if (!message || message.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Message content required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert message into homeowner_messages table
      const { data: newMessage, error: insertError } = await supabase
        .from('homeowner_messages')
        .insert({
          project_id: projectId,
          sender_type: 'homeowner',
          sender_name: access.homeowner_name || access.homeowner_email,
          message: message.trim(),
          is_read: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error sending message:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to send message' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`New message sent for project: ${projectId}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: {
            id: newMessage.id,
            content: newMessage.message,
            sender_type: newMessage.sender_type,
            sender_name: newMessage.sender_name,
            created_at: newMessage.created_at,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET - Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('homeowner_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark messages from staff as read
    const unreadStaffMessageIds = messages
      ?.filter(m => m.sender_type !== 'homeowner' && !m.is_read)
      .map(m => m.id) || [];

    if (unreadStaffMessageIds.length > 0) {
      await supabase
        .from('homeowner_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadStaffMessageIds);
    }

    const formattedMessages = (messages || []).map(m => ({
      id: m.id,
      content: m.message,
      sender_type: m.sender_type,
      sender_name: m.sender_name,
      is_from_homeowner: m.sender_type === 'homeowner',
      created_at: m.created_at,
      is_read: m.is_read,
    }));

    console.log(`Returning ${formattedMessages.length} messages for project: ${projectId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        total_count: formattedMessages.length,
        unread_count: messages?.filter(m => m.sender_type !== 'homeowner' && !m.is_read).length || 0,
        messages: formattedMessages 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Customer portal messages error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

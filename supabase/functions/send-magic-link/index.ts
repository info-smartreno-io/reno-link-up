import React from 'https://esm.sh/react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'https://esm.sh/resend@4.0.0'
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22'
import { MagicLinkEmail } from './_templates/magic-link-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('MAGIC_LINK_HOOK_SECRET') as string

Deno.serve(async (req) => {
  console.log('Magic link email function triggered')
  
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  
  try {
    const wh = new Webhook(hookSecret)
    const {
      user,
      email_data: { token_hash, redirect_to },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
      }
      email_data: {
        token_hash: string
        redirect_to: string
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const magicLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=magiclink&redirect_to=${redirect_to}`

    console.log('Rendering magic link email template for:', user.email)

    const html = await renderAsync(
      React.createElement(MagicLinkEmail, {
        magicLink,
        email: user.email,
      })
    )

    console.log('Sending magic link email via Resend')

    const { data, error } = await resend.emails.send({
      from: 'SmartReno <noreply@smartreno.io>',
      to: [user.email],
      subject: 'Sign In to SmartReno - Magic Link',
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Magic link email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in send-magic-link function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

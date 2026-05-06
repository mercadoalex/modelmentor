#!/usr/bin/env node

/**
 * Admin Account Creation Script
 * Creates an admin account with a randomly generated strong password
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
  process.exit(1);
}

// Create Supabase admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generate a strong random password
function generateStrongPassword(length = 20) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + digits + symbols;
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function createAdminAccount() {
  const username = 'admin';
  const email = `${username}@miaoda.com`;
  const password = generateStrongPassword();

  console.log('Creating admin account...');
  console.log('Username:', username);
  console.log('Email:', email);

  try {
    // Step 1: Create the user account
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username
      }
    });

    if (signUpError) {
      console.error('Error creating user:', signUpError.message);
      process.exit(1);
    }

    console.log('✓ User account created');

    // Step 2: Update the profile to set role as admin
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating role:', updateError.message);
      process.exit(1);
    }

    console.log('✓ Role updated to admin');
    console.log('\n=== ADMIN CREDENTIALS ===');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('========================\n');
    console.log('⚠️  IMPORTANT: Save these credentials securely!');
    console.log('⚠️  The password will not be shown again.');

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

createAdminAccount();

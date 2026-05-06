import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jccryvhhtflojvclkpzt.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const username = 'admin';
const password = 'Admin@2026!SecurePass';

console.log('Creating admin account...');
console.log('Username:', username);
console.log('Password:', password);

const { data, error } = await supabase.auth.signUp({
  email: `${username}@miaoda.com`,
  password
});

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('✓ Account created successfully!');
  console.log('User ID:', data.user?.id);
  console.log('\nNow updating role to admin...');
  
  // Note: Role update needs to be done manually via Supabase dashboard
  // or using service role key
  console.log('\n⚠️  To make this user an admin, run this SQL in Supabase dashboard:');
  console.log(`UPDATE profiles SET role = 'admin' WHERE id = '${data.user?.id}';`);
}

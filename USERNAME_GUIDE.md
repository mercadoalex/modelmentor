# User Registration and Authentication System

## Overview
ModelMentor uses an email-based authentication system that collects comprehensive user information during registration, including email address, first name, last name, username, and password.

## Registration Requirements

### Required Information
When creating an account, you must provide:
1. **Email Address**: Your valid email address for account authentication
2. **First Name**: Your given name
3. **Last Name**: Your family name
4. **Username**: A unique username for your profile
5. **Password**: A secure password to protect your account

### Email Address
- Must be a valid email format (e.g., alex@example.com)
- Used for signing in to your account
- Must be unique (not already registered)

### Username Requirements
- **Allowed characters**: Letters (a-z, A-Z), numbers (0-9), and underscores (_)
- **Not allowed**: @ symbol, spaces, special characters
- **Must be unique**: No two users can have the same username
- **Examples**:
  - ✅ `mercadoalex`
  - ✅ `alex_mercado`
  - ✅ `student123`
  - ✅ `ml_learner_2024`
  - ❌ `mercadoalex@gmail.com` (contains @)
  - ❌ `alex mercado` (contains space)
  - ❌ `alex-mercado` (contains hyphen)

## Common Errors

### "Please enter a valid email address"
**Cause**: The email format is incorrect.

**Solution**: Ensure your email follows the format: username@domain.com
- Example: `alex@gmail.com`, `student@school.edu`

### "Username already taken"
**Cause**: Another user has already registered with that username.

**Solution**: Choose a different username. Try adding numbers or underscores:
- `alex` → `alex_2024` or `alex_ml`

### "Email already registered"
**Cause**: An account already exists with that email address.

**Solution**: Use the sign-in option instead, or use a different email address.

### "Username should not contain @ symbol"
**Cause**: You entered an email address in the username field.

**Solution**: Enter only a username (without @ or domain):
- Instead of: `alex@gmail.com`
- Use: `alex` or `alex_g`

### "Username can only contain letters, numbers, and underscores"
**Cause**: Your username contains special characters or spaces.

**Solution**: Remove special characters and spaces. Use underscores instead:
- Instead of: `alex-mercado` or `alex mercado`
- Use: `alex_mercado`

### "Please fill in all required fields"
**Cause**: One or more required fields are empty.

**Solution**: Complete all fields: email, first name, last name, username, and password.

## Registration Process

### Step 1: Enter Email Address
Provide your valid email address (e.g., alex@example.com).

### Step 2: Enter Your Name
- First Name: Your given name (e.g., Alex)
- Last Name: Your family name (e.g., Mercado)

### Step 3: Choose a Username
Pick a unique username following the format requirements above (e.g., alex_mercado).

### Step 4: Create a Password
Choose a secure password (minimum 6 characters recommended).

### Step 5: Agree to Terms
Check the box to agree to the User Agreement and Privacy Policy.

### Step 6: Sign Up
Click "Sign Up" to create your account.

## Sign In Process

### Use Your Email
When signing in, use the email address you registered with.

### Example
- **Registration**: 
  - Email: `alex@example.com`
  - First Name: `Alex`
  - Last Name: `Mercado`
  - Username: `alex_mercado`
  - Password: `********`
- **Sign In**: 
  - Email: `alex@example.com`
  - Password: `********`

## Benefits of This System

### Complete User Profiles
- Collects full name for personalized experience
- Email for account recovery and notifications
- Username for unique identity within the platform

### Professional
- Real email addresses for communication
- Proper name display in dashboards and reports
- Standard authentication practices

### Secure
- Uses Supabase authentication backend
- Passwords are securely hashed
- Session management handled automatically
- Email-based account recovery (future feature)

## Troubleshooting

### Forgot Email
Contact your teacher or administrator to retrieve your registered email address.

### Forgot Password
Currently, password reset requires administrator assistance. Contact your teacher.
(Password recovery via email is planned for a future release)

### Username Already Taken
Choose a different username. Try adding numbers or underscores:
- `alex` → `alex_2024` or `alex_ml`

### Email Already Registered
If you already have an account, use the "Sign In" option instead of "Sign Up".

### Can't Sign In
- Verify you're using your email address, not your username
- Check that your email is spelled correctly
- Ensure caps lock is off (passwords are case-sensitive)
- Try resetting your password through your teacher

## For Teachers

### Creating Student Accounts
When helping students register, ensure they:
- Use their real email addresses (school or personal)
- Enter their full legal names (first and last)
- Choose appropriate usernames following the format rules
- Create secure passwords

### Username Conventions
Suggest consistent naming conventions for your class:
- `firstname_lastname` (e.g., `alex_mercado`)
- `lastname_firstname` (e.g., `mercado_alex`)
- `student_id_number` (e.g., `student_12345`)

### Managing Student Information
- Keep a record of student emails and usernames for easy reference
- Assist with password reset requests
- Monitor for duplicate username issues during registration

### Viewing Student Names
- Student first and last names appear in the teacher dashboard
- Reports include full student names for easy identification
- Badge achievements display student names

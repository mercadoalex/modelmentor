# Password Reset System

## Overview
ModelMentor implements a secure password reset functionality allowing users to recover their accounts when they forget their passwords. The system uses email-based verification with time-limited tokens to ensure security while providing a smooth user experience.

## How It Works

### Password Reset Flow
1. User clicks "Forgot password?" link on login page
2. User enters their email address on forgot password page
3. System sends password reset email with secure link
4. User clicks the link in their email
5. User is directed to reset password page
6. User enters and confirms new password
7. System updates password and redirects to login
8. User can sign in with new password

### Security Features
- **Time-Limited Tokens**: Reset links expire after 1 hour
- **Single-Use Tokens**: Each token can only be used once
- **Secure Token Generation**: Cryptographically secure tokens
- **Email Enumeration Prevention**: Generic success messages
- **Password Validation**: Minimum strength requirements

## User Experience

### Forgot Password Page (`/forgot-password`)
**Purpose**: Allow users to request a password reset link

**Features**:
- Simple email input form
- Email format validation
- Clear instructions
- Loading state during email sending
- Success confirmation with instructions
- Back to login button

**After Submission**:
- Success message displayed regardless of email existence (prevents enumeration)
- Instructions to check inbox and spam folder
- Option to send another email
- Note about 1-hour expiration

### Reset Password Page (`/reset-password`)
**Purpose**: Allow users to set a new password using reset token

**Features**:
- Token validation on page load
- New password input with show/hide toggle
- Confirm password input with show/hide toggle
- Real-time password match validation
- Password strength requirements display
- Loading state during password update
- Success message with auto-redirect

**States**:
1. **Loading**: Validating token
2. **Invalid Token**: Shows error with option to request new link
3. **Valid Token**: Shows password reset form
4. **Success**: Shows success message and redirects to login

### Password Reset Email
The email contains:
- Clear subject line: "Reset Your Password"
- Explanation of why they received the email
- Prominent reset password button/link
- Link expiration notice (1 hour)
- Security notice (didn't request? ignore email)
- Sender: ModelMentor (via Supabase)

## Pages

### Forgot Password Page
**Route**: `/forgot-password`

**UI Elements**:
- Mail icon (16x16, primary color)
- Title: "Forgot Password?"
- Description: Instructions for password reset
- Email input field with validation
- "Send Reset Link" button with loading state
- "Back to Login" button

**Validation**:
- Email field required
- Email format validation using regex
- Error messages for invalid input

**Success State**:
- Checkmark icon (16x16, green)
- Title: "Check Your Email"
- User's email address displayed
- Instructions for next steps
- Troubleshooting tips
- "Send Another Email" button
- "Back to Login" button

### Reset Password Page
**Route**: `/reset-password`

**UI Elements**:
- Lock icon (16x16, primary color)
- Title: "Reset Your Password"
- Description: Password requirements explanation
- New password input with show/hide toggle
- Confirm password input with show/hide toggle
- Password strength meter with visual indicators
- Real-time match validation
- "Reset Password" button with loading state

**Password Strength Meter**:
- Progress bar showing strength (0-100%)
- Color-coded indicator (red/yellow/green)
- Text label (Weak/Medium/Strong)
- Criteria checklist with checkmarks:
  * At least 8 characters
  * Contains uppercase letter
  * Contains lowercase letter
  * Contains number
  * Contains special character
- Updates in real-time as user types

**Validation**:
- Both fields required
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Must contain special character
- Passwords must match
- Real-time feedback for mismatches

**Error State** (Invalid/Expired Token):
- X icon (16x16, red)
- Title: "Invalid or Expired Link"
- Explanation of expiration (1 hour)
- "Request New Reset Link" button
- "Back to Login" button

**Success State**:
- Checkmark icon (16x16, green)
- Title: "Password Reset Successful!"
- Confirmation message
- "Go to Login" button
- Auto-redirect after 3 seconds

## Technical Implementation

### Request Password Reset

#### Frontend (ForgotPasswordPage)
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

#### Parameters
- `email`: User's email address
- `redirectTo`: URL to redirect after clicking email link

#### Response
- Success: No error, email sent
- Error: Error message (e.g., rate limit exceeded)

### Reset Password

#### Frontend (ResetPasswordPage)
```typescript
// Check for valid session (from email link)
const { data: { session } } = await supabase.auth.getSession();

// Update password
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

#### Token Validation
- Supabase automatically validates token when user clicks email link
- Valid token creates temporary session
- Session presence indicates valid token
- No session means invalid or expired token

#### Password Update
- Uses `updateUser()` method
- Requires active session (from reset link)
- Automatically invalidates reset token after use

### Email Configuration
Password reset emails are sent through Supabase Auth:
- Uses same email service as verification emails
- Template can be customized in Supabase dashboard
- Default template includes reset link and instructions
- Emails sent immediately upon request

### Security Measures

#### Token Expiration
- Reset tokens expire after 1 hour
- Configurable in Supabase Auth settings
- Expired tokens show clear error message

#### Single-Use Tokens
- Each token can only be used once
- Token invalidated after successful password reset
- Prevents token reuse attacks

#### Email Enumeration Prevention
- Generic success message for all email submissions
- Doesn't reveal if email exists in system
- Prevents account discovery attacks

#### Rate Limiting
- Supabase applies rate limiting to reset requests
- Prevents abuse and spam
- Error message if limit exceeded

## Password Requirements

### Minimum Requirements
- At least 8 characters long
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

### Password Strength Levels
- **Weak (Red)**: Password meets fewer than 3 requirements
- **Medium (Yellow/Orange)**: Password meets 3-4 requirements
- **Strong (Green)**: Password meets all 5 requirements

### Validation
- Client-side validation before submission
- Server-side validation by Supabase
- Clear error messages for invalid passwords
- Real-time strength feedback as user types

### Password Strength Meter
Visual indicator showing password quality:
- **Progress Bar**: Fills from 0% to 100% based on criteria met
- **Color Coding**: Red (weak), yellow/orange (medium), green (strong)
- **Text Label**: Displays "Weak", "Medium", or "Strong"
- **Criteria Checklist**: Shows which requirements are met with checkmarks
- **Real-time Updates**: Updates instantly as user types

## User Interface Design

### Design Principles
Following the Minimal aesthetic template:
- Ample whitespace for clarity
- Clear visual hierarchy with font sizes
- Gentle contrast and readable typefaces
- Minimal shadows and decorative elements
- Focus on functionality and usability

### Visual Feedback
- **Loading**: Animated spinner with "Sending..." or "Resetting Password..."
- **Success**: Green checkmark with confirmation message
- **Error**: Red X with clear error explanation
- **Validation**: Real-time feedback for password match

### Button States
- **Normal**: Full color, clickable
- **Loading**: Spinner icon, disabled
- **Disabled**: Muted colors, not clickable (when passwords don't match)

### Show/Hide Password
- Eye icon to show password
- Eye-off icon to hide password
- Toggle for both password fields
- Positioned at right side of input

## Error Handling

### Common Errors

#### "Please enter a valid email address"
**Cause**: Invalid email format

**Solution**: Enter email in correct format (user@domain.com)

#### "Invalid or Expired Link"
**Cause**: Reset link expired (>1 hour) or invalid token

**Solution**: Click "Request New Reset Link" button

#### "Password must be at least 6 characters long"
**Cause**: New password too short

**Solution**: Enter password with 8+ characters (requirement updated to 8)

#### "Password must contain at least one uppercase letter"
**Cause**: Password missing uppercase letter

**Solution**: Add at least one uppercase letter (A-Z)

#### "Password must contain at least one lowercase letter"
**Cause**: Password missing lowercase letter

**Solution**: Add at least one lowercase letter (a-z)

#### "Password must contain at least one number"
**Cause**: Password missing number

**Solution**: Add at least one number (0-9)

#### "Password must contain at least one special character"
**Cause**: Password missing special character

**Solution**: Add at least one special character (!@#$%^&* etc.)

#### "Passwords do not match"
**Cause**: Password and confirm password fields don't match

**Solution**: Ensure both fields contain identical passwords

#### "Failed to send password reset email"
**Cause**: Network error or email service issue

**Solution**: Try again or contact support

#### "Failed to reset password"
**Cause**: Network error or invalid session

**Solution**: Request new reset link and try again

### Error Messages
All error messages are:
- User-friendly and non-technical
- Actionable with clear next steps
- Displayed prominently with toast notifications
- Accompanied by visual indicators (red text, icons)

## Integration with Login Page

### Forgot Password Link
- Located next to "Password" label on login form
- Only visible in login mode (not sign-up)
- Styled as text link with primary color
- Hover effect: underline
- Navigates to `/forgot-password`

### User Flow
1. User attempts to sign in
2. Realizes they forgot password
3. Clicks "Forgot password?" link
4. Redirected to forgot password page
5. Completes reset process
6. Returns to login page
7. Signs in with new password

## Security Best Practices

### For Users
- Use strong, unique passwords
- Don't share reset links
- Complete reset process promptly (within 1 hour)
- Verify email sender before clicking links
- Contact support if suspicious activity

### For System
- Time-limited tokens (1 hour)
- Single-use tokens
- Secure token generation
- Email enumeration prevention
- Rate limiting on requests
- Logging of all reset attempts

## Monitoring and Logging

### Tracked Events
- Password reset requests (timestamp, email)
- Password reset completions (timestamp, user ID)
- Failed reset attempts (invalid tokens, expired tokens)
- Email delivery status

### Security Monitoring
- Multiple failed attempts from same IP
- Unusual patterns in reset requests
- Token reuse attempts
- Expired token access attempts

## Testing Checklist

### Request Flow
- [ ] Forgot password link visible on login page
- [ ] Email input validates format correctly
- [ ] Submit button shows loading state
- [ ] Success message displays after submission
- [ ] Email is received in inbox
- [ ] Email contains valid reset link
- [ ] Generic message shown for non-existent emails

### Reset Flow
- [ ] Clicking email link opens reset page
- [ ] Token validation works correctly
- [ ] Invalid token shows error message
- [ ] Expired token shows error message
- [ ] Password fields accept input
- [ ] Show/hide password toggles work
- [ ] Password strength meter displays correctly
- [ ] Strength meter updates in real-time as user types
- [ ] Strength meter shows red for weak passwords (<3 criteria)
- [ ] Strength meter shows yellow/orange for medium passwords (3-4 criteria)
- [ ] Strength meter shows green for strong passwords (all 5 criteria)
- [ ] Criteria checklist shows checkmarks for met requirements
- [ ] Criteria checklist shows X for unmet requirements
- [ ] Progress bar fills correctly based on criteria met
- [ ] Password match validation works
- [ ] All password strength validations work (length, uppercase, lowercase, number, special)
- [ ] Submit button disabled when passwords don't match
- [ ] Submit button disabled when password doesn't meet requirements
- [ ] Success message shows after reset
- [ ] Auto-redirect to login works
- [ ] Can sign in with new password

### Error Handling
- [ ] Invalid email format shows error
- [ ] Network errors handled gracefully
- [ ] Expired tokens show appropriate message
- [ ] Invalid tokens show appropriate message
- [ ] Password validation errors display correctly
- [ ] Each password requirement shows specific error message

### Security
- [ ] Tokens expire after 1 hour
- [ ] Tokens can only be used once
- [ ] Email enumeration prevented
- [ ] Rate limiting works
- [ ] All attempts logged
- [ ] Strong password requirements enforced

## Troubleshooting

### Email Not Received
1. Check spam/junk folder
2. Verify email address is correct
3. Wait a few minutes for delivery
4. Try requesting another reset link
5. Check email provider isn't blocking Supabase

### Reset Link Not Working
1. Check if link expired (>1 hour old)
2. Ensure link wasn't modified or broken
3. Try copying full URL into browser
4. Request new reset link
5. Try different browser or device

### Can't Set New Password
1. Ensure password is at least 6 characters
2. Verify passwords match exactly
3. Check for network connectivity
4. Try clearing browser cache
5. Request new reset link

### Still Can't Sign In
1. Verify password was successfully reset
2. Check for typos in email or password
3. Ensure caps lock is off
4. Try password reset again
5. Contact support for assistance

## Future Enhancements

### Planned Features
- Password strength meter with visual indicator
- Password history (prevent reuse of recent passwords)
- Multi-factor authentication option
- Account recovery via security questions
- Email notification when password is changed
- Custom email templates with branding

### Considerations
- Track password reset frequency per user
- Implement additional security for frequent resets
- Add CAPTCHA for reset requests
- Support for SMS-based password reset
- Integration with password managers

## Best Practices

### For Users
- Reset password immediately if forgotten
- Use unique password for ModelMentor
- Don't reuse passwords from other sites
- Complete reset within 1 hour
- Keep email account secure

### For Administrators
- Monitor reset request patterns
- Investigate suspicious activity
- Ensure email delivery is working
- Keep Supabase configuration updated
- Review security logs regularly

### For Teachers
- Help students with password resets
- Verify student email addresses are correct
- Remind students to check spam folders
- Assist with troubleshooting
- Report persistent issues to administrators

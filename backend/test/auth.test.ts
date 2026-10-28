import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { AuthController } from '../src/features/auth/auth.controller.js';

const USERS_FILE = path.resolve(process.cwd(), 'data/users.json');

console.log('================================================================');
console.log('🧪 TRAVEL BUDDY AUTHENTICATION, OTP & DATABASE PERSISTENCE SUITE');
console.log('================================================================');

function createMockRes() {
  const result = {
    statusCode: 0,
    data: null as any
  };
  const res = {
    status: (s: number) => {
      result.statusCode = s;
      return {
        json: (d: any) => {
          result.data = d;
        }
      };
    }
  } as any;
  return { res, result };
}

async function runAuthTests() {
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testUsername = `explorer_${uniqueSuffix}`;
  const testEmail = `explorer_${uniqueSuffix}@travelworld.com`;

  // Test 1: Check Availability with existing username
  console.log('\n--- TEST GROUP 1: Duplicate Credential Checks ---');
  {
    const { res, result } = createMockRes();
    await AuthController.checkAvailability({ body: { username: 'aisha_dubai' } } as any, res);
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.available, false, 'Existing username should be reported as unavailable');
    assert.ok(result.data.message.includes('already taken'), 'Message should instruct user that username is taken');
    console.log('✅ [PASS] Existing username "aisha_dubai" correctly blocked');
  }

  // Test 2: Check Availability with existing email
  {
    const { res, result } = createMockRes();
    await AuthController.checkAvailability({ body: { email: 'aisha@travelbuddy.com' } } as any, res);
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.available, false, 'Existing email should be reported as unavailable');
    console.log('✅ [PASS] Existing email "aisha@travelbuddy.com" correctly blocked');
  }

  // Test 3: Check Availability with new unique username
  {
    const { res, result } = createMockRes();
    await AuthController.checkAvailability({ body: { username: testUsername } } as any, res);
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.available, true, 'Unique username should be available');
    console.log(`✅ [PASS] Unique username "${testUsername}" is available`);
  }

  // Test 4: Dispatch OTP to Email
  console.log('\n--- TEST GROUP 2: OTP Dispatch & Verification ---');
  let generatedEmailOtp = '';
  {
    const { res, result } = createMockRes();
    await AuthController.sendOtp({
      body: { target: testEmail, channel: 'email', type: 'REGISTRATION' }
    } as any, res);
    assert.equal(result.statusCode, 200);
    assert.ok(result.data.otpPreview, 'OTP code should be generated and returned in preview');
    generatedEmailOtp = result.data.otpPreview;
    console.log(`✅ [PASS] OTP sent to email (${testEmail}): ${generatedEmailOtp}`);
  }

  // Test 5: Verify OTP
  {
    const { res, result } = createMockRes();
    await AuthController.verifyOtp({
      body: { target: testEmail, otp: generatedEmailOtp }
    } as any, res);
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.verified, true);
    console.log('✅ [PASS] OTP successfully verified');
  }

  // Test 6: Registration with verified OTP & Storage in Database
  console.log('\n--- TEST GROUP 3: Registration & Database Storage ---');
  {
    const { res, result } = createMockRes();
    await AuthController.register({
      body: {
        username: testUsername,
        name: 'Rahul Varma',
        email: testEmail,
        password: 'Password@123'
      }
    } as any, res);
    assert.equal(result.statusCode, 201);
    assert.ok(result.data.token, 'Registration should return authentication token');
    assert.equal(result.data.user.username, testUsername);
    assert.equal(result.data.storedInDatabase, true, 'Response should confirm storage in database');
    console.log(`✅ [PASS] New user "${testUsername}" successfully registered and stored in database`);
  }

  // Test 7: Verify persistence in database file
  {
    assert.ok(fs.existsSync(USERS_FILE), 'Database file must exist on disk');
    const fileContent = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    const savedInFile = fileContent.some((u: any) => u.username === testUsername);
    assert.ok(savedInFile, 'User must be permanently stored in database file on disk');
    console.log(`✅ [PASS] Verified user "${testUsername}" successfully persisted in database file: ${USERS_FILE}`);
  }

  // Test 8: Registration rejected for duplicate username
  {
    const { res, result } = createMockRes();
    await AuthController.register({
      body: {
        username: testUsername,
        email: `another_${uniqueSuffix}@email.com`,
        password: 'Password@123'
      }
    } as any, res);
    assert.equal(result.statusCode, 400);
    assert.equal(result.data.field, 'username');
    console.log('✅ [PASS] Duplicate username registration rejected by database');
  }

  // Test 9: Login with created user
  {
    const { res, result } = createMockRes();
    await AuthController.login({
      body: { username: testUsername, password: 'Password@123' }
    } as any, res);
    assert.equal(result.statusCode, 200);
    assert.ok(result.data.token, 'Login should return authentication token');
    assert.equal(result.data.user.name, 'Rahul Varma');
    console.log('✅ [PASS] User login with username and password successful from database');
  }

  // Test 10: Forgot Password flow
  console.log('\n--- TEST GROUP 4: Forgot Password Flow & Database Update ---');
  let resetOtp = '';
  {
    const { res, result } = createMockRes();
    await AuthController.requestPasswordReset({
      body: { identifier: testUsername }
    } as any, res);
    assert.equal(result.statusCode, 200);
    assert.ok(result.data.otpPreview, 'Password reset OTP generated');
    resetOtp = result.data.otpPreview;
    console.log(`✅ [PASS] Password reset OTP requested for "${testUsername}": ${resetOtp}`);
  }

  // Test 11: Reset Password with OTP
  {
    const { res, result } = createMockRes();
    await AuthController.resetPassword({
      body: {
        target: testEmail,
        otp: resetOtp,
        newPassword: 'BrandNewPassword@456'
      }
    } as any, res);
    assert.equal(result.statusCode, 200);
    assert.ok(result.data.success);
    console.log('✅ [PASS] Password successfully updated in database');
  }

  // Test 12: Login with new password
  {
    const { res, result } = createMockRes();
    await AuthController.login({
      body: { username: testUsername, password: 'BrandNewPassword@456' }
    } as any, res);
    assert.equal(result.statusCode, 200);
    assert.ok(result.data.token);
    console.log('✅ [PASS] Successfully logged in with newly reset password');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 12 TESTS PASSED! DATA CONFIRMED STORED IN DATABASE!');
  console.log('================================================================');
}

runAuthTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

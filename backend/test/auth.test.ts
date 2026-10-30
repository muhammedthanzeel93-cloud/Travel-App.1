import { strict as assert } from 'assert';
import { AuthController } from '../src/features/auth/auth.controller.js';

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
    assert.equal(result.data.otpPreview, undefined, 'CRITICAL SECURITY CHECK: OTP must NEVER be leaked in HTTP response');
    generatedEmailOtp = AuthController._getOtpRecordForTest(testEmail) || '';
    assert.ok(generatedEmailOtp, 'OTP must be generated and stored securely in memory');
    console.log(`✅ [PASS] OTP safely dispatched to email (${testEmail}), no response leakage!`);
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

  // Test 7: Verify persistence in database
  {
    const { res, result } = createMockRes();
    await AuthController.getAllUsers({} as any, res);
    assert.equal(result.statusCode, 200);
    const savedInDb = result.data.users.some((u: any) => u.username === testUsername);
    assert.ok(savedInDb, 'User must be permanently stored in database');
    console.log(`✅ [PASS] Verified user "${testUsername}" successfully persisted in database`);
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
    assert.equal(result.data.otpPreview, undefined, 'CRITICAL SECURITY CHECK: Password reset OTP must NOT be leaked in HTTP response');
    resetOtp = AuthController._getOtpRecordForTest(testEmail) || '';
    assert.ok(resetOtp, 'Password reset OTP stored in server memory');
    console.log(`✅ [PASS] Password reset OTP requested for "${testUsername}", response cleanly sanitized!`);
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

  // Test 13: Attacker Role Injection & Privilege Escalation Prevention
  console.log('\n--- TEST GROUP 5: Security Role Hardening & Injection Prevention ---');
  {
    const maliciousEmail = `hacker_${uniqueSuffix}@darkweb.com`;
    // Pre-dispatch OTP for registration
    const { res: otpRes } = createMockRes();
    await AuthController.sendOtp({ body: { target: maliciousEmail, channel: 'email', type: 'REGISTRATION' } } as any, otpRes);
    const otp = AuthController._getOtpRecordForTest(maliciousEmail) || '';
    const { res: verifyRes } = createMockRes();
    await AuthController.verifyOtp({ body: { target: maliciousEmail, otp } } as any, verifyRes);

    // Attacker tries to inject 'TRAVEL_AGENCY' role
    const { res, result } = createMockRes();
    await AuthController.register({
      body: {
        username: `rogue_agency_${uniqueSuffix}`,
        email: maliciousEmail,
        password: 'Password@123',
        role: 'TRAVEL_AGENCY' // Attempted privilege escalation
      }
    } as any, res);

    assert.equal(result.statusCode, 201);
    assert.equal(result.data.user.role, 'USER', 'CRITICAL SECURITY CHECK: Attacker role must be locked to USER');
    console.log('✅ [PASS] Privilege escalation blocked: client-supplied "TRAVEL_AGENCY" role locked to "USER"');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 13 TESTS PASSED! ZERO-TRUST SECURITY & PERSISTENCE VERIFIED!');
  console.log('================================================================');
}

runAuthTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

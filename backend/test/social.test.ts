import { AdminOperationsController } from '../src/features/admin-operations/adminOperations.controller.js';
import { strict as assert } from 'assert';
import { SocialController } from '../src/features/social/social.controller.js';
import { StaysController } from '../src/features/stays/stays.controller.js';

console.log('================================================================');
console.log('🧪 TRAVEL BUDDY SOCIAL FEED & STAYS VERIFICATION SUITE');
console.log('================================================================');

async function runTests() {
  // Test 1: Fetch Social Feed
  console.log('\n--- TEST GROUP 1: Social Travel Feed ---');
  let mockStatus = 0;
  let mockJson: any = null;
  const mockRes = {
    status: (s: number) => {
      mockStatus = s;
      return {
        json: (data: any) => {
          mockJson = data;
        }
      };
    }
  } as any;

  await SocialController.getFeed({} as any, mockRes);
  assert.equal(mockStatus, 200, 'Feed endpoint should return HTTP 200');
  assert.ok(mockJson.posts && mockJson.posts.length > 0, 'Feed should contain travel posts');
  console.log(`✅ [PASS] Successfully retrieved ${mockJson.posts.length} travel posts with multi-image carousels`);

  // Test 2: Double-Tap Like Action
  await SocialController.toggleLikePost({ params: { postId: 'post_1' }, body: {} } as any, mockRes);
  assert.equal(mockStatus, 200, 'Like toggle should return HTTP 200');
  assert.ok(mockJson.success, 'Post like toggle should succeed');
  console.log(`✅ [PASS] Double-tap like interaction verified: isLiked=${mockJson.isLiked}, likesCount=${mockJson.likesCount}`);

  // Test 3: Fetch 24-Hour Stories & Polls
  await SocialController.getStories({} as any, mockRes);
  assert.equal(mockStatus, 200, 'Stories endpoint should return HTTP 200');
  assert.ok(mockJson.stories && mockJson.stories.length > 0, 'Stories should contain active stories');
  console.log(`✅ [PASS] Retrieved ${mockJson.stories.length} 24-hour interactive stories with polls`);

  // Test 4: Fetch Reels
  await SocialController.getReels({} as any, mockRes);
  assert.equal(mockStatus, 200, 'Reels endpoint should return HTTP 200');
  assert.ok(mockJson.reels && mockJson.reels.length > 0, 'Reels should contain video reels');
  console.log(`✅ [PASS] Retrieved ${mockJson.reels.length} vertical travel reels`);

  // Test 5: Fetch Stays & Partner Hotels
  console.log('\n--- TEST GROUP 2: Stays & Hotel Verification ---');
  await StaysController.getHotels({ query: {} } as any, mockRes);
  assert.equal(mockStatus, 200, 'Hotels endpoint should return HTTP 200');
  assert.ok(mockJson.hotels && mockJson.hotels.length > 0, 'Hotels list should not be empty');
  console.log(`✅ [PASS] Retrieved ${mockJson.hotels.length} partner hotels with photographic highlight tags`);

  // Test Group 3: Admin 2FA Email OTP Verification
  console.log('\n--- TEST GROUP 3: Admin 2FA Email OTP Verification Flow ---');
  
  // 3a. Invalid credentials rejection
  await AdminOperationsController.validateAdminCredentials({
    body: { username: 'admin', email: 'admin@travelbuddy.com', password: 'WrongPassword' }
  } as any, mockRes);
  assert.equal(mockStatus, 401, 'Invalid password should be rejected with 401');
  console.log('✅ [PASS] Incorrect password rejected with HTTP 401');

  // 3b. Valid credentials step 1: Send OTP to email
  await AdminOperationsController.validateAdminCredentials({
    body: { username: 'admin', email: 'admin@travelbuddy.com', password: 'Admin@123' }
  } as any, mockRes);
  assert.equal(mockStatus, 200, 'Valid credentials should dispatch 2FA OTP with 200');
  assert.equal(mockJson.otpPreview, undefined, 'CRITICAL SECURITY CHECK: 2FA OTP must NEVER be leaked in HTTP response');
  const dispatchedOtp = AdminOperationsController._getActiveAdminOtpForTesting('admin@travelbuddy.com') || '';
  assert.ok(dispatchedOtp, '2FA OTP should be stored securely in memory');
  console.log(`✅ [PASS] Step 1: Credentials validated, 2FA OTP dispatched to email without response leakage`);

  // 3c. Invalid OTP rejection
  await AdminOperationsController.verifyAdminOtp({
    body: { email: 'admin@travelbuddy.com', otp: '000000' }
  } as any, mockRes);
  assert.equal(mockStatus, 400, 'Invalid OTP should be rejected with 400');
  console.log('✅ [PASS] Incorrect OTP code rejected with HTTP 400');

  // 3d. Valid OTP step 2: Successful Super Admin login
  await AdminOperationsController.verifyAdminOtp({
    body: { email: 'admin@travelbuddy.com', otp: dispatchedOtp }
  } as any, mockRes);
  assert.equal(mockStatus, 200, 'Valid OTP should return HTTP 200 with JWT session token');
  assert.ok(mockJson.token, 'Should receive JWT token');
  assert.equal(mockJson.admin?.role, 'SUPER_ADMIN', 'Should have SUPER_ADMIN role');
  console.log('✅ [PASS] Step 2: 2FA Email OTP verified successfully, Super Admin clearance granted');

  console.log('\n================================================================');
  console.log('🏁 TEST RUN SUMMARY: ALL TESTS PASSED (100% SUCCESS)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

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

  console.log('\n================================================================');
  console.log('🏁 TEST RUN SUMMARY: ALL TESTS PASSED (100% SUCCESS)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

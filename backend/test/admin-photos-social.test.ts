import { strict as assert } from 'assert';
import mongoose from 'mongoose';
import { SocialController } from '../src/features/social/social.controller.js';
import { Post, PostRating, PostReaction, PostComment } from '../src/features/social/social.model.js';

console.log('================================================================');
console.log('🧪 TRAVEL BUDDY: ADMIN PHOTO STUDIO & SOCIAL INTERACTION TESTS');
console.log('================================================================');

async function runSocialSuite() {
  const adminUserId = new mongoose.Types.ObjectId();
  const regularUserId = new mongoose.Types.ObjectId();
  const testPostId = new mongoose.Types.ObjectId();

  let capturedStatus = 0;
  let capturedJson: any = null;
  const mockRes = {
    status: (code: number) => {
      capturedStatus = code;
      return {
        json: (data: any) => {
          capturedJson = data;
        }
      };
    }
  } as any;

  // --- Test 1: Validation in createPost ---
  console.log('\n--- 1. Validation in createPost ---');
  await SocialController.createPost(
    {
      user: { id: adminUserId.toString(), role: 'SUPER_ADMIN' },
      body: { images: [], caption: '' }
    } as any,
    mockRes
  );
  assert.equal(capturedStatus, 400, 'Empty images/caption should return HTTP 400');
  console.log('✅ [PASS] createPost rejects invalid input with 400');

  // --- Test 2: Admin Photo Studio Post Creation ---
  console.log('\n--- 2. Admin Photo Studio Post Creation ---');
  const originalCreate = Post.create;
  const originalRatingCreate = PostRating.create;

  let createdPostPayload: any = null;
  (Post as any).create = async (payload: any) => {
    createdPostPayload = {
      ...payload,
      _id: testPostId,
      save: async () => true
    };
    return createdPostPayload;
  };
  (PostRating as any).create = async (payload: any) => payload;

  await SocialController.createPost(
    {
      user: { id: adminUserId.toString(), role: 'SUPER_ADMIN' },
      body: {
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb'],
        caption: 'Munnar Misty Hills Top View',
        locationName: 'Top Station',
        city: 'Munnar, Idukki',
        initialRating: 5
      }
    } as any,
    mockRes
  );

  assert.equal(capturedStatus, 201, 'Should create post with HTTP 201');
  assert.ok(createdPostPayload.isAdminPost, 'Post created by admin should have isAdminPost: true');
  assert.equal(createdPostPayload.locationName, 'Top Station');
  assert.equal(createdPostPayload.city, 'Munnar, Idukki');
  assert.equal(createdPostPayload.averageRating, 5);
  console.log('✅ [PASS] Admin photo post created successfully with location and 5.0 initial rating');

  // --- Test 3: Star Rating Validation & Recording ---
  console.log('\n--- 3. Rating Validation & Update ---');
  // 3a. Invalid rating rejection
  await SocialController.ratePost(
    {
      user: { id: regularUserId.toString(), role: 'USER' },
      params: { postId: testPostId.toString() },
      body: { rating: 7 } // Invalid! Must be 1-5
    } as any,
    mockRes
  );
  assert.equal(capturedStatus, 400, 'Invalid rating (7) should be rejected with 400');
  console.log('✅ [PASS] Rating out of range (7) correctly rejected with 400');

  // 3b. Valid rating submission
  const originalFindById = Post.findById;
  const originalFindOneAndUpdate = PostRating.findOneAndUpdate;
  const originalAggregate = PostRating.aggregate;

  (Post as any).findById = async () => ({
    _id: testPostId,
    ratingSum: 5,
    ratingsCount: 1,
    averageRating: 5,
    save: async () => true
  });
  (PostRating as any).findOneAndUpdate = async () => true;
  (PostRating as any).aggregate = async () => [{ sum: 9, count: 2 }];

  await SocialController.ratePost(
    {
      user: { id: regularUserId.toString(), role: 'USER' },
      params: { postId: testPostId.toString() },
      body: { rating: 4 }
    } as any,
    mockRes
  );

  assert.equal(capturedStatus, 200, 'Valid rating should return HTTP 200');
  assert.equal(capturedJson.userRating, 4);
  assert.equal(capturedJson.averageRating, 4.5);
  assert.equal(capturedJson.ratingsCount, 2);
  console.log('✅ [PASS] Post rating updated successfully: 4.5 average stars from 2 ratings');

  // --- Test 4: Repost Toggle ---
  console.log('\n--- 4. Repost Interaction ---');
  const originalReactionUpdateOne = PostReaction.updateOne;
  const originalReactionCountDocuments = PostReaction.countDocuments;

  (PostReaction as any).updateOne = async () => true;
  (PostReaction as any).countDocuments = async () => 3;

  await SocialController.toggleRepost(
    {
      user: { id: regularUserId.toString(), role: 'USER' },
      params: { postId: testPostId.toString() },
      body: { reposted: true }
    } as any,
    mockRes
  );

  assert.equal(capturedStatus, 200, 'Repost toggle should return HTTP 200');
  assert.equal(capturedJson.isReposted, true);
  assert.equal(capturedJson.newRepostsCount, 3);
  console.log('✅ [PASS] Repost toggle verified: isReposted=true, repostsCount=3');

  // --- Test 5: Post Deletion Authorization ---
  console.log('\n--- 5. Post Deletion & Moderation ---');
  // 5a. Regular user cannot delete another user's post
  (Post as any).findById = async () => ({
    _id: testPostId,
    userId: adminUserId // Owned by admin, attempted by regular user
  });

  await SocialController.deletePost(
    {
      user: { id: regularUserId.toString(), role: 'USER' },
      params: { postId: testPostId.toString() }
    } as any,
    mockRes
  );
  assert.equal(capturedStatus, 403, 'Unauthorized user should be rejected with 403');
  console.log('✅ [PASS] Unauthorized user deletion rejected with HTTP 403');

  // 5b. Admin can delete any post (moderation)
  let deletedPostId: any = null;
  const originalPostDeleteOne = Post.deleteOne;
  const originalCommentDeleteMany = PostComment.deleteMany;
  const originalReactionDeleteMany = PostReaction.deleteMany;
  const originalRatingDeleteMany = PostRating.deleteMany;

  (Post as any).deleteOne = async (filter: any) => {
    deletedPostId = filter._id;
  };
  (PostComment as any).deleteMany = async () => true;
  (PostReaction as any).deleteMany = async () => true;
  (PostRating as any).deleteMany = async () => true;

  await SocialController.deletePost(
    {
      user: { id: adminUserId.toString(), role: 'SUPER_ADMIN' },
      params: { postId: testPostId.toString() }
    } as any,
    mockRes
  );
  assert.equal(capturedStatus, 200, 'Admin deletion should return HTTP 200');
  assert.equal(deletedPostId, testPostId.toString());
  console.log('✅ [PASS] Admin successfully moderated and deleted post');

  // Restore mocks
  (Post as any).create = originalCreate;
  (PostRating as any).create = originalRatingCreate;
  (Post as any).findById = originalFindById;
  (PostRating as any).findOneAndUpdate = originalFindOneAndUpdate;
  (PostRating as any).aggregate = originalAggregate;
  (PostReaction as any).updateOne = originalReactionUpdateOne;
  (PostReaction as any).countDocuments = originalReactionCountDocuments;
  (Post as any).deleteOne = originalPostDeleteOne;
  (PostComment as any).deleteMany = originalCommentDeleteMany;
  (PostReaction as any).deleteMany = originalReactionDeleteMany;
  (PostRating as any).deleteMany = originalRatingDeleteMany;

  console.log('\n================================================================');
  console.log('🏁 ALL ADMIN PHOTO & SOCIAL TESTS COMPLETED WITH 100% SUCCESS!');
  console.log('================================================================');
}

runSocialSuite().catch((err) => {
  console.error('❌ Social test suite failed:', err);
  process.exit(1);
});

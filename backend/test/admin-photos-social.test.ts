import { strict as assert } from 'assert';
import mongoose from 'mongoose';
import { SocialController } from '../src/features/social/social.controller.js';
import { Post, PostRating, PostReaction, PostComment, PostView } from '../src/features/social/social.model.js';

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
        city: 'Munnar, Idukki'
      }
    } as any,
    mockRes
  );

  assert.equal(capturedStatus, 201, 'Should create post with HTTP 201');
  assert.ok(createdPostPayload.isAdminPost, 'Post created by admin should have isAdminPost: true');
  assert.equal(createdPostPayload.locationName, 'Top Station');
  assert.equal(createdPostPayload.city, 'Munnar, Idukki');
  console.log('✅ [PASS] Admin photo post created successfully with location');

  // --- Test 3: Admin Restriction Checks (Admins cannot Like, Repost, Rate, Comment) ---
  console.log('\n--- 3. Admin Action Restrictions (Read-Only Engagement) ---');

  // 3a. Admin cannot like
  await SocialController.toggleLikePost(
    {
      user: { id: adminUserId.toString(), role: 'SUPER_ADMIN' },
      params: { postId: testPostId.toString() },
      body: { liked: true }
    } as any,
    mockRes
  );
  assert.equal(capturedStatus, 403, 'Admin like attempt should return HTTP 403');
  console.log('✅ [PASS] Admin blocked from liking posts (HTTP 403)');

  // 3b. Admin cannot repost
  await SocialController.toggleRepost(
    {
      user: { id: adminUserId.toString(), role: 'ADMIN' },
      params: { postId: testPostId.toString() },
      body: { reposted: true }
    } as any,
    mockRes
  );
  assert.equal(capturedStatus, 403, 'Admin repost attempt should return HTTP 403');
  console.log('✅ [PASS] Admin blocked from reposting posts (HTTP 403)');

  // 3c. Admin cannot rate
  await SocialController.ratePost(
    {
      user: { id: adminUserId.toString(), role: 'SUPER_ADMIN' },
      params: { postId: testPostId.toString() },
      body: { rating: 5 }
    } as any,
    mockRes
  );
  assert.equal(capturedStatus, 403, 'Admin rating attempt should return HTTP 403');
  console.log('✅ [PASS] Admin blocked from submitting ratings (HTTP 403)');

  // 3d. Admin cannot comment
  await SocialController.addComment(
    {
      user: { id: adminUserId.toString(), role: 'ADMIN' },
      params: { postId: testPostId.toString() },
      body: { text: 'Admin test comment' }
    } as any,
    mockRes
  );
  assert.equal(capturedStatus, 403, 'Admin commenting attempt should return HTTP 403');
  console.log('✅ [PASS] Admin blocked from commenting on posts (HTTP 403)');

  // --- Test 4: Regular User Allowed to Rate & Repost ---
  console.log('\n--- 4. Regular User Social Interactions ---');
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
  assert.equal(capturedStatus, 200, 'User rating should return HTTP 200');
  assert.equal(capturedJson.userRating, 4);
  assert.equal(capturedJson.averageRating, 4.5);
  console.log('✅ [PASS] Regular user successfully rated post: 4.5 average stars');

  // Repost by regular user
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
  assert.equal(capturedStatus, 200, 'User repost should return HTTP 200');
  assert.equal(capturedJson.isReposted, true);
  console.log('✅ [PASS] Regular user repost verified: isReposted=true');

  // --- Test 5: Fetch Likers and Reposters Lists ---
  console.log('\n--- 5. Inspection of Likers & Reposters ---');
  const originalReactionFind = PostReaction.find;

  const mockReactionResults = [
    {
      postId: testPostId,
      type: 'LIKE',
      userId: {
        _id: regularUserId,
        name: 'Rahul Traveler',
        username: 'rahul_v',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
        email: 'rahul@travelworld.com'
      },
      createdAt: new Date('2026-11-05T12:00:00Z')
    }
  ];

  (PostReaction as any).find = () => ({
    populate: () => ({
      sort: () => ({
        lean: async () => mockReactionResults
      })
    })
  });

  // Test getPostLikes
  await SocialController.getPostLikes(
    { params: { postId: testPostId.toString() } } as any,
    mockRes
  );
  assert.equal(capturedStatus, 200, 'getPostLikes should return HTTP 200');
  assert.equal(capturedJson.count, 1);
  assert.equal(capturedJson.users[0].name, 'Rahul Traveler');
  console.log('✅ [PASS] getPostLikes successfully returned travelers who liked the post');

  // Test getPostReposts
  await SocialController.getPostReposts(
    { params: { postId: testPostId.toString() } } as any,
    mockRes
  );
  assert.equal(capturedStatus, 200, 'getPostReposts should return HTTP 200');
  assert.equal(capturedJson.count, 1);
  assert.equal(capturedJson.users[0].username, 'rahul_v');
  console.log('✅ [PASS] getPostReposts successfully returned travelers who reposted the post');

  // Test getPostRatings (Admins inspecting who gave reviews and star ratings)
  const originalRatingFind = PostRating.find;
  const mockRatingResults = [
    {
      _id: new mongoose.Types.ObjectId(),
      rating: 5,
      userId: {
        _id: regularUserId,
        name: 'Rahul Traveler',
        username: 'rahul_v',
        role: 'USER',
        email: 'rahul@travelworld.com',
        avatarUrl: 'https://images.unsplash.com/avatar.jpg'
      },
      createdAt: new Date('2026-11-05T12:00:00Z'),
      updatedAt: new Date('2026-11-05T12:00:00Z')
    }
  ];

  (PostRating as any).find = () => ({
    populate: () => ({
      sort: () => ({
        lean: async () => mockRatingResults
      })
    })
  });
  (Post as any).findById = () => ({
    select: async () => ({
      averageRating: 5,
      ratingsCount: 1,
      viewsCount: 42
    })
  });

  await SocialController.getPostRatings(
    { params: { postId: testPostId.toString() } } as any,
    mockRes
  );
  assert.equal(capturedStatus, 200, 'getPostRatings should return HTTP 200');
  assert.equal(capturedJson.count, 1);
  assert.equal(capturedJson.ratings[0].rating, 5);
  assert.equal(capturedJson.ratings[0].user.email, 'rahul@travelworld.com');
  console.log('✅ [PASS] getPostRatings successfully returned traveler review list with rating and email');

  // 5c. Test recordPostView (Admins should NOT increment views)
  const originalViewCreate = PostView.create;
  const originalFindByIdAndUpdate = Post.findByIdAndUpdate;
  const originalViewCountDocuments = PostView.countDocuments;
  const originalPostUpdateOne = Post.updateOne;

  (PostView as any).create = async () => ({ _id: new mongoose.Types.ObjectId() });
  (PostView as any).countDocuments = async () => 43;
  (Post as any).updateOne = async () => true;
  (Post as any).findByIdAndUpdate = (id: any, update: any) => ({
    select: async () => ({ viewsCount: 43 })
  });

  await SocialController.recordPostView(
    {
      user: { id: adminUserId.toString(), role: 'ADMIN' },
      params: { postId: testPostId.toString() }
    } as any,
    mockRes
  );
  assert.equal(capturedStatus, 200);
  assert.equal(capturedJson.counted, false, 'Admin view should not be counted');
  console.log('✅ [PASS] Admin view excluded from post view count (counted: false)');

  // 5d. Test recordPostView (First time for registered traveler -> counted: true)

  await SocialController.recordPostView(
    {
      user: { id: regularUserId.toString(), role: 'USER' },
      params: { postId: testPostId.toString() }
    } as any,
    mockRes
  );
  assert.equal(capturedStatus, 200, 'recordPostView should return HTTP 200');
  assert.equal(capturedJson.viewsCount, 43);
  assert.equal(capturedJson.counted, true);
  console.log('✅ [PASS] Regular user view successfully incremented viewsCount: 43 (counted: true)');

  // 5e. Test recordPostView duplicate (User views again -> duplicate key, counted: false)
  (PostView as any).create = async () => {
    const duplicateError: any = new Error('Duplicate key');
    duplicateError.code = 11000;
    throw duplicateError;
  };
  (PostView as any).countDocuments = async () => 43;

  await SocialController.recordPostView(
    {
      user: { id: regularUserId.toString(), role: 'USER' },
      params: { postId: testPostId.toString() }
    } as any,
    mockRes
  );
  assert.equal(capturedStatus, 200, 'recordPostView should return HTTP 200');
  assert.equal(capturedJson.counted, false, 'Duplicate view should not be counted');
  console.log('✅ [PASS] Duplicate user view prevented from re-incrementing (counted: false)');

  // 5f. Test getPostViews (Admins inspecting who viewed the post)
  (PostView as any).countDocuments = async () => 1;
  const originalViewFind = PostView.find;
  const mockViewResults = [
    {
      _id: new mongoose.Types.ObjectId(),
      userId: {
        _id: regularUserId,
        name: 'Rahul Traveler',
        username: 'rahul_v',
        role: 'USER',
        email: 'rahul@travelworld.com',
        avatarUrl: 'https://images.unsplash.com/avatar.jpg'
      },
      createdAt: new Date('2026-11-06T10:00:00Z')
    }
  ];

  (PostView as any).find = () => ({
    populate: () => ({
      sort: () => ({
        lean: async () => mockViewResults
      })
    })
  });

  await SocialController.getPostViews(
    { params: { postId: testPostId.toString() } } as any,
    mockRes
  );
  assert.equal(capturedStatus, 200, 'getPostViews should return HTTP 200');
  assert.equal(capturedJson.count, 1);
  assert.equal(capturedJson.users[0].name, 'Rahul Traveler');
  assert.equal(capturedJson.users[0].email, 'rahul@travelworld.com');
  console.log('✅ [PASS] getPostViews successfully returned list of travelers who viewed post');

  // --- Test 6: Post Deletion (Admin Moderation) ---
  console.log('\n--- 6. Post Deletion & Moderation ---');
  let deletedPostId: any = null;
  (Post as any).findById = async () => ({
    _id: testPostId,
    userId: regularUserId
  });
  const originalPostDeleteOne = Post.deleteOne;
  const originalCommentDeleteMany = PostComment.deleteMany;
  const originalReactionDeleteMany = PostReaction.deleteMany;
  const originalRatingDeleteMany = PostRating.deleteMany;
  const originalViewDeleteMany = PostView.deleteMany;

  (Post as any).deleteOne = async (filter: any) => {
    deletedPostId = filter._id;
  };
  (PostComment as any).deleteMany = async () => true;
  (PostReaction as any).deleteMany = async () => true;
  (PostRating as any).deleteMany = async () => true;
  (PostView as any).deleteMany = async () => true;

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
  (PostReaction as any).find = originalReactionFind;
  (PostRating as any).find = originalRatingFind;
  (PostView as any).create = originalViewCreate;
  (PostView as any).find = originalViewFind;
  (PostView as any).countDocuments = originalViewCountDocuments;
  (Post as any).updateOne = originalPostUpdateOne;
  (Post as any).findByIdAndUpdate = originalFindByIdAndUpdate;
  (Post as any).deleteOne = originalPostDeleteOne;
  (PostComment as any).deleteMany = originalCommentDeleteMany;
  (PostReaction as any).deleteMany = originalReactionDeleteMany;
  (PostRating as any).deleteMany = originalRatingDeleteMany;
  (PostView as any).deleteMany = originalViewDeleteMany;

  console.log('\n================================================================');
  console.log('🏁 ALL ADMIN RESTRICTION & SOCIAL TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
}

runSocialSuite().catch((err) => {
  console.error('❌ Social test suite failed:', err);
  process.exit(1);
});

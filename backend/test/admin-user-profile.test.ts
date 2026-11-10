import { strict as assert } from 'assert';
import mongoose from 'mongoose';
import { AuthController } from '../src/features/auth/auth.controller.js';
import { User } from '../src/features/auth/user.model.js';
import { Post, PostComment } from '../src/features/social/social.model.js';

console.log('================================================================');
console.log('🧪 TRAVEL BUDDY: ADMIN USER FULL PROFILE INSPECTION TESTS');
console.log('================================================================');

async function runProfileSuite() {
  const targetUserId = new mongoose.Types.ObjectId();
  const followerId = new mongoose.Types.ObjectId();
  const followedUserId = new mongoose.Types.ObjectId();
  const postId1 = new mongoose.Types.ObjectId();
  const commentId1 = new mongoose.Types.ObjectId();

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

  // Mock Database connected check
  const originalReadyState = mongoose.connection.readyState;
  Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

  // --- Test 1: Invalid or Missing User ID ---
  console.log('\n--- 1. Validation of target User ID ---');
  await AuthController.getUserFullProfile(
    { params: { userId: 'invalid-id' } } as any,
    mockRes
  );
  assert.equal(capturedStatus, 400, 'Invalid userId should return 400');
  console.log('✅ [PASS] Invalid userId rejected with HTTP 400');

  // --- Test 2: User Not Found ---
  console.log('\n--- 2. Non-existent User Handling ---');
  const originalFindById = User.findById;
  (User as any).findById = () => ({
    select: () => ({
      populate: () => ({
        populate: () => ({
          lean: async () => null
        })
      })
    })
  });

  await AuthController.getUserFullProfile(
    { params: { userId: targetUserId.toString() } } as any,
    mockRes
  );
  assert.equal(capturedStatus, 404, 'Non-existent user should return 404');
  console.log('✅ [PASS] Non-existent user returns HTTP 404');

  // --- Test 3: Successful Full Profile Bundle ---
  console.log('\n--- 3. Full User Profile Dossier Retrieval ---');
  const mockUserData = {
    _id: targetUserId,
    username: 'rahul_traveler',
    name: 'Rahul Sharma',
    email: 'rahul@travelbuddy.test',
    phone: '+919876543210',
    role: 'TRAVELER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-rahul.jpg',
    bio: 'Passionate backpacker exploring Western Ghats & coastal Kerala.',
    createdAt: new Date('2026-01-15T10:00:00Z'),
    lastActiveAt: new Date(),
    followers: [
      {
        _id: followerId,
        name: 'Ananya Nair',
        username: 'ananya_wanderer',
        avatarUrl: 'https://images.unsplash.com/photo-ananya.jpg',
        role: 'USER',
        email: 'ananya@travelbuddy.test',
        status: 'ACTIVE'
      }
    ],
    following: [
      {
        _id: followedUserId,
        name: 'Munnar Hilltop Resort',
        username: 'munnar_resort',
        avatarUrl: 'https://images.unsplash.com/photo-resort.jpg',
        role: 'HOTEL_HOST',
        email: 'info@munnarresort.test',
        status: 'ACTIVE'
      }
    ]
  };

  (User as any).findById = () => ({
    select: () => ({
      populate: () => ({
        populate: () => ({
          lean: async () => mockUserData
        })
      })
    })
  });

  const originalPostFind = Post.find;
  const originalCommentFind = PostComment.find;

  const mockUserPosts = [
    {
      _id: postId1,
      images: ['https://images.unsplash.com/photo-athirappilly.jpg'],
      caption: 'Mesmerizing Athirappilly waterfalls during monsoon.',
      locationName: 'Athirappilly Waterfalls',
      city: 'Thrissur, Kerala',
      likesCount: 24,
      commentsCount: 5,
      viewsCount: 88,
      averageRating: 4.8,
      ratingsCount: 6,
      isAdminPost: false,
      createdAt: new Date('2026-03-10T12:00:00Z')
    }
  ];

  (Post as any).find = () => ({
    sort: () => ({
      select: () => ({
        lean: async () => mockUserPosts
      })
    })
  });

  const mockUserComments = [
    {
      _id: commentId1,
      userId: targetUserId,
      text: 'Great destination! The view from top cliff was breathtaking.',
      createdAt: new Date('2026-04-01T09:30:00Z'),
      postId: {
        _id: new mongoose.Types.ObjectId(),
        caption: 'Sunrise over Kolukkumalai tea peaks.',
        images: ['https://images.unsplash.com/photo-kolukkumalai.jpg'],
        locationName: 'Kolukkumalai Tea Estate',
        city: 'Munnar, Kerala'
      }
    }
  ];

  (PostComment as any).find = () => ({
    sort: () => ({
      populate: () => ({
        lean: async () => mockUserComments
      })
    })
  });

  await AuthController.getUserFullProfile(
    { params: { userId: targetUserId.toString() } } as any,
    mockRes
  );

  assert.equal(capturedStatus, 200, 'Should return HTTP 200 on success');
  assert.equal(capturedJson.success, true);
  assert.equal(capturedJson.profile.user.username, 'rahul_traveler');
  assert.equal(capturedJson.profile.user.role, 'TRAVELER');
  assert.equal(capturedJson.profile.user.followersCount, 1);
  assert.equal(capturedJson.profile.user.followingCount, 1);
  assert.equal(capturedJson.profile.user.followers[0].username, 'ananya_wanderer');
  assert.equal(capturedJson.profile.user.following[0].username, 'munnar_resort');
  assert.equal(capturedJson.profile.stats.postsCount, 1);
  assert.equal(capturedJson.profile.stats.commentsCount, 1);
  assert.equal(capturedJson.profile.stats.totalLikesReceived, 24);
  assert.equal(capturedJson.profile.stats.totalViewsReceived, 88);
  assert.equal(capturedJson.profile.posts[0].caption, 'Mesmerizing Athirappilly waterfalls during monsoon.');
  assert.equal(capturedJson.profile.comments[0].text, 'Great destination! The view from top cliff was breathtaking.');
  console.log('✅ [PASS] Full user profile dossier returned with user, followers, following, posts, comments & aggregates');

  // Cleanup mocks
  (User as any).findById = originalFindById;
  (Post as any).find = originalPostFind;
  (PostComment as any).find = originalCommentFind;
  Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });

  console.log('\n================================================================');
  console.log('🏁 ALL ADMIN USER FULL PROFILE TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
}

runProfileSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});

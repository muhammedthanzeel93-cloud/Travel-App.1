import { strict as assert } from 'node:assert';

const testUri = process.env.SECURITY_TEST_MONGO_URI;
if (!testUri) throw new Error('SECURITY_TEST_MONGO_URI must point to a disposable local MongoDB database.');
const parsedTestUri = new URL(testUri);
if (!['127.0.0.1', 'localhost', '::1'].includes(parsedTestUri.hostname) || !/security_(?:audit_)?test/i.test(parsedTestUri.pathname)) {
  throw new Error('Refusing to run security regressions except against a localhost database named security_test or security_audit_test.');
}
process.env.MONGO_URI = testUri;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'security-regression-test-secret-2026-only';
process.env.OTP_DELIVERY_WEBHOOK_URL = '';
process.env.OTP_DELIVERY_WEBHOOK_TOKEN = '';

function responseRecorder() {
  const result: { statusCode: number; body: any; headers: Record<string, string> } = { statusCode: 0, body: undefined, headers: {} };
  const res: any = {
    status(code: number) { result.statusCode = code; return this; },
    json(body: any) { result.body = body; return this; },
    setHeader(name: string, value: string) { result.headers[name.toLowerCase()] = value; }
  };
  return { res, result };
}

let mongoose: any;
async function main() {
  mongoose = (await import('mongoose')).default;
  const bcrypt = (await import('bcryptjs')).default;
  const { User } = await import('../src/features/auth/user.model.js');
  const { AuthController } = await import('../src/features/auth/auth.controller.js');
  const { issueSessionToken } = await import('../src/features/auth/token.js');
  const { authenticateToken } = await import('../src/middlewares/auth.middleware.js');
  const { Post, PostComment, PostReaction, Story, StoryResponse } = await import('../src/features/social/social.model.js');
  const { SocialController } = await import('../src/features/social/social.controller.js');
  await mongoose.connect(testUri!, { serverSelectionTimeoutMS: 5000 });
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Post.init(), PostComment.init(), PostReaction.init(), Story.init(), StoryResponse.init()]);

  const passwordHash = await bcrypt.hash('Test-only-password-123', 4);
  const user = await User.create({ username: 'audit_user', name: 'Audit User', email: 'audit-user@example.invalid', passwordHash });
  const anotherUser = await User.create({ username: 'audit_friend', name: 'Audit Friend', passwordHash });

  // Existing and unknown identifiers receive the same response on signup and reset paths.
  for (const method of ['sendOtp', 'requestPasswordReset'] as const) {
    const existingInput = method === 'sendOtp' ? { target: user.email, type: 'REGISTRATION' } : { identifier: user.username };
    const unknownInput = method === 'sendOtp' ? { target: 'unknown@example.invalid', type: 'REGISTRATION' } : { identifier: 'unknown_audit_user' };
    const existing = responseRecorder();
    const unknown = responseRecorder();
    await AuthController[method]({ body: existingInput } as any, existing.res);
    await AuthController[method]({ body: unknownInput } as any, unknown.res);
    assert.equal(existing.result.statusCode, unknown.result.statusCode, `${method} must not disclose account existence`);
    assert.deepEqual(existing.result.body, unknown.result.body, `${method} responses must be indistinguishable`);
  }

  // Session tokens are HttpOnly cookies, and a previously issued token is rejected after version increment.
  const token = issueSessionToken(user, '24h');
  const login = responseRecorder();
  await AuthController.login({ body: { username: user.username, password: 'Test-only-password-123' } } as any, login.res);
  assert.equal(login.result.statusCode, 200);
  assert.match(login.result.headers['set-cookie'], /HttpOnly/);
  assert.equal(JSON.stringify(login.result.body).includes(token), false);
  user.sessionVersion += 1;
  await user.save();
  const auth = responseRecorder();
  let nextCalled = false;
  await authenticateToken({ headers: { authorization: `Bearer ${token}` } } as any, auth.res, () => { nextCalled = true; });
  assert.equal(auth.result.statusCode, 401);
  assert.equal(nextCalled, false);

  // Feed response is bounded and paginated; comment bodies are fetched from the separate endpoint.
  for (let i = 0; i < 35; i++) await Post.create({ userId: user._id, images: ['https://example.invalid/photo.jpg'], caption: `post ${i}` });
  const feed = responseRecorder();
  await SocialController.getFeed({ query: { limit: '100' }, user: { id: user.id, username: user.username, role: 'USER', sessionVersion: user.sessionVersion } } as any, feed.res);
  assert.equal(feed.result.statusCode, 200);
  assert.equal(feed.result.body.posts.length, 30);
  assert.equal(typeof feed.result.body.nextCursor, 'string');
  assert.ok(feed.result.body.posts.every((post: any) => post.comments.length === 0));

  // Story public serialization exposes aggregate poll values only, never voter records.
  const story = await Story.create({ userId: user._id, mediaUrl: 'https://example.invalid/story.jpg', pollSticker: { question: 'A or B?', optionA: { text: 'A', votes: 1 }, optionB: { text: 'B', votes: 0 } } });
  await Story.collection.updateOne({ _id: story._id }, { $set: { 'pollSticker.votedUserIds': [{ userId: anotherUser._id, choice: 'A' }] } });
  const stories = responseRecorder();
  await SocialController.getStories({} as any, stories.res);
  const publicPoll = stories.result.body.stories.find((entry: any) => entry._id === story.id)?.poll;
  assert.ok(publicPoll);
  assert.equal(JSON.stringify(publicPoll).includes(anotherUser.id), false);
  assert.equal(JSON.stringify(publicPoll).includes('votedUserIds'), false);

  // Poll vote uniqueness prevents one user from counting twice.
  const voteRequest: any = { params: { storyId: story.id }, body: { choice: 'A' }, user: { id: anotherUser.id } };
  const firstVote = responseRecorder();
  const secondVote = responseRecorder();
  await SocialController.voteStory(voteRequest, firstVote.res);
  await SocialController.voteStory(voteRequest, secondVote.res);
  assert.equal(firstVote.result.statusCode, 200);
  assert.equal(secondVote.result.statusCode, 409);
  const refreshed = await Story.findById(story._id).lean();
  assert.equal(refreshed?.pollSticker?.optionA.votes, 2);

  console.log('PASS: generic auth responses, session revocation, bounded feed, private poll data, and unique voting');
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose?.connection?.readyState) await mongoose.disconnect();
});

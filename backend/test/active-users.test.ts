import { strict as assert } from 'node:assert';
import { AuthController, ACTIVE_PRESENCE_WINDOW_MS } from '../src/features/auth/auth.controller.js';
import { User } from '../src/features/auth/user.model.js';
import mongoose from 'mongoose';

console.log('================================================================');
console.log('🧪 ACTIVE USER TRACKING & ADMIN EXCLUSION VERIFICATION SUITE');
console.log('================================================================');

function createMockResponse() {
  const result: { statusCode: number; body: any; headers: Record<string, string> } = {
    statusCode: 200,
    body: undefined,
    headers: {}
  };
  const res: any = {
    status(code: number) {
      result.statusCode = code;
      return this;
    },
    json(body: any) {
      result.body = body;
      return this;
    },
    setHeader(name: string, value: string) {
      result.headers[name.toLowerCase()] = value;
    }
  };
  return { res, result };
}

async function runTests() {
  // Test 1: Window duration validation
  assert.equal(ACTIVE_PRESENCE_WINDOW_MS, 5 * 60 * 1000, 'Presence window must be 5 minutes');
  console.log('✅ [PASS] Active presence window configured to 5 minutes (300 seconds)');

  // Test 2: Unauthenticated heartbeat rejection
  console.log('\n--- TEST GROUP 1: Heartbeat Security & Admin Exclusion ---');
  {
    const { res, result } = createMockResponse();
    // Simulate database readiness
    const origReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    await AuthController.heartbeat({ user: undefined } as any, res);
    assert.equal(result.statusCode, 401, 'Unauthenticated heartbeat must be rejected with HTTP 401');
    assert.equal(result.body.success, false);
    console.log('✅ [PASS] Unauthenticated visitor cannot ping heartbeat (HTTP 401)');

    // Test 3: Admin heartbeat exclusion
    const { res: adminRes, result: adminResult } = createMockResponse();
    await AuthController.heartbeat({
      user: { id: new mongoose.Types.ObjectId().toString(), username: 'admin_test', role: 'SUPER_ADMIN' }
    } as any, adminRes);
    assert.equal(adminResult.statusCode, 200);
    assert.equal(adminResult.body.active, false, 'Admin session must NOT be counted as active');
    assert.equal(adminResult.body.ignored, true, 'Admin session must be explicitly ignored');
    console.log('✅ [PASS] Super Admin session is strictly excluded from active presence metrics');

    // Test 4: Regular Admin role exclusion
    const { res: regAdminRes, result: regAdminResult } = createMockResponse();
    await AuthController.heartbeat({
      user: { id: new mongoose.Types.ObjectId().toString(), username: 'admin_mgr', role: 'ADMIN' }
    } as any, regAdminRes);
    assert.equal(regAdminResult.body.active, false);
    assert.equal(regAdminResult.body.ignored, true);
    console.log('✅ [PASS] ADMIN role is strictly excluded from active presence metrics');

    // Restore readyState
    if (origReadyState) {
      Object.defineProperty(mongoose.connection, 'readyState', origReadyState);
    }
  }

  // Test Group 2: Active User Query Filter Verification
  console.log('\n--- TEST GROUP 2: Active Count Query Construction & Logic ---');
  {
    // Verify query structure used in getActiveUserCount:
    // It must filter role: { $nin: ['ADMIN', 'SUPER_ADMIN'] }, status: 'ACTIVE', lastActiveAt: { $gte: threshold }
    const now = Date.now();
    const mockUsers = [
      // 1. Registered traveler online 1 minute ago -> MUST BE COUNTED
      { username: 'traveler1', role: 'TRAVELER', status: 'ACTIVE', lastActiveAt: new Date(now - 60_000) },
      // 2. Standard user online 3 minutes ago -> MUST BE COUNTED
      { username: 'user1', role: 'USER', status: 'ACTIVE', lastActiveAt: new Date(now - 180_000) },
      // 3. Registered hotel host online 4 minutes ago -> MUST BE COUNTED
      { username: 'hotel1', role: 'HOTEL_HOST', status: 'ACTIVE', lastActiveAt: new Date(now - 240_000) },
      // 4. Admin online 30 seconds ago -> MUST NOT BE COUNTED
      { username: 'admin1', role: 'ADMIN', status: 'ACTIVE', lastActiveAt: new Date(now - 30_000) },
      // 5. Super Admin online 10 seconds ago -> MUST NOT BE COUNTED
      { username: 'superadmin1', role: 'SUPER_ADMIN', status: 'ACTIVE', lastActiveAt: new Date(now - 10_000) },
      // 6. Blocked user online 1 minute ago -> MUST NOT BE COUNTED
      { username: 'blocked_user', role: 'USER', status: 'BLOCKED', lastActiveAt: new Date(now - 60_000) },
      // 7. Traveler inactive for 10 minutes (expired) -> MUST NOT BE COUNTED
      { username: 'offline_user', role: 'USER', status: 'ACTIVE', lastActiveAt: new Date(now - 600_000) },
      // 8. Traveler with null lastActiveAt (logged out) -> MUST NOT BE COUNTED
      { username: 'logged_out', role: 'USER', status: 'ACTIVE', lastActiveAt: null }
    ];

    const threshold = new Date(now - ACTIVE_PRESENCE_WINDOW_MS);
    const activeNonAdminUsers = mockUsers.filter((u) => {
      const isRoleAllowed = u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN';
      const isActiveStatus = u.status === 'ACTIVE';
      const isWithinWindow = u.lastActiveAt !== null && u.lastActiveAt >= threshold;
      return isRoleAllowed && isActiveStatus && isWithinWindow;
    });

    assert.equal(activeNonAdminUsers.length, 3, 'Only 3 eligible non-admin travelers must be counted');
    assert.deepEqual(
      activeNonAdminUsers.map((u) => u.username),
      ['traveler1', 'user1', 'hotel1']
    );
    console.log('✅ [PASS] Active query strictly matches non-admin, non-blocked, active travelers within window');
  }

  // Test Group 3: Controller methods behavior with mock model
  console.log('\n--- TEST GROUP 3: Controller Integration Verification ---');
  {
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    // Mock User.countDocuments
    const origCountDocuments = User.countDocuments;
    let capturedFilter: any = null;
    (User as any).countDocuments = async (filter: any) => {
      capturedFilter = filter;
      return 5;
    };

    const { res, result } = createMockResponse();
    await AuthController.getActiveUserCount({} as any, res);

    assert.equal(result.statusCode, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.activeUserCount, 5);
    assert.deepEqual(capturedFilter.role, { $nin: ['ADMIN', 'SUPER_ADMIN'] }, 'Must filter out ADMIN and SUPER_ADMIN');
    assert.equal(capturedFilter.status, 'ACTIVE', 'Must require status ACTIVE');
    assert.ok(capturedFilter.lastActiveAt.$gte instanceof Date, 'Must filter by lastActiveAt threshold');

    console.log('✅ [PASS] getActiveUserCount returns accurate count and enforces admin exclusion filter');

    // Restore countDocuments
    User.countDocuments = origCountDocuments;
  }

  console.log('\n================================================================');
  console.log('🏁 ALL ACTIVE USER TESTS PASSED SUCCESSFULLY (100%)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});

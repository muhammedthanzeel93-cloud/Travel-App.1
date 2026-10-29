# 📊 Travel-app.1: സമഗ്ര കോഡ്, ഫങ്ക്ഷൻ & ഡാറ്റാബേസ് ഡ്യൂപ്ലിക്കേഷൻ ഓഡിറ്റ് റിപ്പോർട്ട്
**Comprehensive Code, Function & Database Duplication Audit Report**

---

## 📌 1. എക്സിക്യൂട്ടീവ് സമ്മറി (Executive Summary)

`Travel-app.1` പ്രോജക്റ്റിലെ എല്ലാ ഫോൾഡറുകളും (`backend`, `web`, `mobile-android`, `mobile-ios`, `docs`, `scripts`) ഓരോന്നായി പരിശോധിച്ച്, കോഡിലും ഫങ്ക്ഷനുകളിലും ഡാറ്റാബേസ് മോഡലുകളിലും വന്നിട്ടുള്ള എല്ലാത്തരം **ഡ്യൂപ്ലിക്കേഷനുകളും (Duplications)**, **ആവർത്തനങ്ങളും (Redundancies)**, ഒപ്പം കണ്ടെത്തിയ **പ്രധാന തകരാറുകളും (Architectural Issues & Ghost Artifacts)** വിശദമായി വിശകലനം ചെയ്ത് തയ്യാറാക്കിയ റിപ്പോർട്ടാണിത്.

### 🔍 പ്രധാന കണ്ടെത്തലുകൾ ഒറ്റനോട്ടത്തിൽ:
1. **മുഴുവൻ ബാക്കെൻഡ് ലോജിക് ഡ്യൂപ്ലിക്കേഷൻ (Dual-Backend Duplication)**: ബാക്കെൻഡിലെ Express കണ്ട്രോളറിലുള്ള (`auth.controller.ts`) 10 പ്രധാന ഓതന്റിക്കേഷൻ / യൂസർ മാനേജ്‌മെന്റ് ഫങ്ക്ഷനുകൾ നെക്സ്റ്റ്.ജെഎസ് എപിഐ റൂട്ടിലും (`web/src/app/api/auth/[...slug]/route.ts`) പൂർണ്ണമായും അതേപടി വീണ്ടും എഴുതിവെച്ചിരിക്കുന്നു.
2. **ഡാറ്റാബേസ് പാസ്‌വേഡ് ഹാഷിങ് പൊരുത്തക്കേടും സുരക്ഷാ വീഴ്ചയും**: യൂസർ മോഡലിൽ പ്ലെയിൻടെക്സ്റ്റ് പാസ്‌വേഡും ഹാഷ് പാസ്‌വേഡും ഒരുമിച്ച് സൂക്ഷിക്കുന്നു. കൂടാതെ ബാക്കെൻഡ് `bcryptjs` ഉപയോഗിക്കുമ്പോൾ ഫ്രണ്ട്എൻഡ് റൂട്ട് `sha256` ഉപയോഗിക്കുന്നു, ഇത് ഒരേ ഡാറ്റാബേസിൽ ഡാറ്റാ പൊരുത്തക്കേട് ഉണ്ടാക്കുന്നു.
3. **ഡാറ്റാബേസ് കൗണ്ടറുകളുടെ അനാവശ്യ ഡ്യൂപ്ലിക്കേഷൻ (Denormalized Counters)**: `followersCount` vs `followers[]`, `likesCount` vs `likes[]`, `commentsCount` vs `comments[]` എന്നിങ്ങനെ അറേകളിലെ ഘടകങ്ങളുടെ എണ്ണവും പ്രത്യേക കൗണ്ടർ ഫീൽഡുകളും ഒരുമിച്ച് സൂക്ഷിച്ചിരിക്കുന്നു (ഡാറ്റ ഇൻകൺസിസ്റ്റൻസി വരാൻ സാധ്യത).
4. **അഡ്മിൻ കണ്ട്രോളറിലെ ആവർത്തനം (Controller Duplication)**: `adminOperations.controller.ts`-ലെ `validateAdminCredentials`, `loginAdmin` എന്നീ രണ്ട് ഫങ്ക്ഷനുകളിൽ 60-ലധികം വരികൾ ഒരേ കോഡ് തന്നെയാണ്.
5. **ഓഡിയോ സിന്തസൈസർ കോഡ് ആവർത്തനം**: അഡ്മിൻ ഡാഷ്‌ബോർഡിലെ രണ്ട് വ്യത്യസ്ത പേജുകളിൽ വെബ് ഓഡിയോ എപിഐ ഉപയോഗിച്ചുള്ള ബീപ് സൗണ്ട് കോഡ് ഒരേപോലെ കോപ്പി-പേസ്റ്റ് ചെയ്തിരിക്കുന്നു.
6. **ഗോസ്റ്റ് കോഡും ബ്രോക്കൺ ടെസ്റ്റും (Ghost Artifacts & Broken Tests)**: `backend/dist`-ൽ `flights`, `trains` എന്നിവയുടെ പഴയ കമ്പൈൽഡ് ഫയലുകൾ കിടക്കുന്നുണ്ട്, എന്നാൽ `backend/src`-ൽ ഈ ഫയലുകൾ ഇല്ല. അതിനാൽ `backend/test/ticketing.test.ts` ഫെയിൽ ആകുന്നു (`MODULE_NOT_FOUND`).
7. **ആൻഡ്രോയിഡ് ഡാറ്റാബേസ് എറർ (Broken Room DB Reference)**: ആൻഡ്രോയിഡ് `AppDatabase.kt`-ൽ റഫർ ചെയ്തിരിക്കുന്ന `OfflineVaultTicket`, `OfflineVaultDao` എന്നീ ഫയലുകൾ പ്രോജക്റ്റിൽ നിലവിലില്ല.

---

## 📁 2. ഫോൾഡർ തിരിച്ചുള്ള പരിശോധനാ ഫലം (Folder-by-Folder Audit Matrix)

| ഫോൾഡർ / ഫയൽ പാത്ത് | ഫയൽ ടൈപ്പ് | കണ്ടെത്തിയ ഡ്യൂപ്ലിക്കേഷൻ & പ്രശ്നങ്ങൾ | ഗൗരവം (Severity) |
| :--- | :--- | :--- | :--- |
| `backend/src/features/auth/auth.controller.ts` | Backend Controller | നെക്സ്റ്റ്.ജെഎസ് API റൂട്ടിലും (`web/api/auth`) ഇതേ ഫങ്ക്ഷനുകൾ ആവർത്തിച്ചിരിക്കുന്നു. മെമ്മറിയും മോംഗോഡിബിയും സമാന്തരമായി കൈകാര്യം ചെയ്യുന്നു. | 🔴 Critical |
| `web/src/app/api/auth/[...slug]/route.ts` | Next.js API Route | ബാക്കെൻഡിലെ 10 ഫങ്ക്ഷനുകളുടെ പൂർണ്ണ ഡ്യൂപ്ലിക്കേഷൻ. `../backend/node_modules/mongoose` ഡൈനാമിക് റിക്വയർ ചെയ്യുന്നു. SHA-256 ഹാഷിങ് ഉപയോഗിക്കുന്നു. | 🔴 Critical |
| `backend/src/features/auth/user.model.ts` | DB Schema | `password` (plaintext) & `passwordHash` ഡ്യൂപ്ലിക്കേഷൻ. `followers` അറേയും `followersCount` ഫീൽഡും ഒരേസമയം നിലനിൽക്കുന്നു. റോൾ എന്യൂമിൽ `USER` vs `TRAVELER`, `ADMIN` vs `SUPER_ADMIN` ഡ്യൂപ്ലിക്കേഷൻ. | 🔴 Critical |
| `backend/src/features/admin-operations/adminOperations.controller.ts` | Backend Controller | `validateAdminCredentials`, `loginAdmin` എന്നീ ഫങ്ക്ഷനുകളിൽ ക്രെഡൻഷ്യൽ ചെക്ക് ചെയ്യുന്ന 60 വരികൾ 100% ഡ്യൂപ്ലിക്കേറ്റാണ്. | 🟠 High |
| `backend/src/features/social/social.model.ts` | DB Schema | `Post`, `Reel` എന്നിവയിൽ `likes` അറേയും `likesCount` ഫീൽഡും ഒരുമിച്ചുണ്ട്. കമന്റുകളിൽ `userName`, `userAvatar` ഡീനോർമലൈസ് ചെയ്ത് സൂക്ഷിച്ചിരിക്കുന്നു. | 🟡 Medium |
| `backend/src/features/stays/stay.model.ts` & `booking.model.ts` | DB Schema | രണ്ട് മോഡലുകളിലും എസ്ക്രോ സ്റ്റാറ്റസ് (`escrowStatus`) വ്യത്യസ്ത പേരുകളിൽ ഡ്യൂപ്ലിക്കേറ്റ് ചെയ്തിരിക്കുന്നു. | 🟠 High |
| `web/src/app/admin/operations/ticketing-desk/page.tsx` & `users/page.tsx` | Frontend Pages | `playAlertSound` (Web Audio API Synthesizer) ഫങ്ക്ഷൻ രണ്ട് പേജുകളിലും ഒരേപടി കോപ്പി പേസ്റ്റ് ചെയ്തിരിക്കുന്നു. | 🟡 Medium |
| `web/src/features/admin/types.ts` & `web/src/features/admin/auth.ts` | TypeScript Types | `AdminUserSession` ഇന്റർഫേസ് രണ്ട് ഫയലുകളിലും ഒരേപോലെ നിർവ്വചിച്ചിരിക്കുന്നു. | 🟡 Medium |
| `web/src/app/admin/page.tsx` & `web/src/features/admin/auth.ts` | Frontend Auth | ലോക്കൽസ്റ്റോറേജിലേക്ക് സെഷൻ എഴുതുന്നതും ഇവന്റ് ഡിസ്പാച്ച് ചെയ്യുന്നതുമായ കോഡ് നേരിട്ട് കോപ്പി-പേസ്റ്റ് ചെയ്തിരിക്കുന്നു. | 🟡 Medium |
| `backend/test/ticketing.test.ts` & `backend/dist` | Tests / Build | നിലവിലില്ലാത്ത `iataTicketing.service.js`, `prsRailTicketing.service.js` ഫയലുകൾ ഇംപോർട്ട് ചെയ്യുന്നു (ടെസ്റ്റ് റൺ ചെയ്താൽ പൊട്ടുന്നു). | 🔴 Critical |
| `mobile-android/app/.../AppDatabase.kt` | Android Room DB | ഇല്ലാത്ത `OfflineVaultTicket`, `OfflineVaultDao` ക്ലാസുകൾ ഇംപോർട്ട് ചെയ്തിരിക്കുന്നു. | 🔴 Critical |
| `mobile-ios/TravelApp/Core/` | iOS Core | ഒഴിഞ്ഞ ഫോൾഡർ (Empty directory). | ⚪ Low |
| `docs/` & `scripts/` | Project Folders | ഉള്ളടക്കമില്ലാത്ത ഒഴിഞ്ഞ ഫോൾഡറുകൾ (Empty directories). | ⚪ Low |
| `backend/src/middlewares/` | Backend Middleware | ഒഴിഞ്ഞ ഫോൾഡർ (Empty directory). | ⚪ Low |

---

## 🔁 3. പ്രധാന കോഡ് & ഫങ്ക്ഷൻ ഡ്യൂപ്ലിക്കേഷൻ വിശദാംശങ്ങൾ

### 🔴 ഇഷ്യൂ 1: ബാക്കെൻഡും ഫ്രണ്ട്എൻഡും തമ്മിലുള്ള ഭീമമായ API ഫങ്ക്ഷൻ ഡ്യൂപ്ലിക്കേഷൻ (Dual Backend Architecture)
* **ഫയലുകൾ**:
  1. [`backend/src/features/auth/auth.controller.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/backend/src/features/auth/auth.controller.ts) (വരികൾ 72 - 926)
  2. [`web/src/app/api/auth/[...slug]/route.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/web/src/app/api/auth/[...slug]/route.ts) (വരികൾ 198 - 715)

* **എന്താണ് പ്രശ്നം?**:
  ഒരേ ആവശ്യത്തിനുള്ള 10 പ്രധാന ബാക്കെൻഡ് ഫങ്ക്ഷനുകൾ രണ്ട് പ്രോജക്റ്റുകളിലായി ഡ്യൂപ്ലിക്കേറ്റ് ചെയ്തിരിക്കുന്നു:
  1. **Check Availability**: `AuthController.checkAvailability` ↔️ `POST /api/auth/check-availability`
  2. **Send OTP**: `AuthController.sendOtp` ↔️ `POST /api/auth/send-otp`
  3. **Verify OTP**: `AuthController.verifyOtp` ↔️ `POST /api/auth/verify-otp`
  4. **Register User**: `AuthController.register` ↔️ `POST /api/auth/register`
  5. **Login User**: `AuthController.login` ↔️ `POST /api/auth/login`
  6. **Password Reset Request**: `AuthController.requestPasswordReset` ↔️ `POST /api/auth/forgot-password/request`
  7. **Reset Password Confirm**: `AuthController.resetPassword` ↔️ `POST /api/auth/forgot-password/reset`
  8. **Get All Users (Admin)**: `AuthController.getAllUsers` ↔️ `GET /api/auth/users`
  9. **Toggle Block User**: `AuthController.toggleBlockUser` ↔️ `POST /api/auth/users/toggle-block`
  10. **Delete User**: `AuthController.deleteUser` ↔️ `POST /api/auth/users/delete`

* **ഇതുമൂലം ഉണ്ടാകുന്ന തകരാറുകൾ**:
  - `web/src/lib/api.ts`-ൽ ഒരു റീക്വസ്റ്റ് വരുമ്പോൾ അത് ആദ്യം Next.js റൂട്ടിലേക്കും (`/api`), പരാജയപ്പെട്ടാൽ Express ബാക്കെൻഡിലേക്കും (`http://localhost:5000/api/v1`) അയക്കുന്നു.
  - രണ്ട് സ്ഥലത്തും ഇൻ-മെമ്മറി `Map` ഒബ്ജക്റ്റുകളിലാണ് OTP സൂക്ഷിക്കുന്നത് (`otpStore` vs `globalOtpStore`). ഉപയോക്താവ് ഒരിടത്ത് OTP ചോദിക്കുകയും മറ്റൊരിടത്ത് വെരിഫൈ ചെയ്യാൻ ശ്രമിക്കുകയും ചെയ്താൽ **OTP വെരിഫിക്കേഷൻ പരാജയപ്പെടും**.

---

### 🟠 ഇഷ്യൂ 2: അഡ്മിൻ കണ്ട്രോളറിലെ 100% ഡ്യൂപ്ലിക്കേറ്റ് കോഡ്
* **ഫയൽ**: [`backend/src/features/admin-operations/adminOperations.controller.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/backend/src/features/admin-operations/adminOperations.controller.ts)
* **വരികൾ**:
  - `validateAdminCredentials`: വരികൾ 16 - 72
  - `loginAdmin`: വരികൾ 180 - 235

* **ഡ്യൂപ്ലിക്കേഷൻ താരതമ്യം**:
```typescript
// validateAdminCredentials ഫങ്ക്ഷനിലും loginAdmin ഫങ്ക്ഷനിലും ഒരേപോലെ ആവർത്തിച്ചിരിക്കുന്ന കോഡ്:
const cleanUsername = String(username).trim();
const cleanEmail = String(email).trim().toLowerCase();
const cleanPassword = String(password).trim();

const MASTER_ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
const MASTER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@travelbuddy.com').toLowerCase();
const MASTER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

if (
  cleanUsername.toLowerCase() === MASTER_ADMIN_USERNAME &&
  (cleanEmail === MASTER_ADMIN_EMAIL || cleanEmail === 'admin@enteyathra.com') &&
  cleanPassword === MASTER_ADMIN_PASSWORD
) {
  isAuthenticated = true;
} else if (mongoose.connection.readyState === 1) {
  try {
    const dbUser = await User.findOne({
      $or: [
        { username: cleanUsername.toLowerCase() },
        { email: cleanEmail }
      ],
      role: { $in: ['SUPER_ADMIN', 'ADMIN'] }
    });
    if (dbUser) {
      let passOk = false;
      if (dbUser.password && dbUser.password === cleanPassword) passOk = true;
      if (dbUser.passwordHash) {
        const bcryptMatch = await bcrypt.compare(cleanPassword, dbUser.passwordHash).catch(() => false);
        if (bcryptMatch) passOk = true;
      }
      if (passOk) {
        isAuthenticated = true;
        ...
      }
    }
  }
}
```
* **പരിഹാരം**: ഈ കോഡ് ഒരു സ്വകാര്യ ഹെൽപ്പർ മെത്തേഡാക്കി (`private static async authenticateAdminCredentials(...)`) മാറ്റി രണ്ട് ഫങ്ക്ഷനുകളിൽ നിന്നും റീയൂസ് ചെയ്യണം.

---

### 🟡 ഇഷ്യൂ 3: ആവർത്തിച്ചുള്ള Web Audio API സിന്തസൈസർ ഫങ്ക്ഷൻ (`playAlertSound`)
* **ഫയലുകൾ**:
  1. [`web/src/app/admin/operations/ticketing-desk/page.tsx`](file:///c:/Users/aysha/Downloads/Travel-app.1/web/src/app/admin/operations/ticketing-desk/page.tsx#L25-L43) (Lines 25 - 43)
  2. [`web/src/app/admin/operations/users/page.tsx`](file:///c:/Users/aysha/Downloads/Travel-app.1/web/src/app/admin/operations/users/page.tsx#L65-L84) (Lines 65 - 84)

* **കോഡ് ഡ്യൂപ്ലിക്കേഷൻ**:
```typescript
const playAlertSound = (type: 'success' | 'warning' = 'success') => {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    const freq = type === 'success' ? 880 : 440;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch {}
};
```
* **പരിഹാരം**: ഈ ഫങ്ക്ഷൻ `web/src/lib/audioAlert.ts` എന്ന കോമൺ യൂട്ടിലിറ്റി ഫയലിലേക്ക് മാറ്റി രണ്ട് പേജുകളിലും ഇംപോർട്ട് ചെയ്ത് ഉപയോഗിക്കുക.

---

### 🟡 ഇഷ്യൂ 4: ഡ്യൂപ്ലിക്കേറ്റ് ലോക്കൽ സ്റ്റോറേജ് കീകളും ലെഗസി ഇവന്റുകളും
* **ഫയലുകൾ**:
  1. [`web/src/features/admin/auth.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/web/src/features/admin/auth.ts#L27-L33)
  2. [`web/src/app/admin/page.tsx`](file:///c:/Users/aysha/Downloads/Travel-app.1/web/src/app/admin/page.tsx#L301-L306)
  3. [`web/src/app/admin/operations/layout.tsx`](file:///c:/Users/aysha/Downloads/Travel-app.1/web/src/app/admin/operations/layout.tsx#L45-L49)

* **എന്താണ് പ്രശ്നം?**:
  ആപ്പിൽ പഴയ പ്രോജക്റ്റ് പേരായ `ente_yathra_*` കീകളും പുതിയ പേരായ `travel_buddy_*` കീകളും ഒരേസമയം എഴുതുകയും വായിക്കുകയും ചെയ്യുന്നു:
  - `localStorage.setItem('travel_buddy_admin_user', ...)`
  - `localStorage.setItem('ente_yathra_admin_user', ...)`
  - `window.dispatchEvent(new Event('travel_buddy_admin_auth_changed'))`
  - `window.dispatchEvent(new Event('ente_yathra_admin_auth_changed'))`
  മാത്രമല്ല, `web/src/app/admin/page.tsx`-ൽ `setAdminSession` ഫങ്ക്ഷൻ ഇംപോർട്ട് ചെയ്യാതെ ഈ വരികൾ വീണ്ടും കോപ്പി-പേസ്റ്റ് ചെയ്തിരിക്കുന്നു.

---

### 🟡 ഇഷ്യൂ 5: ടൈപ്പ് ഡെഫനിഷനുകളുടെ ഡ്യൂപ്ലിക്കേഷൻ (Interface Redundancy)
* **ഫയലുകൾ**:
  1. [`web/src/features/admin/auth.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/web/src/features/admin/auth.ts#L1-L8)
  2. [`web/src/features/admin/types.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/web/src/features/admin/types.ts#L19-L26)

* **ഡ്യൂപ്ലിക്കേറ്റ് ഇന്റർഫേസ്**:
```typescript
export interface AdminUserSession {
  username: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN';
  token: string;
  authenticatedAt: string;
}
```
രണ്ട് വ്യത്യസ്ത ഫയലുകളിൽ ഒരേ പേരിൽ ഒരേ പ്രോപ്പർട്ടികളോടെ ഇന്റർഫേസ് എഴുതിയിരിക്കുന്നു. ഇത് ഭാവിയിൽ ഒന്നിൽ മാറ്റം വരുത്തിയാൽ മറ്റേതിൽ മാറ്റമില്ലാതെ വരാൻ കാരണമാകും.

---

### 🟡 ഇഷ്യൂ 6: ഹാർഡ്കോഡഡ് കാൻഡിഡേറ്റ് API പോർട്ട് ലൂപ്പുകൾ
* **ഫയലുകൾ**:
  1. [`web/src/lib/api.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/web/src/lib/api.ts#L1-L5)
  2. [`web/src/features/admin/auth.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/web/src/features/admin/auth.ts#L41-L45)
  3. [`web/src/app/admin/page.tsx`](file:///c:/Users/aysha/Downloads/Travel-app.1/web/src/app/admin/page.tsx#L123-L127)

* **എന്താണ് പ്രശ്നം?**:
  `['http://localhost:5000/api/v1', 'http://localhost:5001/api/v1', 'http://localhost:4550/api/v1']` എന്ന അറേ മൂന്ന് ഫയലുകളിലും വെവ്വേറെ ഹാർഡ്കോഡ് ചെയ്തിരിക്കുന്നു. ഇത് `.env` അല്ലെങ്കിൽ സെൻട്രൽ കോൺഫിഗിൽ കൊണ്ടുവരേണ്ടതാണ്.

---

## 🗄️ 4. ഡാറ്റാബേസ് ഡ്യൂപ്ലിക്കേഷനുകളും പൊരുത്തക്കേടുകളും (Database Audit)

### 🔴 DB ഇഷ്യൂ 1: പാസ്‌വേഡ് ഫീൽഡുകളുടെ ഡ്യൂപ്ലിക്കേഷനും ഹാഷിങ് വൈരുദ്ധ്യവും
* **മോഡൽ ഫയൽ**: [`backend/src/features/auth/user.model.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/backend/src/features/auth/user.model.ts#L62-L63)
* **സ്കീമ കോഡ്**:
```typescript
password: { type: String },
passwordHash: { type: String, required: false },
```
* **പ്രശ്നം**:
  - `User` കളക്ഷനിൽ `password` (പ്ലെയിൻ ടെക്സ്റ്റ്) എന്നും `passwordHash` (ഹാഷ് ചെയ്തത്) എന്നും രണ്ട് ഫീൽഡുകൾ വെച്ചിരിക്കുന്നു. പ്ലെയിൻടെക്സ്റ്റ് പാസ്‌വേഡ് സൂക്ഷിക്കുന്നത് അതീവ ഗുരുതരമായ സെക്യൂരിറ്റി വീഴ്ചയാണ്.
  - **ഹാഷിങ് അൽഗോരിതം വ്യത്യാസം**:
    - `backend/src/features/auth/auth.controller.ts` ഉപയോഗിക്കുന്നത് **Bcrypt (Salt rounds 10)** ആണ്.
    - `web/src/app/api/auth/[...slug]/route.ts` ഉപയോഗിക്കുന്നത് **SHA-256 (`password + '_travel_salt_2026'`)** ആണ്!
    - ഫലം: ഒരു എൻഡ്പോയിന്റ് വഴി ഉണ്ടാക്കിയ അക്കൗണ്ട് മറ്റേ എൻഡ്പോയിന്റിൽ ലോഗിൻ ചെയ്യുമ്പോൾ പാസ്‌വേഡ് ഇൻവാലിഡ് ആകുന്നു.

---

### 🟠 DB ഇഷ്യൂ 2: ഡീനോർമലൈസ്ഡ് കൗണ്ടർ ഫീൽഡുകളുടെ ഡ്യൂപ്ലിക്കേഷൻ (Data Redundancy)
* **മോഡലുകൾ**: `User`, `Post`, `Reel`, `Story`
1. **User Model (`user.model.ts`)**:
   - `followers: [{ type: Schema.Types.ObjectId, ref: 'User' }]`
   - `followersCount: { type: Number, default: 0 }` (ഡ്യൂപ്ലിക്കേറ്റ്)
   - `following: [{ type: Schema.Types.ObjectId, ref: 'User' }]`
   - `followingCount: { type: Number, default: 0 }` (ഡ്യൂപ്ലിക്കേറ്റ്)
2. **Post Model (`social.model.ts`)**:
   - `likes: [{ type: Schema.Types.ObjectId, ref: 'User' }]`
   - `likesCount: { type: Number, default: 0 }` (ഡ്യൂപ്ലിക്കേറ്റ്)
   - `comments: [IComment]`
   - `commentsCount: { type: Number, default: 0 }` (ഡ്യൂപ്ലിക്കേറ്റ്)
3. **Reel Model (`social.model.ts`)**:
   - `likes: [{ type: Schema.Types.ObjectId, ref: 'User' }]`
   - `likesCount: { type: Number, default: 0 }` (ഡ്യൂപ്ലിക്കേറ്റ്)

* **പ്രശ്നം**: അറേയിലെ ഡോക്യുമെന്റുകളുടെ എണ്ണം കൂട്ടുകയോ കുറയ്ക്കുകയോ ചെയ്യുമ്പോൾ കൗണ്ടർ അപ്‌ഡേറ്റ് ചെയ്യാൻ മറന്നാൽ ഡാറ്റാബേസിൽ എണ്ണത്തിൽ വലിയ അന്തരം വരും. വെർച്വൽ പ്രോപ്പർട്ടികൾ (`UserSchema.virtual('followersCount').get(...)`) ഉപയോഗിക്കുകയാണ് ബെസ്റ്റ് പ്രാക്ടീസ്.

---

### 🟠 DB ഇഷ്യൂ 3: കമന്റുകളിൽ യൂസർ വിവരങ്ങൾ ആവർത്തിച്ച് സൂക്ഷിക്കൽ (Denormalized User Data)
* **മോഡൽ ഫയൽ**: [`backend/src/features/social/social.model.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/backend/src/features/social/social.model.ts#L97-L114)
* **സ്കീമ കോഡ്**:
```typescript
comments: [
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: String,     // ⚠️ ഡ്യൂപ്ലിക്കേറ്റ്
    userAvatar: String,   // ⚠️ ഡ്യൂപ്ലിക്കേറ്റ്
    text: String,
    createdAt: { type: Date, default: Date.now },
  }
]
```
* **പ്രശ്നം**: ഓരോ കമന്റിലും യൂസറുടെ പേരും അവതാറും എംബെഡ് ചെയ്ത് സൂക്ഷിക്കുന്നു. യൂസർ പ്രൊഫൈലിൽ പോയി പേരോ പ്രൊഫൈൽ ഫോട്ടോയോ മാറ്റിയാൽ കമന്റുകളിൽ പഴയ വിവരങ്ങൾ തന്നെ അവശേഷിക്കും. Mongoose `populate('comments.userId')` ഉപയോഗിക്കുന്നതാണ് കൃത്യമായ രീതി.

---

### 🟠 DB ഇഷ്യൂ 4: ഒരേ ബുക്കിംഗിന് രണ്ട് മോഡലുകളിൽ പരസ്പരവിരുദ്ധമായ Escrow Status
* **മോഡലുകൾ**:
  1. `RoomBooking` in [`backend/src/features/stays/stay.model.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/backend/src/features/stays/stay.model.ts#L156-L160)
  2. `Booking` in [`backend/src/features/booking/booking.model.ts`](file:///c:/Users/aysha/Downloads/Travel-app.1/backend/src/features/booking/booking.model.ts#L48-L52)

* **വ്യത്യാസങ്ങൾ**:
  - `RoomBooking.escrowStatus`:
    `enum: ['HELD_UNTIL_24H_POST_CHECKIN', 'RELEASED_TO_HOST', 'REFUNDED']`
  - `Booking.paymentDetails.escrowStatus`:
    `enum: ['HELD_IN_ESCROW', 'RELEASED_TO_PARTNER', 'REFUNDED_TO_USER']`

* **പ്രശ്നം**: ഒരേ ഹോട്ടൽ ബുക്കിംഗിന് `Booking` മോഡലിലും `RoomBooking` മോഡലിലും രണ്ട് തരത്തിലുള്ള എസ്‌ക്രോ സ്റ്റാറ്റസ് നിലനിൽക്കുന്നു. ഫിനാൻഷ്യൽ സെറ്റിൽമെന്റിൽ ഇത് കൺഫ്യൂഷനും ബഗുകൾക്കും ഇടയാക്കും.

---

### 🟡 DB ഇഷ്യൂ 5: ഡയറക്ട് മെസ്സേജ് സ്കീമയും കണ്ട്രോളറും തമ്മിലുള്ള പൊരുത്തക്കേട്
* **മോഡൽ**: `DirectMessageSchema` in `social.model.ts`
  - `messageType` enum: `['TEXT', 'AUDIO_VOICE_NOTE', 'TICKET_SHARE']`
  - ഫീൽഡ് പേര്: `ticketShare`
* **കണ്ട്രോളർ**: `social.controller.ts` line 152:
  - `messageType: 'STAY_SHARE'`
  - ഫീൽഡ് പേര്: `stayShare`
* **പ്രശ്നം**: സ്കീമയിലില്ലാത്ത `STAY_SHARE`, `stayShare` എന്നിവ ഡാറ്റാബേസിലേക്ക് ഇൻസേർട്ട് ചെയ്യാൻ ശ്രമിച്ചാൽ മോംഗൂസ് അത് വാലിഡേഷൻ എറർ ആക്കി തള്ളിക്കളയും.

---

## 👻 5. ഉപയോഗശൂന്യമായ കോഡുകളും പൊട്ടിയ ഭാഗങ്ങളും (Broken & Ghost Code)

### 🔴 1. കമ്പൈൽ ചെയ്ത അവശിഷ്ടങ്ങളും പരാജയപ്പെടുന്ന ടെസ്റ്റും:
* `backend/dist/features/flights/`
* `backend/dist/features/trains/`
* ഇവിടെ കമ്പൈൽ ചെയ്ത `.js` ഫയലുകൾ ഇപ്പോഴും നിലനിൽക്കുന്നുണ്ട്. എന്നാൽ `backend/src/features/flights`, `backend/src/features/trains` എന്നിവ സ്രോതസ്സിൽ നിന്ന് നീക്കം ചെയ്തിട്ടുണ്ട്.
* **പരാജയപ്പെടുന്ന ടെസ്റ്റ്**: `backend/test/ticketing.test.ts` റൺ ചെയ്യുമ്പോൾ:
  ```
  Error: Cannot find module '../src/features/flights/iataTicketing.service.js'
  code: 'MODULE_NOT_FOUND'
  ```
  എന്ന് കാണിച്ച് പരാജയപ്പെടുന്നു.

### 🔴 2. ആൻഡ്രോയിഡ് ആപ്പിലെ ബ്രോക്കൺ ഡാറ്റാബേസ് എൻറ്റിറ്റി:
* [`mobile-android/app/src/main/java/com/travelapp/core/database/AppDatabase.kt`](file:///c:/Users/aysha/Downloads/Travel-app.1/mobile-android/app/src/main/java/com/travelapp/core/database/AppDatabase.kt#L7-L10)
  ```kotlin
  import com.travelapp.features.vault.data.OfflineVaultDao
  import com.travelapp.features.vault.data.OfflineVaultTicket

  @Database(entities = [OfflineVaultTicket::class], version = 1, exportSchema = false)
  ```
* പ്രോജക്റ്റിൽ `com.travelapp.features.vault` എന്നൊരു പാക്കേജോ അതിൽ ഫയലുകളോ ഇല്ല! ആൻഡ്രോയിഡ് ആപ്പ് ബിൽഡ് ചെയ്താൽ ഉടൻ കംപൈലേഷൻ ഫെയിലിയർ വരും.

### ⚪ 3. ഒഴിഞ്ഞ ഫോൾഡറുകൾ (Empty Folders):
1. `c:\Users\aysha\Downloads\Travel-app.1\docs\`
2. `c:\Users\aysha\Downloads\Travel-app.1\scripts\`
3. `c:\Users\aysha\Downloads\Travel-app.1\backend\src\middlewares\`
4. `c:\Users\aysha\Downloads\Travel-app.1\mobile-ios\TravelApp\Core\`

---

## 🛠️ 6. പ്രശ്നപരിഹാരത്തിനുള്ള ഘട്ടങ്ങൾ (Step-by-Step Remediation Plan)

### ഘട്ടം 1: ബാക്കെൻഡ് ലോജിക് ഏകീകരിക്കുക (Consolidate Backend API)
* `web/src/app/api/auth/[...slug]/route.ts` എന്ന 700+ വരികളുള്ള ഡ്യൂപ്ലിക്കേറ്റ് ഫയൽ നീക്കം ചെയ്യുക അല്ലെങ്കിൽ ഒരു ലളിതമായ റിവേഴ്സ് പ്രോക്സി (Proxy) മാത്രമായി മാറ്റുക.
* നെക്സ്റ്റ്.ജെഎസ് ആപ്പിലെ എല്ലാ ക്ലൈന്റ് റിക്വസ്റ്റുകളും നേരിട്ടോ പ്രോക്സി വഴിയോ പ്രധാന Express ബാക്കെൻഡിലേക്ക് (`/api/v1/auth/...`) റീഡയറക്റ്റ് ചെയ്യുക.

### ഘട്ടം 2: ഡാറ്റാബേസ് പാസ്‌വേഡ് & കൗണ്ടർ ഫീൽഡുകൾ തിരുത്തുക
1. `UserSchema`-ൽ നിന്ന് `password` (plaintext) പൂർണ്ണമായി ഒഴിവാക്കുക. `passwordHash` മാത്രം സൂക്ഷിക്കുക.
2. എല്ലാ പാസ്‌വേഡ് എൻക്രിപ്ഷനും `bcryptjs` ലേക്ക് ഏകീകരിക്കുക.
3. `followersCount`, `likesCount`, `commentsCount` എന്നിവ ഫീൽഡുകളായി സൂക്ഷിക്കുന്നതിന് പകരം മോംഗൂസ് വെർച്വലുകളോ അഗ്രിഗേഷനോ ഉപയോഗിക്കുക.
4. `comments`-ൽ നിന്ന് `userName`, `userAvatar` നീക്കം ചെയ്ത് `userId` റഫറൻസ് വഴി പോപ്പുലേറ്റ് ചെയ്യുക.

### ഘട്ടം 3: അഡ്മിൻ കണ്ട്രോളറും ഓഡിയോ കോഡും റീഫാക്ടർ ചെയ്യുക
1. `adminOperations.controller.ts`-ലെ ഡ്യൂപ്ലിക്കേറ്റ് കോഡ് മാറ്റി കോമൺ ഫങ്ക്ഷൻ ഉണ്ടാക്കുക.
2. `playAlertSound` എന്ന ഫങ്ക്ഷൻ `web/src/lib/sound.ts` എന്ന യൂട്ടിലിറ്റിയിലേക്ക് മാറ്റി കോമൺ ആക്കുക.
3. ലെഗസി `ente_yathra_*` ലോക്കൽ സ്റ്റോറേജ് കീകളും ഇവന്റുകളും ക്ലീൻ ചെയ്യുക.

### ഘട്ടം 4: ഉപയോഗശൂന്യമായ ഫയലുകളും ബ്രോക്കൺ ഇംപോർട്ടുകളും വൃത്തിയാക്കുക
1. `backend/dist` ഫോൾഡർ ഡിലീറ്റ് ചെയ്ത് `npm run build` കൊടുത്ത് ഫ്രഷ് ബിൽഡ് ഉണ്ടാക്കുക (ഇതോടെ പഴയ flights/trains js ഫയലുകൾ പോകും).
2. `backend/test/ticketing.test.ts` നിലവിലെ ആർക്കിടെക്ചറിന് അനുസരിച്ച് അപ്‌ഡേറ്റ് ചെയ്യുകയോ അനാവശ്യമാണെങ്കിൽ നീക്കുകയോ ചെയ്യുക.
3. ആൻഡ്രോയിഡിൽ `OfflineVaultTicket`, `OfflineVaultDao` ക്ലാസുകൾ നിർമ്മിക്കുകയോ അല്ലെങ്കിൽ `AppDatabase.kt` തൽക്കാലം ക്ലീൻ ചെയ്യുകയോ ചെയ്യുക.
4. ഒഴിഞ്ഞ ഫോൾഡറുകൾ ഒന്നുകിൽ `.gitkeep` ചേർത്ത് സൂക്ഷിക്കുക അല്ലെങ്കിൽ നീക്കം ചെയ്യുക.

---
*തയ്യാറാക്കിയത്: Antigravity AI Code Analysis Engine*  
*തിയതി: ഒക്ടോബർ 29, 2026*

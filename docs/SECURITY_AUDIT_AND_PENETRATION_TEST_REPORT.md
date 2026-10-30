# 🛡️ സെക്യൂരിറ്റി ഓഡിറ്റ് & പെനട്രേഷൻ ടെസ്റ്റിംഗ് സിമുലേഷൻ റിപ്പോർട്ട്
**Red Team Threat Simulation & Vulnerability Assessment Report (Pre-Production)**

---

## 📌 1. എക്സിക്യൂട്ടീവ് സമ്മറി (Executive Summary & Attack Scenario)

ഈ റിപ്പോർട്ട് **Travel Buddy (`Travel-app.1`)** പ്രൊഡക്ഷൻ ലെവലിലേക്ക് പുഷ് ചെയ്യുന്നതിന് മുന്നോടിയായി നടത്തിയ ആഴത്തിലുള്ള സെക്യൂരിറ്റി ഓഡിറ്റും (Security Vulnerability Assessment), 100 മുതൽ 1000 ഹാക്കർമാർ ഒരേസമയം പ്ലാറ്റ്‌ഫോമിനെ ലക്ഷ്യമിട്ട് അറ്റാക്ക് ചെയ്യുന്ന സാങ്കൽപ്പിക ഭീഷണി സിമുലേഷനും (Simulated Red Team Cyber Attack) ആസ്പദമാക്കി തയ്യാറാക്കിയതാണ്.

### ⚠️ അറ്റാക്ക് സിമുലേഷൻ അവസ്ഥ (1,000 Attackers Scenario):
1000 അറ്റാക്കർമാർ (അല്ലെങ്കിൽ ഒരു ഓട്ടോമേറ്റഡ് ബോട്ട്‌നെറ്റ്) ഒരേസമയം സിസ്റ്റത്തിലെ വിവിധ എൻഡ്‌പോയിന്റുകളിലേക്ക് റിക്വസ്റ്റുകൾ അയച്ച് അറ്റാക്ക് നടത്തിയാൽ നിലവിലെ കോഡ്‌ബേസിൽ താഴെ പറയുന്ന ഗുരുതരമായ തകർച്ചകൾ സംഭവിക്കും:
1. **നിമിഷങ്ങൾക്കകം പൂർണ്ണ അക്കൗണ്ട് ഹൈജാക്കിംഗ് (Total Account Takeover - ATO):** OTP റെസ്‌പോൺസ് ബോഡിയിൽ ലീക്കാവുന്നതിനാൽ ഏതൊരു യൂസറുടെയും അല്ലെങ്കിൽ അഡ്മിന്റെയും പാസ്‌വേഡ് അറ്റാക്കർക്ക് റീസെറ്റ് ചെയ്യാം.
2. **പ്രിവിലേജ് എസ്കലേഷൻ (Instant Super Admin Access):** രജിസ്ട്രേഷൻ സമയത്ത് അറ്റാക്കർക്ക് സ്വയം `SUPER_ADMIN` റോൾ നൽകാൻ സാധിക്കുന്നു.
3. **ഡാറ്റാബേസ് പൂർണ്ണമായി നശിപ്പിക്കപ്പെടൽ (Unauthenticated Data Deletion):** ലോഗിൻ ചെയ്യാത്ത ഏതൊരാൾക്കും മുഴുവൻ യൂസർമാരെയും ഡിലീറ്റ് ചെയ്യാനും ബ്ലോക്ക് ചെയ്യാനും സാധിക്കുന്ന എൻഡ്‌പോയിന്റുകൾ തുറന്നു കിടക്കുന്നു.
4. **സെർവർ ഫ്രീസ് & സർവീസ് തടസ്സപ്പെടൽ (DDoS / Event Loop CPU Starvation):** റേറ്റ് ലിമിറ്റിംഗ് ഇല്ലാത്തതിനാൽ 1000 കൺകറന്റ് റിക്വസ്റ്റുകൾ വരുന്നത് മൂലം Node.js സിംഗിൾ ത്രെഡ് പൂർണ്ണമായി ലോക്കാവുകയും ആപ്പ് ക്രാഷാവുകയും ചെയ്യും.
5. **യാത്രക്കാരുടെ സ്വകാര്യ വിവര ചോർച്ച (Data Privacy Breach via WebSockets & DMs):** യാതൊരു ഓതന്റിക്കേഷനുമില്ലാതെ തത്സമയ ടിക്കറ്റിംഗ് ഡാറ്റയും പ്രൈവറ്റ് മെസ്സേജുകളും ചോർത്താൻ സാധിക്കുന്നു.

---

## 🗺️ 2. ഹാക്കർമാരുടെ അറ്റാക്ക് റൂട്ടുകൾ (Detailed Attack Vectors & Kill Chain)

താഴെ നൽകിയിരിക്കുന്നത് ഹാക്കർമാർ പ്രവേശിക്കാൻ ഉപയോഗിക്കുന്ന പ്രധാന 8 വഴികളും (Attack Vectors) അവ നിലവിലെ കോഡിൽ എവിടെയാണ് സ്ഥിതി ചെയ്യുന്നതെന്നും ഉള്ള വിശദാംശമാണ്:

```
[1,000 സിമുലേറ്റഡ് അറ്റാക്കർമാർ]
       │
       ├──► 1. /api/v1/auth/forgot-password/request ──► OTP Response Leak (otpPreview) ──► Complete Account Takeover
       │
       ├──► 2. /api/v1/auth/register (role: "SUPER_ADMIN") ──► Mass Assignment ──► Unauthorized Super Admin Rights
       │
       ├──► 3. /api/v1/admin/login (Master OTP: 492810) ──► Hardcoded Backdoors ──► 2FA Bypass
       │
       ├──► 4. /api/v1/auth/users/delete ──► No Auth Middleware ──► Total Database Wipeout
       │
       ├──► 5. /api/v1/social/messages ──► Unfiltered DB Query ──► Mass Direct Message Snooping
       │
       ├──► 6. WebSocket 'join:admin-desk' ──► Insecure Socket Room ──► Real-Time Passenger Manifest Interception
       │
       ├──► 7. Concurrent Bcrypt Flood (1,000 Req/sec) ──► No Rate Limit ──► Node.js CPU Event Loop Starvation (DoS)
       │
       └──► 8. /api/v1/stays/book (packagePrice: 0) ──► Client Price Manipulation ──► Free Hotel Booking Fraud
```

---

## 🔍 3. കണ്ടെത്തിയ സുരക്ഷാ വീഴ്ചകൾ (Vulnerability Findings & Mechanics)

---

### 🚨 1. അതിഗുരുതര വീഴ്ച (Critical - P0): API റെസ്‌പോൺസിലൂടെ OTP പരസ്യമായി ലീക്കാകുന്നു
* **ലൊക്കേഷൻ:**
  - `backend/src/features/auth/auth.controller.ts` (വരി 291 & 731)
  - `backend/src/features/admin-operations/adminOperations.controller.ts` (വരി 122)
* **കോഡിലെ പ്രശ്നം:**
  ```typescript
  // auth.controller.ts
  res.status(200).json({
    success: true,
    message: `OTP sent to ${maskedTarget}.`,
    username: foundUser.username,
    target,
    maskedTarget,
    otpPreview: otpCode // ⚠️ അത്യന്തം അപകടകരം! OTP ക്ലയന്റിന് തിരികെ അയക്കുന്നു!
  });
  ```
* **ഹാക്കർമാർ ചൂഷണം ചെയ്യുന്ന രീതി:**
  ഒരു ഹാക്കർക്ക് ഏതൊരു യൂസറുടെയോ അഡ്മിന്റെയോ യൂസർനെയിം അല്ലെങ്കിൽ ഇമെയിൽ അറിയാമെങ്കിൽ `/api/v1/auth/forgot-password/request`-ലേക്ക് ഒരു റിക്വസ്റ്റ് അയക്കുന്നു. സർവർ തിരികെ നൽകുന്ന JSON റെസ്‌പോൺസിൽ നിന്നും `otpPreview` ഫീൽഡിലുള്ള 6 അക്ക OTP നേരിട്ട് എടുത്ത് നിമിഷങ്ങൾക്കകം `/api/v1/auth/forgot-password/reset` വഴി പാസ്‌വേഡ് മാറ്റി അക്കൗണ്ട് കൈക്കലാക്കുന്നു (Full Account Takeover).

---

### 🚨 2. അതിഗുരുതര വീഴ്ച (Critical - P0): റോൾ മാസ് അസൈൻമെന്റ് വഴി സൂപ്പർ അഡ്മിൻ പ്രിവിലേജ് സ്വന്തമാക്കൽ
* **ലൊക്കേഷൻ:**
  - `backend/src/features/auth/auth.controller.ts` (വരി 445 & 462)
* **കോഡിലെ പ്രശ്നം:**
  ```typescript
  // പുതിയ യൂസറെ ഉണ്ടാക്കുമ്പോൾ ക്ലയന്റ് അയക്കുന്ന റോൾ നേരിട്ട് സ്വീകരിക്കുന്നു!
  const newMemoryUser: MemoryUser = {
    ...
    role: (req.body.role as any) || 'USER',
    ...
  };
  await User.create({
    ...
    role: (req.body.role as any) || 'USER',
    ...
  });
  ```
* **ഹാക്കർമാർ ചൂഷണം ചെയ്യുന്ന രീതി:**
  സാധാരണ രജിസ്ട്രേഷൻ പേജിൽ നിന്ന് അയക്കുന്ന റിക്വസ്റ്റിൽ ഹാക്കർ `{ "role": "SUPER_ADMIN" }` എന്ന് ചേർത്ത് പോസ്റ്റ് ചെയ്യുന്നു. ബാക്കെൻഡ് യാതൊരു പരിശോധനയുമില്ലാതെ ഈ യൂസറെ ഡാറ്റാബേസിൽ `SUPER_ADMIN` ആയി സേവ് ചെയ്യുന്നു. ഇതോടെ ഹാക്കർ സിസ്റ്റത്തിന്റെ പൂർണ്ണ നിയന്ത്രണമുള്ള അഡ്മിനായി മാറുന്നു.

---

### 🚨 3. അതിഗുരുതര വീഴ്ച (Critical - P0): സുരക്ഷാ കവചമില്ലാത്ത അഡ്മിൻ യൂസർ മാനേജ്‌മെന്റ് എൻഡ്‌പോയിന്റുകൾ
* **ലൊക്കേഷൻ:**
  - `backend/src/features/auth/auth.routes.ts` (വരി 33 - 35)
  - `backend/src/features/auth/auth.controller.ts` (വരി 861 - 985)
* **കോഡിലെ പ്രശ്നം:**
  ```typescript
  // auth.routes.ts
  router.get('/users', AuthController.getAllUsers);           // ⚠️ ടോക്കൺ പരിശോധനയില്ല!
  router.post('/users/delete', AuthController.deleteUser);      // ⚠️ ആർക്കും ഡിലീറ്റ് ചെയ്യാം!
  router.post('/users/toggle-block', AuthController.toggleBlockUser); // ⚠️ ആർക്കും ബ്ലോക്ക് ചെയ്യാം!
  ```
* **ഹാക്കർമാർ ചൂഷണം ചെയ്യുന്ന രീതി:**
  ഈ എൻഡ്‌പോയിന്റുകൾക്ക് യാതൊരു JWT ടോക്കൺ അല്ലെങ്കിൽ റോൾ വെരിഫിക്കേഷൻ മിഡിൽവെയറുമില്ല (`middlewares/` ഫോൾഡർ പൂർണ്ണമായും ശൂന്യമാണ്).
  1. 100 ഹാക്കർമാർ ഒരേസമയം `GET /api/v1/auth/users` കോൾ ചെയ്ത് സിസ്റ്റത്തിലെ മുഴുവൻ ഉപഭോക്താക്കളുടെയും ഡാറ്റ (ഇമെയിൽ, ഫോൺ നമ്പർ, റോൾ) ചോർത്തുന്നു.
  2. `POST /api/v1/auth/users/delete` വഴി സിസ്റ്റത്തിലെ മുഴുവൻ യൂസർമാരെയും ഡിലീറ്റ് ചെയ്ത് ഡാറ്റാബേസ് പൂർണ്ണമായും നശിപ്പിക്കാൻ (Sabotage) ഏതൊരു അജ്ഞാത അറ്റാക്കർക്കും സാധിക്കും.

---

### 🚨 4. അതീവ ഗുരുതര വീഴ്ച (High - P1): കോഡിൽ ഉറപ്പിച്ച ഡിഫോൾട്ട് പാസ്‌വേഡും മാസ്റ്റർ ബാക്ക്ഡോർ OTP-യും
* **ലൊക്കേഷൻ:**
  - `backend/src/features/admin-operations/adminOperations.controller.ts` (വരി 26 - 29, 150)
* **കോഡിലെ പ്രശ്നം:**
  ```typescript
  const MASTER_ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const MASTER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@travelbuddy.com').toLowerCase();
  const MASTER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

  // ബാക്ക്ഡോർ മാസ്റ്റർ OTP
  const isMasterTestOtp = cleanOtp === '492810' && (cleanEmail === 'admin@travelbuddy.com' || cleanEmail === 'admin@enteyathra.com');
  ```
* **ഹാക്കർമാർ ചൂഷണം ചെയ്യുന്ന രീതി:**
  പ്രൊഡക്ഷൻ സർവറിൽ എൻവയോൺമെന്റ് വേരിയബിൾ മിസ്സായാൽ ഡിഫോൾട്ട് ക്രെഡൻഷ്യലായ `admin` / `Admin@123` ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യാം. കൂടാതെ ഇമെയിലിലേക്ക് OTP പോകേണ്ട ആവശ്യമേയില്ല; `492810` എന്ന മാസ്റ്റർ കോഡ് നൽകിയാൽ 2FA സെക്യൂരിറ്റി മുഴുവനായി ബൈപാസ് ചെയ്യപ്പെടും.

---

### 🚨 5. അതീവ ഗുരുതര വീഴ്ച (High - P1): പ്രൈവറ്റ് ഡയറക്ട് മെസ്സേജുകളുടെ പരസ്യ ചോർച്ച (IDOR / Privacy Breach)
* **ലൊക്കേഷൻ:**
  - `backend/src/features/social/social.controller.ts` (വരി 310 - 345)
* **കോഡിലെ പ്രശ്നം:**
  ```typescript
  // social.controller.ts
  const messages = await DirectMessage.find({})
    .populate('senderId', 'name username avatarUrl')
    .sort({ createdAt: -1 });
  ```
* **ഹാക്കർമാർ ചൂഷണം ചെയ്യുന്ന രീതി:**
  `GET /api/v1/social/messages` കോൾ ചെയ്യുമ്പോൾ ഏത് യൂസറാണ് റിക്വസ്റ്റ് ചെയ്തതെന്ന് ബാക്കെൻഡ് പരിശോധിക്കുന്നില്ല (`DirectMessage.find({})`). സിസ്റ്റത്തിലെ എല്ലാ യൂസർമാരുടെയും സ്വകാര്യ ഓഡിയോ വോയ്‌സ് നോട്ടുകളും, ടിക്കറ്റ് ഷെയറുകളും, ചാറ്റുകളും ആർക്കും ഡൗൺലോഡ് ചെയ്തെടുക്കാം.

---

### 🚨 6. അതീവ ഗുരുതര വീഴ്ച (High - P1): വെബ്സോക്കറ്റ് വഴി തത്സമയ ടിക്കറ്റിംഗ് ഡാറ്റ ഒളിഞ്ഞുനോക്കൽ (Eavesdropping)
* **ലൊക്കേഷൻ:**
  - `backend/src/core/sockets/operationsHub.ts` (വരി 13 - 22)
* **കോഡിലെ പ്രശ്നം:**
  ```typescript
  socket.on('join:admin-desk', () => {
    socket.join('admin-operations'); // ⚠️ ടോക്കണോ അഡ്മിൻ പരിശോധനയോ ഇല്ല!
  });

  socket.on('join:user-vault', (userId: string) => {
    socket.join(`user:${userId}`); // ⚠️ ആർക്കും മറ്റുള്ളവരുടെ റൂമിൽ കയറാം!
  });
  ```
* **ഹാക്കർമാർ ചൂഷണം ചെയ്യുന്ന രീതി:**
  ഒരു ഹാക്കർ ക്ലയന്റ് വെബ്സോക്കറ്റിലേക്ക് കണക്റ്റ് ചെയ്ത് `join:admin-desk` എന്ന് എമിറ്റ് ചെയ്താൽ, പ്ലാറ്റ്‌ഫോമിൽ ടിക്കറ്റ് ബുക്ക് ചെയ്യുന്ന എല്ലാ യാത്രക്കാരുടെയും വിവരങ്ങൾ (`admin:new-booking-queued` വഴി PNR, പാസ്‌പോർട്ട് വിശദാംശങ്ങൾ, പേര്, യാത്ര വിവരങ്ങൾ) തത്സമയം ഹാക്കറുടെ സ്ക്രീനിൽ ലഭിക്കും.

---

### 🚨 7. ഡോസ് അറ്റാക്ക് വീഴ്ച (High - P1): റേറ്റ് ലിമിറ്റിംഗ് ഇല്ലായ്മയും CPU സ്റ്റാർവേഷനും (DoS Vulnerability)
* **ലൊക്കേഷൻ:**
  - `backend/src/server.ts`
* **സാഹചര്യം:**
  1,000 ഹാക്കർമാർ ഒരേസമയം `/api/v1/auth/login` അല്ലെങ്കിൽ `/api/v1/auth/send-otp`-ലേക്ക് കൺകറന്റ് റിക്വസ്റ്റുകൾ അയക്കുന്നു.
* **തകർച്ചയുടെ കാരണം:**
  - `bcrypt.compare` ഓരോ തവണയും 50-80ms CPU പ്രോസസിംഗ് എടുക്കുന്നു. 1,000 റിക്വസ്റ്റുകൾ ഒരേ സെക്കൻഡിൽ വരുമ്പോൾ Node.js-ന്റെ സിംഗിൾ ഇവന്റ് ലൂപ്പ് (Event Loop) പൂർണ്ണമായും ബ്ലോക്കാവുന്നു.
  - റേറ്റ് ലിമിറ്റിംഗ് ഇല്ലാത്തതിനാൽ സെർവർ 100% CPU യൂട്ടിലൈസേഷനിലെത്തി ഫ്രീസ് ആവുകയും മറ്റ് സാധാരണ ഉപഭോക്താക്കൾക്ക് 504 Gateway Timeout ലഭിക്കുകയും ചെയ്യും.
  - കൂടാതെ SMS / Email പ്രൊവൈഡർ വഴി ലക്ഷക്കണക്കിന് OTP റിക്വസ്റ്റുകൾ അയപ്പിച്ച് ബില്ലിംഗ് തകർക്കാനും (SMS Flooding) സാധിക്കും.

---

### ⚠️ 8. ബിസിനസ്സ് ലോജിക് തകരാറ് (Medium - P2): ഹോട്ടൽ പാക്കേജ് പ്രൈസ് മാനിപ്പുലേഷൻ
* **ലൊക്കേഷൻ:**
  - `backend/src/features/stays/stays.controller.ts` (വരി 99 - 105)
* **കോഡിലെ പ്രശ്നം:**
  ```typescript
  const { hotelId, roomId, packagePrice = 3450 } = req.body;
  ```
* **ഹാക്കർമാർ ചൂഷണം ചെയ്യുന്ന രീതി:**
  ക്ലയന്റ് അയക്കുന്ന `packagePrice` സർവർ അതേപടി സ്വീകരിക്കുന്നു. ഹാക്കർക്ക് `{ "packagePrice": 0 }` എന്ന് നൽകി ലക്ഷങ്ങൾ വിലമതിക്കുന്ന ലക്ഷ്വറി ഹോട്ടൽ സ്യൂട്ടുകൾ സൗജന്യമായി ബുക്ക് ചെയ്ത് കൺഫർമേഷൻ വൗച്ചർ സ്വന്തമാക്കാം.

---

## 🛠️ 4. പ്രൊഡക്ഷൻ പുഷിന് മുന്നോടിയായി നടപ്പിലാക്കേണ്ട പരിഹാരങ്ങൾ (Fixes & Patches)

പ്രൊഡക്ഷൻ സെർവറിലേക്ക് കോഡ് പുഷ് ചെയ്യുന്നതിന് മുൻപ് നിർബന്ധമായും നടപ്പിലാക്കേണ്ട 6 പ്രതിരോധ നടപടികൾ:

### 1. ഓതന്റിക്കേഷൻ & റോൾ മിഡിൽവെയർ (`backend/src/middlewares/auth.middleware.ts`) നിർമ്മിക്കുക:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../core/config/index.js';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string; role: string; email?: string };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access denied. Valid token required.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Access restricted to Super Administrators only.' });
    return;
  }
  next();
};
```

### 2. OTP ലീക്കേജ് ഉടനടി ഒഴിവാക്കുക (`otpPreview` നീക്കം ചെയ്യുക):
`auth.controller.ts`, `adminOperations.controller.ts` എന്നിവയിൽ നിന്നും `otpPreview` ഒഴിവാക്കുക. OTP ഇമെയിൽ / എസ്എംഎസ് വഴി മാത്രം അയക്കുക:
```typescript
// ശരിയായ റെസ്‌പോൺസ്:
res.status(200).json({
  success: true,
  message: `Verification code dispatched to ${maskedTarget}.`,
  expiresInSeconds: 600
});
```

### 3. രജിസ്ട്രേഷനിലെ റോൾ മാസ് അസൈൻമെന്റ് തടയുക:
ക്ലയന്റിൽ നിന്ന് വരുന്ന `role` പാരാമീറ്റർ സ്വീകരിക്കരുത്:
```typescript
// role എപ്പോഴും കർശനമായി 'USER' അല്ലെങ്കിൽ 'TRAVELER' ആയി നിജപ്പെടുത്തുക:
const assignedRole = 'TRAVELER';
```

### 4. ബാക്ക്ഡോറുകൾ നീക്കം ചെയ്യുകയും കർശനമായ `JWT_SECRET` ഉറപ്പാക്കുകയും ചെയ്യുക:
`492810` എന്ന മാസ്റ്റർ OTP മായ്‌ക്കുക. സിസ്റ്റം ബൂട്ട് ചെയ്യുമ്പോൾ `JWT_SECRET`, `ADMIN_PASSWORD` എന്നിവ സെറ്റ് ചെയ്തിട്ടില്ലെങ്കിൽ ആപ്പ് ക്രാഷ് ചെയ്യിച്ച് സുരക്ഷിതമാക്കുക (Fail-fast principle).

### 5. വെബ്സോക്കറ്റ് ഓതന്റിക്കേഷൻ ഹാൻഡ്ഷേക്ക് നൽകുക:
```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication token required'));
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    socket.data.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});
```

### 6. റേറ്റ് ലിമിറ്റിംഗും ഹെൽമെറ്റും ആഡ് ചെയ്യുക:
`express-rate-limit`, `helmet` എന്നിവ ഇൻസ്റ്റാൾ ചെയ്ത് എല്ലാ റൂട്ടുകളിലും സുരക്ഷ ഉറപ്പാക്കുക:
```typescript
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

app.use(helmet());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 മിനിറ്റ്
  max: 10, // ഓരോ IP-ക്കും പരമാവധി 10 ലോഗിൻ ശ്രമങ്ങൾ
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' }
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/send-otp', authLimiter);
app.use('/api/v1/admin/login', authLimiter);
```

---

## 📊 5. സെക്യൂരിറ്റി റിസ്ക് മാട്രിക്സ് (Pre-Production Risk Evaluation)

| റിസ്ക് ലെവൽ | കണ്ടെത്തിയ വൾനറബിലിറ്റികൾ | പരിഹരിച്ച ശേഷമുള്ള അവസ്ഥ |
| :--- | :--- | :--- |
| 🔴 **CRITICAL (P0)** | • `otpPreview` വഴി മുഴുവൻ അക്കൗണ്ടുകളും പിടിച്ചെടുക്കൽ<br>• മാസ് അസൈൻമെന്റ് വഴി അഡ്മിൻ ആകൽ<br>• അൺഓതറൈസ്ഡ് യൂസർ ഡിലീഷൻ | 🟢 പൂർണ്ണമായും ബ്ലോക്ക് ചെയ്യപ്പെടും |
| 🟠 **HIGH (P1)** | • വെബ്സോക്കറ്റിലൂടെ ടിക്കറ്റ് ഡാറ്റ ചോർത്തൽ<br>• DMs പരസ്യമായി തുറന്നുകിടക്കൽ<br>• 1,000 ബോട്ട് റിക്വസ്റ്റുകൾ മൂലമുള്ള DoS | 🟢 ഓതന്റിക്കേഷൻ & റേറ്റ് ലിമിറ്റുകൾ വഴി പരിഹൃതമാകും |
| 🟡 **MEDIUM (P2)** | • ഹോട്ടൽ ബുക്കിംഗിൽ വില മാറ്റിയെഴുതൽ (Price Tampering)<br>• മെമ്മറി സ്റ്റേറ്റ് ഡ്യൂപ്ലിക്കേഷൻ | 🟢 ഡാറ്റാബേസ് പ്രൈസ് വെരിഫിക്കേഷൻ വഴി സുരക്ഷിതമാകും |

---
**നിഗമനം:** മുകളിൽ പറഞ്ഞ 6 മാറ്റങ്ങൾ വരുത്താതെ പ്രൊഡക്ഷനിലേക്ക് പുഷ് ചെയ്താൽ, ഏതൊരു തുടക്കക്കാരനായ അറ്റാക്കർക്കോ അല്ലെങ്കിൽ ബോട്ട് അറ്റാക്കുകൾക്കോ പ്ലാറ്റ്‌ഫോമിനെ മിനിറ്റുകൾക്കകം പൂർണ്ണമായി തകർക്കാൻ സാധിക്കും. ഈ ഫിക്സുകൾ ഉടൻ തന്നെ ഇംപ്ലിമെന്റ് ചെയ്യാവുന്നതാണ്.

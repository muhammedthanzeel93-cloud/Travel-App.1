# 🤝 ഹാക്കറും ഡെവലപ്പറും തമ്മിലുള്ള സെക്യൂരിറ്റി ഡിസ്കഷൻ & കോഡ് റെമഡിയേഷൻ ഗൈഡ്
**Red Team (Ethical Hacker) & Blue Team (Senior Lead Developer) Hardening Consultation**

---

## 📌 എക്സിക്യൂട്ടീവ് സമ്മറി (Executive Overview)

ഒരു പ്ലാറ്റ്‌ഫോം പ്രൊഡക്ഷനിലേക്ക് പുഷ് ചെയ്യുന്നതിന് മുൻപ് **എത്തിക്കൽ ഹാക്കറും (Red Team)** **സീനിയർ ലീഡ് ഡെവലപ്പറും (Blue Team)** ഒപ്പമിരുന്ന് നടത്തിയ സെക്യൂട്ടറി ആർക്കിടെക്ചർ റിവ്യൂ മീറ്റിംഗിന്റെ സമഗ്രമായ റിപ്പോർട്ടാണിത്.

ഈ ചർച്ചയിൽ, രജിസ്ട്രേഷൻ സമയത്ത് ഹാക്കർമാർ ഉപയോഗിക്കുന്ന **റോൾ മാനിപ്പുലേഷൻ (Role Injection & Privilege Escalation)**, വരാനിരിക്കുന്ന **`TRAVEL_AGENCY` (ട്രാവൽ ഏജൻസി)** റോളിനെ ഹാക്കർമാർ ദുരുപയോഗം ചെയ്യാൻ സാധ്യതയുള്ള വഴികൾ, കൂടാതെ സിസ്റ്റത്തിലെ സാധാരണ ഉപഭോക്താക്കൾ സൈൻ-അപ്പ് ചെയ്യുമ്പോൾ അവരുടെ റോൾ കർശനമായി **`USER`** ആയി ലോക്ക് ചെയ്യേണ്ടതിന്റെ അനിവാര്യത എന്നിവ വിശദമായി ഉൾപ്പെടുത്തിയിരിക്കുന്നു.

```
       [🔴 എത്തിക്കൽ ഹാക്കർ (Red Team)]                   [🟢 സീനിയർ ഡെവലപ്പർ (Blue Team)]
                  │                                                 │
                  │─── 1. "നിങ്ങളുടെ OTP API റെസ്‌പോൺസിൽ കാണാം" ───►│
                  │                                                 │─── "otpPreview ഉടൻ നീക്കം ചെയ്യാം;
                  │                                                 │     ഇമെയിൽ/SMS വഴി മാത്രം അയക്കാം"
                  │                                                 │
                  │─── 2. "എനിക്ക് 'TRAVEL_AGENCY' അല്ലെങ്കിൽ ───────►│
                  │        'SUPER_ADMIN' റോൾ സ്വയം നൽകാം"           │─── "പബ്ലിക് സൈൻ-അപ്പിൽ 'USER' മാത്രമായി
                  │                                                 │     ലോക്ക് ചെയ്യും! 'TRAVEL_AGENCY'
                  │                                                 │     വെരിഫിക്കേഷൻ വഴി മാത്രമേ നൽകൂ!"
                  │                                                 │
                  │─── 3. "ലോഗിൻ ചെയ്യാതെ യൂസർമാരെ ഡിലീറ്റ് ചെയ്യാം" ─►│
                  │                                                 │─── "Auth & RBAC Middleware നിർമ്മിച്ച്
                  │                                                 │     റൂട്ടുകൾ പൂർണ്ണമായി ലോക്ക് ചെയ്യാം"
                  │                                                 │
                  │─── 4. "1,000 റിക്വസ്റ്റ് അയച്ചാൽ സെർവർ ഫ്രീസ് ആവും" ─►│
                  │                                                 │─── "Express Rate Limit & Slowdown
                  │                                                 │     ആക്റ്റിവേറ്റ് ചെയ്ത് തടയാം"
```

---

## 💬 ഭാഗം 1: ഹാക്കറും ഡെവലപ്പറും തമ്മിലുള്ള സാങ്കേതിക ചർച്ച (Technical Deep-Dive)

---

### 🚨 ലൂപ്പ്‌ഹോൾ 1: API റെസ്‌പോൺസിലൂടെ OTP ലീക്കാകുന്നു (Account Takeover)

#### 🔴 ഹാക്കർ (Attack PoC):
> *"സുഹൃത്തേ, നിങ്ങളുടെ പാസ്‌വേഡ് റീസെറ്റ് ഫ്ലോ നോക്കൂ (`POST /api/v1/auth/forgot-password/request`). ഏതെങ്കിലും ഒരു യൂസറുടെയോ സാക്ഷാൽ സൂപ്പർ അഡ്മിന്റെയോ ഇമെയിൽ നൽകി ഞാൻ ഈ എൻഡ്‌പോയിന്റിലേക്ക് ഒരു റിക്വസ്റ്റ് അയച്ചു.*  
> *സാധാരണഗതിയിൽ OTP അവരുടെ ഇമെയിലിലേക്കാണ് പോകേണ്ടത്. എന്നാൽ നിങ്ങളുടെ സെർവർ എനിക്ക് തിരികെ തന്ന JSON റെസ്‌പോൺസിൽ `otpPreview: '682149'` എന്ന് പച്ചയായി എഴുതിവെച്ചിരിക്കുന്നു!*  
> *എനിക്ക് ഇമെയിൽ ഹാക്ക് ചെയ്യേണ്ട ആവശ്യമില്ല; ആ OTP ഉടൻ തന്നെ `/forgot-password/reset`-ൽ കൊടുത്താൽ 5 സെക്കൻഡിനുള്ളിൽ ഞാൻ ആ അക്കൗണ്ടിന്റെ പുതിയ പാസ്‌വേഡ് സെറ്റ് ചെയ്ത് അക്കൗണ്ട് കൈക്കലാക്കും (Instant Account Takeover)!"*

#### 🟢 സീനിയർ ഡെവലപ്പർ (Fix & Prevention):
> *"ശരിയാണ്, അത് ലോക്കൽ ഡെവലപ്‌മെന്റ് സമയത്ത് ടെസ്റ്റ് ചെയ്യാൻ വേണ്ടി വെച്ചതാണ്. പ്രൊഡക്ഷൻ ബിൽഡിൽ ഇത് അത്യന്തം അപകടകരമാണ്. ക്ലയന്റിലേക്ക് ഒരിക്കലും OTP തിരികെ അയക്കാൻ പാടില്ല."*

**നടപ്പിലാക്കേണ്ട കോഡ് തിരുത്തൽ (`backend/src/features/auth/auth.controller.ts` & `adminOperations.controller.ts`):**
```typescript
// ❌ പഴയ അപകടകരമായ കോഡ്:
res.status(200).json({
  success: true,
  message: `OTP sent to ${maskedTarget}.`,
  otpPreview: otpCode // ⚠️ ഹാക്കർമാർക്ക് സൗജന്യമായി ലഭിക്കുന്നു!
});

// ✅ പുതിയ സുരക്ഷിതമായ കോഡ്:
res.status(200).json({
  success: true,
  message: `6-digit verification code has been dispatched to ${maskedTarget}.`,
  expiresInSeconds: 600
  // otpPreview പൂർണ്ണമായും ഒഴിവാക്കി. ക്ലയന്റിലേക്ക് ഒരിക്കലും OTP അയക്കരുത്!
});
```

---

### 🚨 ലൂപ്പ്‌ഹോൾ 2: രജിസ്ട്രേഷനിലെ റോൾ മാനിപ്പുലേഷൻ & `TRAVEL_AGENCY` ചൂഷണം (Mass Assignment)

#### 🔴 ഹാക്കർ (Attack PoC):
> *"നിങ്ങളുടെ സൈൻ-അപ്പ് എൻഡ്പോയിന്റിൽ (`POST /api/v1/auth/register`) ഞാൻ താഴെ പറയുന്ന തരത്തിലുള്ള ഒരു പേലോഡ് ഇൻജക്റ്റ് ചെയ്തു:*  
> ```json
> {
>   "username": "rogue_agent",
>   "password": "Password@123",
>   "role": "TRAVEL_AGENCY" 
> }
> ```
> *(അല്ലെങ്കിൽ `"role": "SUPER_ADMIN"`).*  
> 
> *നിങ്ങളുടെ കണ്ട്രോളറിലെ കോഡ് നോക്കൂ:*  
> `role: (req.body.role as any) || 'USER'`  
> 
> *ക്ലയന്റിൽ നിന്ന് വരുന്ന `role` വേരിയബിളിനെ യാതൊരു പരിശോധനയുമില്ലാതെ സെർവർ ഡാറ്റാബേസിൽ സേവ് ചെയ്യുന്നു!*  
> 
> **ഇതിന്റെ അപകടം എന്തെന്നാൽ:**  
> പ്ലാറ്റ്‌ഫോമിൽ ഭാവിയിൽ വരാനിരിക്കുന്ന ഒരു പ്രധാന ബിസിനസ്സ് ഫീച്ചറാണ് **`TRAVEL_AGENCY` (ട്രാവൽ ഏജൻസി)**. ട്രാവൽ ഏജൻസികൾക്ക് ബൾക്ക് ടിക്കറ്റിംഗ്, ഏജൻസി കമ്മീഷൻ, B2B സ്പെഷ്യൽ നിരക്കുകൾ, ട്രെയിൻ/ഫ്ലൈറ്റ് ക്വാട്ടകൾ എന്നിവ ലഭിക്കും. ഒരു സാധാരണ ഹാക്കർ സ്വയം `TRAVEL_AGENCY` ആയി രജിസ്റ്റർ ചെയ്താൽ:*  
> 1. *അയാൾക്ക് സാധാരണ ഉപഭോക്താക്കൾക്ക് ലഭിക്കാത്ത ഏജൻസി ഡിസ്‌കൗണ്ടുകളും ഫീച്ചറുകളും ലഭിക്കും.*  
> 2. *യാതൊരു ബിസിനസ്സ് ലൈസൻസോ KYC വേരിഫിക്കേഷനോ ഇല്ലാതെ പ്ലാറ്റ്‌ഫോമിലെ ഏജൻസി ക്വാട്ടകൾ ദുരുപയോഗം ചെയ്യാം.*  
> 3. *അല്ലെങ്കിൽ `SUPER_ADMIN` നൽകി സിസ്റ്റത്തിന്റെ മുഴുവൻ കൺട്രോളും കൈക്കലാക്കാം!"*

#### 🟢 സീനിയർ ഡെവലപ്പർ (Architectural Fix & Prevention):
> *"നിങ്ങൾ ചൂണ്ടിക്കാണിച്ചത് കൃത്യമായ ഒരു ബിസിനസ്സ് ലോജിക് തകരാറാണ്. പബ്ലിക് രജിസ്ട്രേഷനിലൂടെ സൈൻ-അപ്പ് ചെയ്യുന്ന ഏതൊരു സാധാരണക്കാരന്റെയും റോൾ **നിർബന്ധമായും `USER` എന്ന ഒരൊറ്റ റോളിലേക്ക് കർശനമായി ലോക്ക് ചെയ്യണം (Hardcode / Strict Lock).** ക്ലയന്റ് എന്ത് റോൾ അയച്ചാലും അത് പൂർണ്ണമായും അവഗണിക്കണം.*  
> 
> *ഇനി, **`TRAVEL_AGENCY`** പോലെയുള്ള പ്രത്യേക റോളുകൾ എങ്ങനെ സുരക്ഷിതമായി നൽകണം എന്ന് ഞാൻ വിശദീകരിക്കാം:"*

#### 🛠️ സീനിയർ ഡെവലപ്പറുടെ 2-ടയർ റോൾ ആർക്കിടെക്ചർ സൊല്യൂഷൻ:

1. **ടയർ 1: പൊതുവായ സൈൻ-അപ്പ് (Public Registration):**
   - രജിസ്റ്റർ ചെയ്യുന്ന എല്ലാവരുടെയും റോൾ ഡിഫോൾട്ടായി **`USER`** ആയി മാത്രമേ ഡാറ്റാബേസിൽ സേവ് ചെയ്യൂ.
   - ക്ലയന്റ് ബോഡിയിൽ `role` ഫീൽഡ് വന്നാൽ അത് റീഡ് ചെയ്യുകയേ ഇല്ല.

2. **ടയർ 2: ട്രാവൽ ഏജൻസി ഓൺബോർഡിംഗ് (Separate Agency Application Flow):**
   - ഒരു ട്രാവൽ ഏജൻസിക്ക് അക്കൗണ്ട് വേണമെങ്കിൽ അവർ സാധാരണ രജിസ്ട്രേഷൻ വഴി റോൾ എടുക്കാൻ പാടില്ല.
   - അതിനായി പ്രത്യേക റൂട്ട് ഉണ്ടാക്കണം: `POST /api/v1/agency/apply`.
   - ഏജൻസി അവരുടെ IATA ലൈസൻസ്, ജിഎസ്ടി/രജിസ്ട്രേഷൻ സർട്ടിഫിക്കറ്റ്, ബിസിനസ്സ് വിശദാംശങ്ങൾ എന്നിവ അപ്‌ലോഡ് ചെയ്യണം.
   - അവരുടെ അക്കൗണ്ട് സ്റ്റാറ്റസ് `PENDING_VERIFICATION` ആയിരിക്കും.
   - **സൂപ്പർ അഡ്മിൻ ഡോക്യുമെന്റുകൾ പരിശോധിച്ച് അപ്രൂവ് ചെയ്താൽ മാത്രമേ** ആ അക്കൗണ്ടിന്റെ റോൾ `USER`-ൽ നിന്ന് `TRAVEL_AGENCY`-ലേക്ക് മാറ്റാൻ പാടുള്ളൂ.

**നടപ്പിലാക്കേണ്ട കോഡ് തിരുത്തൽ (`backend/src/features/auth/auth.controller.ts`):**
```typescript
// ❌ പഴയ അപകടകരമായ കോഡ്:
const newMemoryUser: MemoryUser = {
  ...
  role: (req.body.role as any) || 'USER', // ⚠️ ക്ലയന്റിന് ഇഷ്ടമുള്ള റോൾ ഇൻജക്റ്റ് ചെയ്യാം!
  ...
};

// ✅ പുതിയ സുരക്ഷിതമായ കോഡ്:
// പബ്ലിക് രജിസ്ട്രേഷൻ വഴി വരുന്ന എല്ലാവരുടെയും റോൾ കർശനമായി 'USER' ആയി ലോക്ക് ചെയ്യുന്നു!
const DEFAULT_LOCKED_ROLE = 'USER';

const newMemoryUser: MemoryUser = {
  id: newUserId,
  username: cleanUsername,
  name: name ? String(name).trim() : cleanUsername,
  email: cleanEmail,
  phone: cleanPhone,
  passwordHash,
  role: DEFAULT_LOCKED_ROLE, // 🔒 ക്ലയന്റ് റോൾ അവഗണിച്ചു, 'USER' ആയി ലോക്ക് ചെയ്തു
  avatarUrl: `https://images.unsplash.com/...`,
  bio: 'Travel Buddy Explorer',
  createdAt: new Date().toISOString()
};

// MongoDB-യിലും കർശനമായി 'USER' റോൾ മാത്രം സേവ് ചെയ്യുക:
if (isDbConnected()) {
  await User.create({
    username: cleanUsername,
    name: newMemoryUser.name,
    email: cleanEmail,
    phone: cleanPhone,
    passwordHash,
    role: DEFAULT_LOCKED_ROLE, // 🔒 'USER' മാത്രം
    status: 'ACTIVE',
    avatarUrl: newMemoryUser.avatarUrl,
    bio: newMemoryUser.bio
  });
}
```

**യൂസർ മോഡലിലെ റോൾ എന്യൂം അപ്‌ഡേറ്റ് (`backend/src/features/auth/user.model.ts`):**
```typescript
export interface IUser extends Document {
  ...
  // സിസ്റ്റം റോളുകൾ കൃത്യമായി വേർതിരിക്കുന്നു:
  role: 'USER' | 'TRAVEL_AGENCY' | 'HOTEL_HOST' | 'ADMIN' | 'SUPER_ADMIN';
  ...
}
```

---

### 🚨 ലൂപ്പ്‌ഹോൾ 3: സുരക്ഷാ കവചമില്ലാത്ത അഡ്മിൻ റൂട്ടുകൾ (Unauthenticated Sabotage)

#### 🔴 ഹാക്കർ (Attack PoC):
> *"നിങ്ങളുടെ റൂട്ട് ഫയൽ നോക്കൂ (`auth.routes.ts` വരി 33-35):*  
> - `router.get('/users', AuthController.getAllUsers);`  
> - `router.post('/users/delete', AuthController.deleteUser);`  
> - `router.post('/users/toggle-block', AuthController.toggleBlockUser);`  
> *ഇവിടെ യാതൊരു മിഡിൽവെയറുമില്ല! ഞാൻ ലോഗിൻ ചെയ്യാതെ തന്നെ ഒരു cURL റിക്വസ്റ്റ് അയച്ചു:*  
> `curl -X POST http://localhost:5000/api/v1/auth/users/delete -d '{"username": "admin"}'`  
> *നിങ്ങളുടെ അഡ്മിനെ ഞാൻ ഡാറ്റാബേസിൽ നിന്ന് തൂത്തെറിഞ്ഞു! ആർക്കും മുഴുവൻ ഉപഭോക്താക്കളെയും ഒറ്റയടിക്ക് ഡിലീറ്റ് ചെയ്യാം."*

#### 🟢 സീനിയർ ഡെവലപ്പർ (Fix & Prevention):
> *"ഇതിനായി ഞങ്ങൾ ഒരു സെൻട്രലൈസ്ഡ് `auth.middleware.ts` ഉണ്ടാക്കുന്നു. ഇത് JWT ടോക്കൺ വേരിഫൈ ചെയ്യുകയും റോൾ `SUPER_ADMIN` ആണെങ്കിൽ മാത്രം റിക്വസ്റ്റ് മുന്നോട്ട് വിടുകയും ചെയ്യും."*

**1. പുതിയ മിഡിൽവെയർ (`backend/src/middlewares/auth.middleware.ts`):**
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../core/config/index.js';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string; role: string };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access denied. Valid Bearer token required.' });
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

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Forbidden: Super Administrator privileges required.' });
    return;
  }
  next();
};
```

**2. റൂട്ട് പ്രൊട്ടക്റ്റ് ചെയ്യുന്നു (`backend/src/features/auth/auth.routes.ts`):**
```typescript
import { authenticateToken, requireAdmin } from '../../middlewares/auth.middleware.js';

// ✅ കവചം തീർത്തു: ലോഗിൻ ചെയ്ത സൂപ്പർ അഡ്മിന് മാത്രമേ ഇനി ഇവിടെ പ്രവേശനമുള്ളൂ!
router.get('/users', authenticateToken, requireAdmin, AuthController.getAllUsers);
router.post('/users/delete', authenticateToken, requireAdmin, AuthController.deleteUser);
router.post('/users/toggle-block', authenticateToken, requireAdmin, AuthController.toggleBlockUser);
```

---

### 🚨 ലൂപ്പ്‌ഹോൾ 4: ഹാർഡ്‌കോഡ് ചെയ്ത ബാക്ക്ഡോർ പാസ്‌വേഡും മാസ്റ്റർ OTP-യും

#### 🔴 ഹാക്കർ (Attack PoC):
> *"നിങ്ങളുടെ `adminOperations.controller.ts` ഫയലിലെ വരി 150 നോക്കൂ:*  
> `const isMasterTestOtp = cleanOtp === '492810' ...`  
> *ഡിഫോൾട്ട് പാസ്‌വേഡ് `Admin@123` എന്നും കൊടുത്തിരിക്കുന്നു. 2FA ചോദിക്കുമ്പോൾ എന്റെ കയ്യിലുള്ള `492810` എന്ന മാസ്റ്റർ കോഡ് നൽകിയാൽ എനിക്ക് അഡ്മിൻ ആയി ലോഗിൻ ചെയ്യാം!"*

#### 🟢 സീനിയർ ഡെവലപ്പർ (Fix & Prevention):
> *"ഈ ബാക്ക്ഡോർ കോഡ് ഉടൻ ഡിലീറ്റ് ചെയ്യും. ഇമെയിലിലേക്ക് അയക്കുന്ന ആക്റ്റീവ് ഒടിപി മാത്രമേ സ്വീകരിക്കൂ. ഒപ്പം പ്രൊഡക്ഷൻ ബൂട്ട്-ചെക്ക് ഉറപ്പാക്കും."*

**നടപ്പിലാക്കേണ്ട കോഡ് തിരുത്തൽ (`backend/src/features/admin-operations/adminOperations.controller.ts`):**
```typescript
// ✅ പുതിയ സുരക്ഷിതമായ കോഡ്:
// ബാക്ക്ഡോർ മാസ്റ്റർ OTP പൂർണ്ണമായും ഡിലീറ്റ് ചെയ്തു!
if (!record || record.otp !== cleanOtp || record.expiresAt <= Date.now()) {
  res.status(400).json({
    success: false,
    message: 'Invalid or expired OTP code.'
  });
  return;
}
```

---

### 🚨 ലൂപ്പ്‌ഹോൾ 5: സ്വകാര്യ ചാറ്റുകളും വോയ്‌സ് നോട്ടുകളും ആർക്കും കാണാം (Mass Snooping)

#### 🔴 ഹാക്കർ (Attack PoC):
> *"നിങ്ങളുടെ സോഷ്യൽ റൂട്ടിൽ `/api/v1/social/messages` എന്നൊരു എൻഡ്പോയിന്റ് ഉണ്ട്. ഇവിടെ `DirectMessage.find({})` എന്നാണ് കൊടുത്തിരിക്കുന്നത്.*  
> *ഒരു സാധാരണ യൂസർ ആപ്പ് തുറക്കുമ്പോൾ അവർക്ക് വന്നിട്ടുള്ള മെസ്സേജുകൾ മാത്രമല്ല, സിസ്റ്റത്തിലുള്ള എല്ലാ ട്രാവലേഴ്‌സും അങ്ങോട്ടുമിങ്ങോട്ടും അയച്ച രഹസ്യ വോയ്‌സ് നോട്ടുകളും, ടിക്കറ്റുകളും, ചാറ്റുകളും സർവർ അയച്ചുകൊടുക്കുന്നു! (Mass IDOR Leak)"*

#### 🟢 സീനിയർ ഡെവലപ്പർ (Fix & Prevention):
> *"ഡാറ്റാബേസ് ക്വറിയിൽ ലോഗിൻ ചെയ്ത യൂസറുടെ ഐഡി മാത്രം ഫിൽട്ടർ ചെയ്യും."*

**നടപ്പിലാക്കേണ്ട കോഡ് തിരുത്തൽ (`backend/src/features/social/social.controller.ts`):**
```typescript
// ✅ പുതിയ കോഡ് (ലോഗിൻ ചെയ്ത യൂസറുടെ ചാറ്റുകൾ മാത്രം നൽകുക):
export static async getDirectMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.id;
  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const messages = await DirectMessage.find({
    $or: [{ senderId: currentUserId }, { recipientId: currentUserId }]
  })
  .populate('senderId', 'name username avatarUrl')
  .sort({ createdAt: -1 });

  res.status(200).json({ success: true, messages });
}
```

---

### 🚨 ലൂപ്പ്‌ഹോൾ 6: വെബ്സോക്കറ്റിലൂടെ തത്സമയ ടിക്കറ്റിംഗ് ഡാറ്റ ചോർത്തൽ (Eavesdropping)

#### 🔴 ഹാക്കർ (Attack PoC):
> *"നിങ്ങളുടെ സോക്കറ്റ് സെർവറിലേക്ക് ഒരു ക്ലയന്റ് കണക്റ്റ് ചെയ്ത് `socket.emit('join:admin-desk')` അയച്ചാൽ യാതൊരു ചോദ്യവുമില്ലാതെ എന്നെ `admin-operations` റൂമിൽ കയറ്റിയിരുത്തുന്നു. യാത്രക്കാരുടെ മുഴുവൻ പേര്, ഫോൺ, PNR, പാസ്‌പോർട്ട് വിവരങ്ങൾ തത്സമയം എന്റെ സ്ക്രീനിൽ ലഭിക്കും!"*

#### 🟢 സീനിയർ ഡെവലപ്പർ (Fix & Prevention):
> *"സോക്കറ്റ് ഹാൻഡ്‌ഷെയ്ക്കിൽ JWT വേരിഫൈ ചെയ്യുന്ന `io.use()` ഗാർഡ് സ്ഥാപിക്കും. അഡ്മിൻ അല്ലാത്തവരെ സോക്കറ്റിൽ നിന്ന് ഡിസ്കണക്റ്റ് ചെയ്യും."*

**നടപ്പിലാക്കേണ്ട കോഡ് തിരുത്തൽ (`backend/src/core/sockets/operationsHub.ts`):**
```typescript
// ✅ സോക്കറ്റ് കണക്ഷനിൽ സെക്യൂരിറ്റി ഗാർഡ് ചേർക്കുന്നു:
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication token required for Socket'));
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    socket.data.user = decoded;
    next();
  } catch (err) {
    next(new Error('Unauthorized socket connection'));
  }
});

io.on('connection', (socket: Socket) => {
  socket.on('join:admin-desk', () => {
    if (socket.data.user?.role !== 'SUPER_ADMIN') {
      console.warn(`🛑 Unauthorized socket breach attempt by user: ${socket.data.user?.username}`);
      socket.disconnect();
      return;
    }
    socket.join('admin-operations');
  });
});
```

---

### 🚨 ലൂപ്പ്‌ഹോൾ 7: 1,000 ഹാക്കർമാർ ഒരേസമയം അറ്റാക്ക് ചെയ്താൽ സെർവർ തകരുന്നു (DoS & CPU Starvation)

#### 🔴 ഹാക്കർ (Attack PoC):
> *"ഞങ്ങളുടെ കമ്മ്യൂണിറ്റിയിലെ 1,000 ഹാക്കർമാർ ഒരേ സെക്കൻഡിൽ `/api/v1/auth/login`-ലേക്ക് റിക്വസ്റ്റുകൾ അയച്ചപ്പോൾ `bcrypt` കാരണം Node.js സെർവർ 100% സിപിയുവിൽ എത്തി ആപ്പ് ഫ്രീസ് ആയി!"*

#### 🟢 സീനിയർ ഡെവലപ്പർ (Fix & Prevention):
> *"`express-rate-limit`, `helmet` എന്നിവ ഉടൻ ആഡ് ചെയ്ത് ഓരോ ഐപിക്കും പരമാവധി റിക്വസ്റ്റുകൾ നിജപ്പെടുത്തും."*

**നടപ്പിലാക്കേണ്ട കോഡ് തിരുത്തൽ (`backend/src/server.ts`):**
```typescript
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

app.use(helmet());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 മിനിറ്റ്
  max: 10, // പരമാവധി 10 ശ്രമങ്ങൾ
  message: { success: false, message: 'Too many attempts. Blocked for 15 minutes.' }
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/send-otp', authLimiter);
app.use('/api/v1/auth/forgot-password/request', authLimiter);
app.use('/api/v1/admin/login', authLimiter);
```

---

### 🚨 ലൂപ്പ്‌ഹോൾ 8: ഹോട്ടൽ ബുക്കിംഗിൽ വില മാറ്റിയെഴുതൽ (Price Tampering Fraud)

#### 🔴 ഹാക്കർ (Attack PoC):
> *"`POST /api/v1/stays/book` റൂട്ടിൽ ഞാൻ `{ "packagePrice": 0 }` എന്ന് അയച്ച് ലക്ഷ്വറി സ്യൂട്ട് സൗജന്യമായി ബുക്ക് ചെയ്തു!"*

#### 🟢 സീനിയർ ഡെവലപ്പർ (Fix & Prevention):
> *"ക്ലയന്റ് അയക്കുന്ന വില സ്വീകരിക്കാതെ, സെർവർ ഡാറ്റാബേസിൽ നിന്ന് ഹോട്ടൽ റൂമിന്റെ ഒറിജിനൽ വില എടുത്തു മാത്രമേ ബുക്കിംഗ് കൺഫേം ചെയ്യൂ."*

**നടപ്പിലാക്കേണ്ട കോഡ് തിരുത്തൽ (`backend/src/features/stays/stays.controller.ts`):**
```typescript
// ✅ പുതിയ കോഡ് (സെർവർ വില ഉറപ്പാക്കുന്നു):
export static async bookStayPackage(req: Request, res: Response): Promise<void> {
  const { hotelId, roomId, packageId } = req.body;

  const verifiedHotel = mockHotels.find(h => h._id === hotelId);
  const verifiedRoom = verifiedHotel?.rooms.find(r => r._id === roomId);
  const verifiedPackage = verifiedRoom?.packages.find(p => p.packageName === packageId);

  if (!verifiedPackage) {
    res.status(404).json({ success: false, message: 'Invalid hotel package selected.' });
    return;
  }

  const officialPrice = verifiedPackage.packagePrice;
  const platformCommission = Math.round(officialPrice * 0.12);
  const hostPayout = officialPrice - platformCommission;
  // തുടർന്ന് ബുക്കിംഗ് വൗച്ചർ ഇഷ്യൂ ചെയ്യുക...
}
```

---

## 🗺️ ഭാഗം 2: പ്രൊഡക്ഷൻ സെക്യൂരിറ്റി റോഡ്മാപ്പ് (Step-by-Step Hardening Roadmap)

```
[ഘട്ടം 1: എമർജൻസി ഹോട്ട്ഫിക്സുകൾ (Day 0)]
  ├── 1. otpPreview പൂർണ്ണമായും ഒഴിവാക്കുക
  ├── 2. 492810 മാസ്റ്റർ OTP ബാക്ക്ഡോർ നീക്കം ചെയ്യുക
  ├── 3. പബ്ലിക് രജിസ്ട്രേഷനിൽ റോൾ 'USER' ആയി കർശനമായി ലോക്ക് ചെയ്യുക (No Client Override)
  └── 4. 'TRAVEL_AGENCY' റോൾ പബ്ലിക് സൈൻ-അപ്പിൽ ഇൻജക്റ്റ് ചെയ്യുന്നത് പൂർണ്ണമായി തടയുക

[ഘട്ടം 2: പെരിമീറ്റർ & ഇൻഫ്രാസ്ട്രക്ചർ സെക്യൂരിറ്റി (Day 1)]
  ├── 1. express-rate-limit & helmet ആഡ് ചെയ്യുക
  ├── 2. DoS / Brute-force അറ്റാക്കുകൾ തടയാൻ IP-ബേസ്ഡ് ലിമിറ്റുകൾ സെറ്റ് ചെയ്യുക
  └── 3. വെബ്സോക്കറ്റിൽ Socket.io Auth ഹാൻഡ്‌ഷേക്ക് ഗാർഡ് സ്ഥാപിക്കുക

[ഘട്ടം 3: ഓതന്റിക്കേഷൻ & RBAC മിഡിൽവെയർ (Day 2)]
  ├── 1. backend/src/middlewares/auth.middleware.ts നടപ്പിലാക്കുക
  ├── 2. /users/delete, /users/toggle-block എന്നിവ സൂപ്പർ അഡ്മിനായി മാത്രം പരിമിതപ്പെടുത്തുക
  └── 3. /social/messages-ൽ പ്രൈവസി ഫിൽട്ടർ (IDOR തടയൽ) നൽകുക

[ഘട്ടം 4: ബിസിനസ്സ് ലോജിക്കും ഡാറ്റാബേസ് ലോക്കിംഗും (Day 3)]
  ├── 1. ഹോട്ടൽ/ഫ്ലൈറ്റ് ബുക്കിംഗുകളിൽ സെർവർ-സൈഡ് പ്രൈസ് വെരിഫിക്കേഷൻ
  ├── 2. 'TRAVEL_AGENCY' ഓൺബോർഡിംഗ് വെരിഫിക്കേഷൻ ഫ്ലോ (KYC & Admin Approval) രൂപകൽപ്പന ചെയ്യുക
  └── 3. പ്രൊഡക്ഷൻ എൻവയോൺമെന്റ് കീ ചെക്ക് (Fail-fast Startup) ഉറപ്പാക്കുക
```

---

## 🎯 ഭാഗം 3: ഫൈനൽ വെരിഫിക്കേഷൻ ചെക്ക്‌ലിസ്റ്റ് (Pre-Push Checklist)

| നമ്പർ | പരിശോധന (Security Check) | പ്രതീക്ഷിക്കുന്ന ഫലം |
| :---: | :--- | :--- |
| 1 | `role: 'TRAVEL_AGENCY'` അല്ലെങ്കിൽ `role: 'SUPER_ADMIN'` നൽകി രജിസ്റ്റർ ചെയ്യാൻ ശ്രമിക്കുക | ക്ലയന്റ് റോൾ അവഗണിക്കപ്പെടണം; അക്കൗണ്ട് `'USER'` റോൾ ആയി മാത്രം സേവ് ആവണം. |
| 2 | `POST /forgot-password/request` ടെസ്റ്റ് ചെയ്യുക | റെസ്‌പോൺസിൽ `otpPreview` ഉണ്ടാകരുത്. |
| 3 | ടോക്കൺ ഇല്ലാതെ `POST /users/delete` കോൾ ചെയ്യുക | `401 Unauthorized` ലഭിക്കണം. |
| 4 | `492810` OTP നൽകി അഡ്മിൻ ലോഗിൻ ശ്രമിക്കുക | `400 Invalid OTP` ലഭിക്കണം. |
| 5 | ഒരേ മിനിറ്റിൽ 20 തവണ ലോഗിൻ ചെയ്യാൻ ശ്രമിക്കുക | `429 Too Many Requests` ലഭിക്കണം. |
| 6 | ടോക്കണില്ലാതെ സോക്കറ്റ് `join:admin-desk` ചെയ്യുക | സോക്കറ്റ് ഉടൻ ഡിസ്കണക്റ്റ് ആവണം. |

---

> [!TIP]
> **സീനിയർ ഡെവലപ്പറുടെ അവസാന വാക്ക്:**  
> *"സാധാരണ ഉപഭോക്താക്കളുടെ റോൾ `USER` ആയി ലോക്ക് ചെയ്യുന്നതിലൂടെയും, വരാനിരിക്കുന്ന `TRAVEL_AGENCY` റോൾ വെരിഫിക്കേഷൻ വഴി മാത്രം നൽകുന്നതിലൂടെയും പ്രിവിലേജ് എസ്കലേഷൻ ലൂപ്പ്‌ഹോളുകൾ 100% അടഞ്ഞു കഴിഞ്ഞു. ഇനി പ്രൊഡക്ഷനിലേക്ക് സുരക്ഷിതമായി പുഷ് ചെയ്യാം."*

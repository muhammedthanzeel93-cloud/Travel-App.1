# 🚀 മാസ്റ്റർ സെക്യൂരിറ്റി റെമഡിയേഷൻ ആക്ഷൻ പ്ലാൻ (Proceed Execution Plan)
**Master Security Hardening & Zero-Trust Production Implementation Plan**

---

## 📌 1. എക്സിക്യൂട്ടീവ് സമ്മറി (Executive Summary)

`SECURITY_PENETRATION_REPORT.md`, `HACKER_DEV_REMEDIATION_GUIDE.md`, `SENIOR_ENGINEER_SECURITY_IMPLEMENTATION_BLUEPRINT.md` എന്നീ മൂന്ന് റിപ്പോർട്ടുകളിലെയും എല്ലാ കണ്ടെത്തലുകളും സമന്വയിപ്പിച്ച് തയ്യാറാക്കിയ **പൂർണ്ണമായ എക്സിക്യൂഷൻ പ്ലാനാണിത് (Master Action Plan)**.

ഈ പ്ലാൻ അനലൈസ് ചെയ്ത ശേഷം **"Proceed"** ചെയ്യുമ്പോൾ, സിസ്റ്റത്തിലെ 8 അതീവ ഗുരുതര സുരക്ഷാ വീഴ്ചകളും പരിഹരിച്ച്, പുതിയ സുരക്ഷാ കവചങ്ങൾ (Helmet, Rate Limiter, Auth Middleware, Strict Role Locking, WebSocket Security) കോഡ്‌ബേസിൽ നേരിട്ട് നടപ്പിലാക്കും.

---

## 🎯 2. നടപ്പിലാക്കാൻ പോകുന്ന മാറ്റങ്ങളുടെ മാസ്റ്റർ ചെക്ക്‌ലിസ്റ്റ് (What Will Be Executed)

താഴെ പറയുന്ന 10 ഘട്ടങ്ങളിലൂടെയാണ് കോഡ് പൂർണ്ണമായി അപ്‌ഡേറ്റ് ചെയ്യപ്പെടുന്നത്:

```
[മാസ്റ്റർ എക്സിക്യൂഷൻ പൈപ്പ്‌ലൈൻ]
   │
   ├──► ഘട്ടം 1: സെക്യൂരിറ്റി പാക്കേജുകൾ ഇൻസ്റ്റാൾ ചെയ്യുക (helmet, express-rate-limit)
   ├──► ഘട്ടം 2: ഡാറ്റാബേസ് റോൾ എന്യൂം & മോഡൽ അപ്‌ഡേറ്റ് (user.model.ts)
   ├──► ഘട്ടം 3: പുതിയ സെൻട്രലൈസ്ഡ് Auth & RBAC മിഡിൽവെയർ നിർമ്മിക്കുക (auth.middleware.ts)
   ├──► ഘട്ടം 4: പബ്ലിക് രജിസ്ട്രേഷൻ 'USER' ആയി ലോക്ക് ചെയ്യുക, OTP ലീക്കുകൾ നീക്കുക (auth.controller.ts)
   ├──► ഘട്ടം 5: അഡ്മിൻ യൂസർ മാനേജ്‌മെന്റ് റൂട്ടുകൾ ലോക്ക് ചെയ്യുക (auth.routes.ts)
   ├──► ഘട്ടം 6: മാസ്റ്റർ OTP ബാക്ക്ഡോർ (492810) പൂർണ്ണമായി നീക്കം ചെയ്യുക (adminOperations.controller.ts)
   ├──► ഘട്ടം 7: വെബ്സോക്കറ്റിൽ JWT ഹാൻഡ്‌ഷേക്ക് ഗാർഡ് സ്ഥാപിക്കുക (operationsHub.ts)
   ├──► ഘട്ടം 8: സോഷ്യൽ ചാറ്റുകളിൽ IDOR പ്രൈവസി ഫിൽട്ടർ ഏർപ്പെടുത്തുക (social.controller.ts)
   ├──► ഘട്ടം 9: ഹോട്ടൽ ബുക്കിംഗിൽ സെർവർ-സൈഡ് പ്രൈസ് വെരിഫിക്കേഷൻ ഉറപ്പാക്കുക (stays.controller.ts)
   ├──► ഘട്ടം 10: സെർവറിൽ Helmet, Rate Limiter, Fail-fast കീ ചെക്ക് ആക്റ്റീവാക്കുക (server.ts)
   │
   └──► ഫൈനൽ: ബാക്കെൻഡ് ബിൽഡും ടെസ്റ്റ് സ്യൂട്ടുകളും റൺ ചെയ്ത് 100% വിജയം ഉറപ്പാക്കുക
```

---

## 📋 3. വിശദമായ ഫയൽ മാറ്റങ്ങളുടെ ആക്ഷൻ സ്പെസിഫിക്കേഷൻ (Step-by-Step File Actions)

---

### ഘട്ടം 1: ഡിപൻഡൻസികൾ ഇൻസ്റ്റാൾ ചെയ്യൽ
* **കമാൻഡ്:** `cd backend && npm install helmet express-rate-limit`
* **ലക്ഷ്യം:** XSS, Clickjacking, MIME സ്നിഫിംഗ് എന്നിവ തടയുന്ന HTTP സെക്യൂരിറ്റി ഹെഡറുകളും, 1,000 ഹാക്കർമാരുടെ DoS/Brute-Force അറ്റാക്കുകൾ തടയുന്ന റേറ്റ് ലിമിറ്റിംഗും ലഭ്യമാക്കുക.

---

### ഘട്ടം 2: `backend/src/features/auth/user.model.ts`
* **മാറ്റങ്ങൾ:**
  - `role` എന്യൂമിൽ `['USER', 'TRAVEL_AGENCY', 'HOTEL_HOST', 'ADMIN', 'SUPER_ADMIN']` കർശനമായി നിജപ്പെടുത്തുന്നു.
  - ഡിഫോൾട്ട് റോൾ `USER` ആയി നിശ്ചയിക്കുന്നു.
  - ട്രാവൽ ഏജൻസികളുടെ വെരിഫിക്കേഷൻ സ്റ്റാറ്റസിനായി `agencyDetails` ഫീൽഡ് സ്കീമയിൽ ചേർക്കുന്നു.

---

### ഘട്ടം 3: `backend/src/middlewares/auth.middleware.ts` (പുതിയ ഫയൽ നിർമ്മാണം)
* **മാറ്റങ്ങൾ:**
  - `authenticateToken`: ഇൻകമിംഗ് റിക്വസ്റ്റുകളിലെ Bearer JWT വേരിഫൈ ചെയ്യുന്നു.
  - `requireRole`: സ്പെസിഫിക് റോളുകൾക്ക് മാത്രം അനുമതി നൽകുന്നു.
  - `requireSuperAdmin`: സൂപ്പർ അഡ്മിൻ പ്രിവിലേജ് ഉള്ളവർക്ക് മാത്രം ആക്സസ് നൽകുന്നു.

---

### ഘട്ടം 4: `backend/src/features/auth/auth.controller.ts`
* **മാറ്റങ്ങൾ:**
  - `sendOtp`, `requestPasswordReset` എന്നിവയിൽ നിന്ന് `otpPreview` പൂർണ്ണമായി നീക്കം ചെയ്യുന്നു.
  - `register` മെത്തേഡിൽ ക്ലയന്റ് അയക്കുന്ന `role` ഇൻപുട്ട് പൂർണ്ണമായി അവഗണിച്ച്, പുതിയ അക്കൗണ്ടുകൾ നിർബന്ധമായും **`role: 'USER'`** ആയി ലോക്ക് ചെയ്യുന്നു.
  - `TRAVEL_AGENCY` പോലെയുള്ള പ്രത്യേക റോളുകൾ പബ്ലിക് രജിസ്ട്രേഷനിലൂടെ നൽകുന്നത് തടയുന്നു.

---

### ഘട്ടം 5: `backend/src/features/auth/auth.routes.ts`
* **മാറ്റങ്ങൾ:**
  - `/api/v1/auth/users` (ലിസ്റ്റ് യൂസേഴ്സ്) -> `authenticateToken`, `requireSuperAdmin` ഗാർഡ് ചേർക്കുന്നു.
  - `/api/v1/auth/users/delete` (ഡിലീറ്റ് യൂസർ) -> `authenticateToken`, `requireSuperAdmin` ഗാർഡ് ചേർക്കുന്നു.
  - `/api/v1/auth/users/toggle-block` (ബ്ലോക്ക് യൂസർ) -> `authenticateToken`, `requireSuperAdmin` ഗാർഡ് ചേർക്കുന്നു.

---

### ഘട്ടം 6: `backend/src/features/admin-operations/adminOperations.controller.ts`
* **മാറ്റങ്ങൾ:**
  - `validateAdminCredentials`-ൽ നിന്ന് `otpPreview` റെസ്‌പോൺസ് നീക്കം ചെയ്യുന്നു.
  - `verifyAdminOtp`-ൽ നിന്ന് `cleanOtp === '492810'` എന്ന മാസ്റ്റർ ബാക്ക്ഡോർ കോഡ് ശാശ്വതമായി നീക്കം ചെയ്യുന്നു.

---

### ഘട്ടം 7: `backend/src/core/sockets/operationsHub.ts`
* **മാറ്റങ്ങൾ:**
  - Socket.io ഹാൻഡ്‌ഷെയ്ക്കിൽ JWT വേരിഫൈ ചെയ്യുന്ന `io.use()` മിഡിൽവെയർ ചേർക്കുന്നു.
  - `join:admin-desk` ഈവന്റിൽ ക്ലയന്റ് സൂപ്പർ അഡ്മിൻ ആണെന്ന് ഉറപ്പുവരുത്തിയ ശേഷം മാത്രം റൂമിൽ പ്രവേശിപ്പിക്കുന്നു. അല്ലാത്തവരെ സോക്കറ്റിൽ നിന്ന് ഡിസ്കണക്റ്റ് ചെയ്യുന്നു.
  - യൂസർ വോൾട്ടിലേക്ക് മറ്റുള്ളവർ ഒളിഞ്ഞുനോക്കുന്നത് തടയുന്നു (IDOR Protection).

---

### ഘട്ടം 8: `backend/src/features/social/social.controller.ts`
* **മാറ്റങ്ങൾ:**
  - `getDirectMessages`-ൽ `DirectMessage.find({})` ഒഴിവാക്കുന്നു.
  - ലോഗിൻ ചെയ്ത യൂസർ അയച്ചതോ ലഭിച്ചതോ ആയ മെസ്സേജുകൾ മാത്രം ഡാറ്റാബേസിൽ നിന്ന് എടുക്കുന്നു:  
    `DirectMessage.find({ $or: [{ senderId: currentUserId }, { recipientId: currentUserId }] })`.

---

### ഘട്ടം 9: `backend/src/features/stays/stays.controller.ts`
* **മാറ്റങ്ങൾ:**
  - `bookStayPackage`-ൽ ക്ലയന്റ് അയക്കുന്ന `packagePrice` പൂർണ്ണമായി അവഗണിക്കുന്നു.
  - ഡാറ്റാബേസിലെ പാക്കേജ് പ്രൈസ് മാത്രം അടിസ്ഥാനമാക്കി പ്ലാറ്റ്‌ഫോം കമ്മീഷനും വൗച്ചറും നിർമ്മിക്കുന്നു (0 ദിർഹം ബുക്കിംഗ് തട്ടിപ്പ് തടഞ്ഞു).

---

### ഘട്ടം 10: `backend/src/server.ts`
* **മാറ്റങ്ങൾ:**
  - `app.use(helmet())` ചേർക്കുന്നു.
  - ഗ്ലോബൽ റേറ്റ് ലിമിറ്ററും (15 മിനിറ്റിൽ 200 റിക്വസ്റ്റ്) കർശനമായ ഓത്ത് റേറ്റ് ലിമിറ്ററും (15 മിനിറ്റിൽ 10 ശ്രമങ്ങൾ) ആക്റ്റീവാക്കുന്നു.
  - പ്രൊഡക്ഷൻ ബൂട്ട്-ചെക്ക് (Fail-Fast Verification) ഉറപ്പാക്കുന്നു.

---

## 🧪 4. വെരിഫിക്കേഷനും ടെസ്റ്റിംഗും (Post-Fix Verification)

എല്ലാ ഫയലുകളും അപ്‌ഡേറ്റ് ചെയ്ത ശേഷം താഴെ പറയുന്ന വെരിഫിക്കേഷനുകൾ റൺ ചെയ്യും:
1. `npm run build` (TypeScript Compilation - 0 Errors ഉറപ്പാക്കൽ).
2. ബാക്കെൻഡ് ടെസ്റ്റ് സ്യൂട്ടുകൾ (`npx tsx test/ticketing.test.ts`, `npx tsx test/auth.test.ts`).
3. ഓട്ടോമേറ്റഡ് സെക്യൂരിറ്റി ടെസ്റ്റുകൾ:
   - അൺഓതറൈസ്ഡ് റിക്വസ്റ്റുകൾക്ക് `401 Unauthorized` ലഭിക്കുന്നുണ്ടോ.
   - രജിസ്ട്രേഷനിൽ `TRAVEL_AGENCY` ഇൻജക്റ്റ് ചെയ്താലും `USER` ആയി സേവ് ആകുന്നുണ്ടോ.
   - റെസ്‌പോൺസുകളിൽ `otpPreview` അപ്രത്യക്ഷമായോ.
   - റേറ്റ് ലിമിറ്റ് വഴി 10 ശ്രമങ്ങൾക്ക് ശേഷം `429 Too Many Requests` വരുന്നുണ്ടോ.

---

## 🚀 5. പ്രൊസീഡ് ചെയ്യാനുള്ള തീരുമാനം (Proceed Decision)

ഈ പ്ലാൻ പ്രകാരം കോഡ്‌ബേസ് ഉടനടി സുരക്ഷിതമാക്കാൻ നിങ്ങൾ തയ്യാറാണെങ്കിൽ **"Proceed"** ക്ലിക്ക് ചെയ്യുകയോ അല്ലെങ്കിൽ അനുമതി നൽകുകയോ ചെയ്യാം. ഉടൻ തന്നെ മേൽപ്പറഞ്ഞ ഫിക്സുകൾ ഓരോന്നായി ബാക്കെൻഡിൽ നടപ്പിലാക്കി റിപ്പോർട്ട് ചെയ്യുന്നതാണ്.

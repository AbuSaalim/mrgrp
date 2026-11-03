# 📋 Comprehensive Attendance Module Audit Report

> **Date:** October 2026  
> **Status:** Audit Completed (Pending Fixes)  
> **Target Scope:** Attendance Model, APIs, Geolocation Punch In/Out, Calendar View, HR Management, and Payroll Integration.

---

## 🎯 Executive Summary
Attendance module ka overall UI (Glassmorphism, Map Coordinates, Time display) aur basic punch flow acha bana hua hai. Lekin **production readiness** aur **payroll accuracy** ke hisaab se isme **4 Critical Bugs, 2 Security Vulnerabilities, aur 4 Logic/UX Edge Cases** hain jo live hone par issues create karenge.

---

## 🚨 1. Critical & High Priority Bugs (System Breaking)

### 🔴 1.1 Rejected ya Pending Leave par Punch-In Lock Ho Jaana
* **Affected File:** [`src/app/api/attendance/today/route.ts`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/app/api/attendance/today/route.ts#L22-L30)
* **Problem:**
  Code bina status check kiye kisi bhi leave record par `isOnLeave: true` bhej deta hai:
  ```ts
  const leaveRecord = await Leave.findOne({ userId, date: today });
  if (leaveRecord) {
    return NextResponse.json({ 
      isOnLeave: true, 
      leaveStatus: leaveRecord.status 
    });
  }
  ```
* **Impact:** 
  Agar employee ne leave apply ki thi aur HR ne use **"Rejected"** kar diya, ya request abhi **"Pending"** hai, tab bhi frontend `AttendanceCard.tsx` mein **Punch-IN button gayab ho jata hai**. Jo employee office aaya hai wo punch hi nahi kar pata.
* **Recommended Fix:** 
  Sirf `status: "Approved"` par hi `isOnLeave: true` return hona chahiye:
  ```ts
  const leaveRecord = await Leave.findOne({ userId, date: today, status: "Approved" });
  ```

---

### 🔴 1.2 Mongoose Schema vs HR Edit Modal Status Enum Mismatch
* **Affected Files:**
  - [`src/models/Attendance.ts`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/models/Attendance.ts#L50-L54)
  - [`src/app/dashboard/hr/attendance/components/EditAttendanceModal.tsx`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/app/dashboard/hr/attendance/components/EditAttendanceModal.tsx#L86-L91)
* **Problem:**
  - `Attendance.ts` schema enum mein sirf ye 4 allowed hain: `["Present", "Absent", "In Progress", "Missed Out"]`.
  - Lekin HR Edit Modal ke dropdown mein options hain: **"Half Day"**, **"Weekly Off"**, **"Holiday"**.
* **Impact:**
  1. Jab HR kisi record ko "Half Day" ya "Weekly Off" set karke update/save karega, toh Mongoose validation error trigger ho sakta hai.
  2. [`src/lib/payrollEngine.ts`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/lib/payrollEngine.ts#L118) mein "Half Day" ko calculate karne ka koi logic nahi hai, isliye us din ka salary 0 ho jayega.
* **Recommended Fix:**
  - `Attendance.ts` ke enum mein `"Half Day"` aur `"Weekly Off"` add karein.
  - `payrollEngine.ts` mein `"Half Day"` ke liye 0.5 day credit aur half shift working hours ka calculation formula include karein.

---

### 🔴 1.3 "In Progress" Shifts Kabhi "Missed Out" Nahi Banti (Ghost Record)
* **Affected Files:**
  - [`src/app/api/attendance/punch/route.ts`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/app/api/attendance/punch/route.ts#L32)
  - [`src/lib/payrollEngine.ts`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/lib/payrollEngine.ts#L118-L148)
* **Problem:**
  Subah Punch-IN karne par status `"In Progress"` ban jata hai. Agar employee shaam ko Punch-OUT karna bhool gaya:
  - System mein koi automated midnight cron ya background sync nahi hai jo unclosed shifts ko `"Missed Out"` kare.
  - Document hamesha ke liye `"In Progress"` status mein reh jata hai.
* **Impact on Payroll:**
  `payrollEngine.ts` sirf `status === "Present"` ko `totalPresentDays` mein ginta hai, aur `status === "Absent"` ko `totalAbsentDays` mein ginta hai. `"In Progress"` rehne par wo din **na Present count hota hai, na Absent** — database mein hone ke bawajood calculation se gayab ho jata hai.
* **Recommended Fix:**
  Ek automatic midnight cron/job ya API hook banayein jo past dates ke pending `"In Progress"` records ko automatically `"Missed Out"` mark kare.

---

### 🔴 1.4 Absent Days Database Mein Kabhi Create Hi Nahi Hote
* **Affected Files:**
  - [`src/app/api/hr/attendance/route.ts`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/app/api/hr/attendance/route.ts#L14)
  - [`src/lib/payrollEngine.ts`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/lib/payrollEngine.ts#L82-L85)
* **Problem:**
  Jo employee office nahi aata, uske liye us din ka koi `Attendance` document DB mein insert hi nahi hota.
* **Impact:**
  1. **HR Attendance View:** `Attendance.find({ date: queryDate })` sirf unhi logo ko fetch karta hai jinhone punch kiya hai. Jo log **Absent** hain wo HR table mein aate hi nahi hain, jisse HR ko pata hi nahi chalta kaun kaun absent hai.
  2. **Payroll Deduction Engine:** `payrollEngine` loop chalata hai:
     ```ts
     else if (record.status === "Absent") { totalAbsentDays += 1; }
     ```
     Kyunki absent records database mein exist hi nahi karte, `totalAbsentDays` hamesha **0** nikalta hai, aur fixed salary employees ki absent penalty kabhi deduct nahi hoti!
* **Recommended Fix:**
  - HR Attendance API mein sabhi active employees (`User.find({ isActive: true })`) ko load karke left-join karein taaki jo punch nahi kiye wo red color mein "Absent / Not Punched" dikhein.
  - Payroll engine mein: `totalAbsentDays = totalWorkingDaysInMonth - (totalPresentDays + approvedPaidLeaves + publicHolidays)`.

---

## 🔒 2. Security & Authorization Vulnerabilities

### ⚠️ 2.1 HR Attendance Routes Par Missing Authentication
* **Affected Files:**
  - [`src/app/api/hr/attendance/route.ts`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/app/api/hr/attendance/route.ts#L6-L48) (GET & PUT)
  - [`src/app/api/hr/attendance/manual/route.ts`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/app/api/hr/attendance/manual/route.ts#L5-L15) (POST)
* **Problem:**
  In routes mein koi JWT verification (`jose.jwtVerify`) ya Role check nahi hai.
* **Impact:**
  Koi bhi unauthenticated user bina login kiye direct HTTP request bhej kar poori company ki live attendance dekh sakta hai ya kisi bhi staff ki attendance override kar sakta hai.
* **Recommended Fix:**
  Standard auth helper laga kar check karein ki request aane wala user logged-in ho aur uska role HR ya Super Admin ho.

---

## ⚠️ 3. Flow & Logic Flaws (Edge Cases)

### 🔸 3.1 Double Punch-In Par Original Time Overwrite Ho Jaana
* **Affected File:** [`src/app/api/attendance/punch/route.ts`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/app/api/attendance/punch/route.ts#L28-L35)
* **Problem:**
  `findOneAndUpdate({ userId, date: today }, ...)` bina existing record check kiye `punchIn.time` update kar deta hai. Agar user subah 9:00 AM par punch-in kar chuka hai aur kisi reason se dobara punch-in button trigger hua, toh subah ka 9:00 AM erase hokar naya time save ho jayega.
* **Recommended Fix:**
  Validation add karein:
  ```ts
  const existing = await Attendance.findOne({ userId, date: today });
  if (action === "IN" && existing?.punchIn?.time) {
    return NextResponse.json({ message: "Already punched in for today" }, { status: 400 });
  }
  ```

---

### 🔸 3.2 Punch-OUT Without Prior Punch-IN Returns Fake Success
* **Affected File:** [`src/app/api/attendance/punch/route.ts`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/app/api/attendance/punch/route.ts#L40-L48)
* **Problem:**
  Agar user ne subah punch-in nahi kiya aur direct punch-out trigger ho jaye, toh `findOneAndUpdate` bina upsert ke `null` return karta hai, lekin API response 200 OK ke sath `{ message: "Punched OUT successfully", record: null }` return karti hai.
* **Recommended Fix:**
  Agar record nahi milta toh 400 Bad Request return karein: `"Must punch in before punching out"`.

---

### 🔸 3.3 Active Shift Calendar Modal Mein "Missed Out" (Red) Dikhna
* **Affected File:** [`src/components/attendance/CalendarModal.tsx`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/components/attendance/CalendarModal.tsx#L92)
* **Problem:**
  ```ts
  if (att.status === "Missed Out" || att.status === "In Progress") return { type: "missed", data: att };
  ```
  Is logic ki wajah se aaj ki chal rahi shift (jo abhi employee kar raha hai) calendar mein **Red Dot** aur **"Missed Out"** label ke sath show hoti hai.
* **Recommended Fix:**
  `"In Progress"` ke liye ek alag status type banayein (Blue/Amber indicator) ya aaj ki active date par "Shift in Progress" show karein.

---

### 🔸 3.4 Multi-Timezone Desync (UTC vs IST Server Glitch)
* **Affected Files:**
  - `punch/route.ts`: `new Date().toLocaleDateString('en-CA')` (Server OS timezone)
  - `api/hr/attendance/route.ts`: `new Date().toISOString().split("T")[0]` (UTC timezone)
  - `AttendanceHeader.tsx`: `new Date(date.getTime() - offset * 60 * 1000)` (Custom offset calculation)
* **Problem:**
  Server agar UTC (Vercel/AWS) par host ho, toh raat 12:00 AM se 5:30 AM IST ke dauran punches pichle din ki date mein save ho sakti hain.
* **Recommended Fix:**
  Sabhi backend routes mein uniform IST date generator use karein:
  ```ts
  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  ```

---

### 🔸 3.5 Client-Side Nominatim OpenStreetMap Rate-Limiting Risk
* **Affected File:** [`src/components/AttendanceCard.tsx`](file:///Users/salim/Downloads/Saalim/cons/mrgrp/src/components/AttendanceCard.tsx#L41)
* **Problem:**
  Har user ke browser se seedha OpenStreetMap Nominatim API call ho rahi hai. Nominatim free service par strict 1 req/sec limit hoti hai. Subah jab sabhi staff ek sath punch karenge, toh OSM 429 Too Many Requests dekar timeout karega, jisse punch process slow ho jayegi.
* **Recommended Fix:**
  Geocoding ko asynchronous background job ya backend proxy cache ke zariye handle karein, ya punch-in ke waqt direct coordinates save karein aur address backend par lazily resolve karein.

---

## 📊 Quick Priority Matrix

| # | Issue | Severity | Target Module |
| :-: | :--- | :---: | :--- |
| **1** | Rejected/Pending leave blocking Punch-IN | 🔴 Critical | `api/attendance/today` |
| **2** | Schema Enum vs Modal Status mismatch (Half Day) | 🔴 Critical | `Attendance.ts`, `EditAttendanceModal` |
| **3** | Unpunched-out shifts stuck "In Progress" forever | 🔴 Critical | `payrollEngine.ts`, Shift auto-closer |
| **4** | Absent records missing in DB & hidden in HR view | 🔴 Critical | `api/hr/attendance`, `payrollEngine` |
| **5** | Missing Auth in HR Attendance APIs | ⚠️ High | `api/hr/attendance`, `manual/route` |
| **6** | Double Punch-in overwriting morning time | ⚠️ Medium | `api/attendance/punch` |
| **7** | Punch-out without punch-in fake success | ⚠️ Medium | `api/attendance/punch` |
| **8** | Active shift shown as "Missed Out" (Red) in calendar | ⚠️ Medium | `CalendarModal.tsx` |
| **9** | UTC vs IST Date calculation mismatch | ⚠️ Medium | All Attendance API routes |
| **10**| Nominatim rate limit / latency risk | ℹ️ Low | `AttendanceCard.tsx` |

---

*Report saved for subsequent execution sprint.*

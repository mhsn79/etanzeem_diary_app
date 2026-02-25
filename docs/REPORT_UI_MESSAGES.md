# رپورٹ سکرین - تمام لیبل، ٹیکسٹ اور مسجز

یہ دستاویز رپورٹ Q&A سکرین پر استعمال ہونے والے تمام لیبل، پلیس ہولڈرز، ایرر مسجز، کامیابی مسجز، بٹن ٹیکسٹ، ڈائیلاگ اور موڈل ٹیکسٹ کی فہرست ہے۔

> **نوٹ:** تمام مسجز ہارڈ کوڈ ہیں — کوئی بھی `i18n.t()` استعمال نہیں ہو رہا۔

---

## 1. سکرین ٹائٹل اور ہیڈر (CreateReportScreen)

| # | موجودہ ٹیکسٹ | فائل | حالت |
|---|---|---|---|
| 1 | `رپورٹ بنائیں` | CreateReportScreen:441 | سکرین ٹائٹل (نئی/ایڈٹ موڈ) |
| 2 | `رپورٹ دیکھیں` | CreateReportScreen:441 | سکرین ٹائٹل (ویو موڈ) |

---

## 2. فارم لیبل (CreateReportScreen)

| # | موجودہ ٹیکسٹ | فائل | حالت |
|---|---|---|---|
| 3 | `تنظیمی یونٹ` | CreateReportScreen:466 | فارم ان پٹ لیبل (غیر قابل ترمیم) |
| 4 | `رپورٹنگ ماہ و سال` | CreateReportScreen:473 | فارم ان پٹ لیبل (غیر قابل ترمیم) |

---

## 3. پلیس ہولڈرز (SectionList - دستی سوالات)

| # | موجودہ ٹیکسٹ | فائل | input_type | تجویز |
|---|---|---|---|---|
| 5 | `نمبر میں جواب لکھیں` | SectionList:296 | `number` | ✅ درست |
| 6 | `الفاظ میں جواب لکھیں` | SectionList:301 | `string` | ✅ درست |
| 7 | `الفاظ میں تفصیل لکھیں` | SectionList:298 | `text` | ✅ درست |

---

## 4. پلیس ہولڈرز (AutoQuestionInput - آٹو سوالات)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 8 | `آٹو کیلکولیٹ کریں یا جواب یہاں لکھیں` | AutoQuestionInput:893 | جب آٹو کیلکولیٹ بٹن موجود ہو | ⚠️ "آٹو کیلکولیٹ" انگریزی ہے — `خود بخود حساب کریں یا جواب یہاں لکھیں` |
| 9 | `جواب یہاں لکھیں` | AutoQuestionInput:893 | جب آٹو کیلکولیٹ بٹن نہ ہو | ✅ درست |

---

## 5. آٹو کیلکولیٹ بٹن ٹیکسٹ (utils.ts)

| # | aggregate_func | موجودہ ٹیکسٹ | فائل | تجویز |
|---|---|---|---|---|
| 10 | `sum` / `total` | `کل` | utils.ts:215 | ✅ درست |
| 11 | `count` | `تعداد` | utils.ts:217 | ✅ درست |
| 12 | `avg` | `اوسط` | utils.ts:219 | ✅ درست |
| 13 | `plus` | `اضافہ` | utils.ts:221 | ✅ درست |
| 14 | `minus` | `کمی` | utils.ts:223 | ✅ درست |
| 15 | default/null | `تعداد` | utils.ts:225 | ✅ درست |

---

## 6. لوڈنگ مسجز

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 16 | `لوڈ ہو رہا ہے...` | CreateReportScreen:415 | سکرین لوڈنگ | ⚠️ "لوڈ" انگریزی ہے — `بار ہو رہا ہے...` یا `معلومات حاصل ہو رہی ہیں...` |
| 17 | `لوڈ ہو رہا ہے...` | AutoQuestionInput:938 | کانٹیکٹس موڈل لوڈنگ | ⚠️ اوپر والی ہی بات |
| 18 | `لوڈ ہو رہا ہے...` | AutoQuestionInput:1014 | ایکٹیویٹیز موڈل لوڈنگ | ⚠️ اوپر والی ہی بات |
| 19 | `لوڈ ہو رہا ہے...` | AutoQuestionInput:1091 | سٹرینتھ موڈل لوڈنگ | ⚠️ اوپر والی ہی بات |

---

## 7. جمع کروانے کے بٹن اور ڈائیلاگ (CreateReportScreen)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 20 | `جمع کروائیں` | CreateReportScreen:499 | مین سبمٹ بٹن | ✅ درست |
| 21 | `نامکمل رپورٹ` | CreateReportScreen:544 | کم پروگریس وارننگ ڈائیلاگ ٹائٹل | ✅ درست |
| 22 | `رپورٹ صرف ${overallProgress}% مکمل ہے۔ کیا آپ پھر بھی جمع کروانا چاہتے ہیں؟` | CreateReportScreen:545 | وارننگ ڈائیلاگ باڈی | ✅ درست |
| 23 | `جمع کروائیں` | CreateReportScreen:546 | وارننگ ڈائیلاگ کنفرم بٹن | ✅ درست |
| 24 | `واپس جائیں` | CreateReportScreen:547 | وارننگ ڈائیلاگ کینسل بٹن | ✅ درست |
| 25 | `رپورٹ جمع کروائیں` | CreateReportScreen:560 | کنفرمیشن ڈائیلاگ ٹائٹل | ✅ درست |
| 26 | `کیا آپ واقعی رپورٹ جمع کروانا چاہتے ہیں؟` | CreateReportScreen:561 | کنفرمیشن ڈائیلاگ باڈی | ✅ درست |
| 27 | `جمع کروائیں` | CreateReportScreen:562 | کنفرمیشن کنفرم بٹن | ✅ درست |
| 28 | `منسوخ کریں` | CreateReportScreen:563 | کنفرمیشن کینسل بٹن | ✅ درست |
| 29 | `رپورٹ جمع ہو گئی` | CreateReportScreen:581 | کامیابی ڈائیلاگ ٹائٹل | ✅ درست |
| 30 | `آپ کی رپورٹ کامیابی سے جمع کروا دی گئی ہے۔` | CreateReportScreen:582 | کامیابی ڈائیلاگ باڈی | ✅ درست |
| 31 | `ٹھیک ہے` | CreateReportScreen:583 | کامیابی ڈائیلاگ بٹن | ✅ درست |

---

## 8. ایرر اسٹیٹ (CreateReportScreen)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 32 | `خرابی: ${error}` | CreateReportScreen:424 | جب رپورٹ لوڈ فیل ہو | ⚠️ `${error}` انگریزی میں آئے گا (qaSlice سے) |
| 33 | `دوبارہ کوشش کریں` | CreateReportScreen:426 | ری ٹرائی بٹن | ✅ درست |

---

## 9. جواب محفوظ کرنے کے مسجز (SectionList - دستی سوالات)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 34 | `جواب کامیابی سے محفوظ ہو گیا` | SectionList:169 | جواب محفوظ ہونے پر (سبز رنگ) | ✅ درست |
| 35 | `محفوظ نہیں کیا جا سکتا: کوئی سبمشن آئی ڈی میسر نہیں` | SectionList:145 | جب سبمشن آئی ڈی نہ ہو | ⚠️ "سبمشن آئی ڈی" انگریزی ہے — `محفوظ نہیں ہو سکا: رپورٹ ابھی تیار نہیں ہوئی` |
| 36 | `جواب محفوظ کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔` | SectionList:178 | API ایرر | ✅ درست |

---

## 10. ان پٹ ویلیڈیشن مسجز (SectionList - دستی سوالات)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 37 | `براہ کرم ایک درست نمبر درج کریں` | SectionList:227,233 | نمبر ویلیڈیشن فیل | ✅ درست |
| 38 | `ان پٹ بہت لمبا ہے (زیادہ سے زیادہ 100 حروف)` | SectionList:241 | سٹرنگ لمبائی ویلیڈیشن | ⚠️ "ان پٹ" انگریزی ہے — `متن بہت لمبا ہے (زیادہ سے زیادہ 100 حروف)` |

---

## 11. آٹو کیلکولیشن ایرر مسجز (AutoQuestionInput)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 39 | `linked_to_id میسر نہیں ہے` | AutoQuestionInput:191,299,359,452,512 | جب linked_to_id نہ ہو (5 جگہ) | ⚠️ "linked_to_id" انگریزی ٹیکنیکل ہے — `سوال کی ترتیب میں خرابی ہے` |
| 40 | `نامعلوم linked_to_type` | AutoQuestionInput:579 | نامعلوم linked_to_type | ⚠️ "linked_to_type" انگریزی ٹیکنیکل — `سوال کی قسم نامعلوم ہے` |
| 41 | `تعداد حاصل کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔` | AutoQuestionInput:590 | عام کیلکولیشن ایرر | ✅ درست |
| 42 | `${getContactTypeLabel()} حاصل کرنے میں ناکامی` | AutoQuestionInput:289 | کانٹیکٹس فیچ ایرر | ✅ درست |
| 43 | `${getActivityTypeLabel()} حاصل کرنے میں ناکامی` | AutoQuestionInput:349 | ایکٹیویٹیز فیچ ایرر | ✅ درست |
| 44 | `${getStrengthTypeLabel()} حاصل کرنے میں ناکامی` | AutoQuestionInput:412 | سٹرینتھ فیچ ایرر | ✅ درست |

---

## 12. آٹو کیلکولیشن کامیابی مسجز (AutoQuestionInput)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 45 | `${getStrengthTypeLabel()} کی کل تعداد کامیابی سے حاصل ہو گئی` | AutoQuestionInput:526 | سٹرینتھ total/sum/count | ✅ درست |
| 46 | `${getStrengthTypeLabel()} کے لیے کوئی ریکارڈ نہیں ملا` | AutoQuestionInput:529 | سٹرینتھ - کوئی ریکارڈ نہ ملے | ⚠️ "ریکارڈ" انگریزی ہے — `${label} کا کوئی اندراج نہیں ملا` |
| 47 | `${getStrengthTypeLabel()} کی معلومات کامیابی سے حاصل ہو گئیں` | AutoQuestionInput:543 | سٹرینتھ avg/other | ✅ درست |
| 48 | `${getContactTypeLabel()} کی کل تعداد کامیابی سے حاصل ہو گئی` | AutoQuestionInput:556,559 | کانٹیکٹس total/count/sum | ✅ درست |
| 49 | `${getContactTypeLabel()} کے لیے کوئی ریکارڈ نہیں ملا` | AutoQuestionInput:562 | کانٹیکٹس - fallback | ⚠️ "ریکارڈ" — `${label} کا کوئی اندراج نہیں ملا` |
| 50 | `${getActivityTypeLabel()} کی کل تعداد کامیابی سے حاصل ہو گئی` | AutoQuestionInput:570,573 | ایکٹیویٹیز total/count/sum | ✅ درست |
| 51 | `${getActivityTypeLabel()} کے لیے کوئی ریکارڈ نہیں ملا` | AutoQuestionInput:576 | ایکٹیویٹیز - fallback | ⚠️ "ریکارڈ" — `${label} کی کوئی سرگرمی نہیں ملی` |
| 52 | `کل ${count} ${getTypeLabel()}` | AutoQuestionInput:725,749 | پاپ اپ OK کے بعد (کانٹیکٹس/سٹرینتھ) | ✅ درست |
| 53 | `کل ${publishedActivitiesCount} ${getTypeLabel()}` | AutoQuestionInput:736 | پاپ اپ OK کے بعد (ایکٹیویٹیز) | ✅ درست |

---

## 13. موڈل ٹائٹلز (AutoQuestionInput)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 54 | `نئے ${getContactTypeLabel()}` | AutoQuestionInput:926 | کانٹیکٹس موڈل (plus) | ✅ درست |
| 55 | `کمی ${getContactTypeLabel()}` | AutoQuestionInput:927 | کانٹیکٹس موڈل (minus) | ✅ درست |
| 56 | `کل ${getContactTypeLabel()}` | AutoQuestionInput:928 | کانٹیکٹس موڈل (default) | ✅ درست |
| 57 | `${getActivityTypeLabel()} کی سرگرمیاں` | AutoQuestionInput:1004 | ایکٹیویٹیز موڈل | ⚠️ اگر لیبل "اجتماعات" ہو تو "اجتماعات کی سرگرمیاں" عجیب لگتا ہے — شاید صرف `${label}` کافی ہو |
| 58 | `${getStrengthTypeSingularLabel()} اضافہ` | AutoQuestionInput:1079 | سٹرینتھ موڈل (plus) | ✅ درست |
| 59 | `${getStrengthTypeSingularLabel()} کمی` | AutoQuestionInput:1080 | سٹرینتھ موڈل (minus) | ✅ درست |
| 60 | `${getStrengthTypeLabel()} ریکارڈز` | AutoQuestionInput:1081 | سٹرینتھ موڈل (default) | ⚠️ "ریکارڈز" انگریزی — `${label} کا اندراج` |

---

## 14. موڈل لسٹ ہیڈرز (AutoQuestionInput)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 61 | `کل ${contactsList.length} ${getTypeLabel()}` | AutoQuestionInput:948 | کانٹیکٹس لسٹ ہیڈر | ✅ درست |
| 62 | `کل ${activitiesList.length} سرگرمی (جمع شدہ: ${published})` | AutoQuestionInput:1024 | ایکٹیویٹیز لسٹ ہیڈر | ✅ درست |
| 63 | `کل ${strengthRecordsList.length} ${singular} ریکارڈ` | AutoQuestionInput:1101 | سٹرینتھ لسٹ ہیڈر | ⚠️ "ریکارڈ" — `${label} اندراجات` |

---

## 15. خالی اسٹیٹ مسجز (AutoQuestionInput)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 64 | `کوئی ${getContactTypeLabel()} نہیں ملے (${contactsList.length})` | AutoQuestionInput:961 | کوئی کانٹیکٹ نہ ملے | ⚠️ خالی لسٹ میں `(0)` دکھانا بے ضرورت ہے — `کوئی ${label} نہیں ملے` |
| 65 | `کوئی سرگرمی نہیں ملی (${activitiesList.length})` | AutoQuestionInput:1037 | کوئی سرگرمی نہ ملے | ⚠️ `(0)` بے ضرورت — `کوئی سرگرمی نہیں ملی` |
| 66 | `کوئی ${singular} ریکارڈ نہیں ملا (${length})` | AutoQuestionInput:1114 | کوئی سٹرینتھ ریکارڈ نہ ملے | ⚠️ "ریکارڈ" + `(0)` — `کوئی ${label} اندراج نہیں ملا` |

---

## 16. موڈل بٹنز (AutoQuestionInput)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 67 | `منسوخ کریں` | AutoQuestionInput:977,1052,1129 | تینوں موڈلز کا کینسل بٹن | ✅ درست |
| 68 | `ٹھیک ہے (${contactsList.length})` | AutoQuestionInput:984 | کانٹیکٹس OK بٹن | ✅ درست |
| 69 | `ٹھیک ہے (${publishedActivitiesCount})` | AutoQuestionInput:1059 | ایکٹیویٹیز OK بٹن | ✅ درست |
| 70 | `ٹھیک ہے (${strengthRecordsList.length})` | AutoQuestionInput:1137 | سٹرینتھ OK بٹن | ✅ درست |

---

## 17. ڈیٹا ڈسپلے لیبلز (AutoQuestionInput - لسٹ آئٹمز)

| # | موجودہ ٹیکسٹ | فائل | حالت | تجویز |
|---|---|---|---|---|
| 71 | `نام نہیں ملا` | AutoQuestionInput:795 | کانٹیکٹ آئٹم - نام fallback | ✅ درست |
| 72 | `فون نمبر نہیں ملا` | AutoQuestionInput:796 | کانٹیکٹ آئٹم - فون fallback | ✅ درست |
| 73 | `تاریخ دستیاب نہیں` | AutoQuestionInput:810 | سرگرمی آئٹم - تاریخ fallback | ✅ درست |
| 74 | `جمع شدہ` | AutoQuestionInput:811 | سٹیٹس لیبل: published | ✅ درست |
| 75 | `ڈرافٹ` | AutoQuestionInput:812 | سٹیٹس لیبل: draft | ⚠️ "ڈرافٹ" انگریزی ہے — `مسودہ` |
| 76 | `محفوظ شدہ` | AutoQuestionInput:813 | سٹیٹس لیبل: archived | ✅ درست |
| 77 | `اضافہ` | AutoQuestionInput:839 | سٹرینتھ change_type: plus | ✅ درست |
| 78 | `کمی` | AutoQuestionInput:839 | سٹرینتھ change_type: minus | ✅ درست |
| 79 | `تاریخ نہیں ملی` | AutoQuestionInput:845 | سٹرینتھ ریکارڈ - تاریخ fallback | ✅ درست |
| 80 | `کل: ${newTotal}` | AutoQuestionInput:856 | سٹرینتھ ریکارڈ ٹوٹل لیبل | ✅ درست |

---

## 18. فال بیک لیبلز (AutoQuestionInput - label فنکشنز)

| # | موجودہ ٹیکسٹ | فنکشن | حالت | تجویز |
|---|---|---|---|---|
| 81 | `افراد` | getContactTypeLabel() | کانٹیکٹ ٹائپ نہ ملے تو | ✅ درست |
| 82 | `سرگرمیاں` | getActivityTypeLabel() | ایکٹیویٹی ٹائپ نہ ملے تو | ✅ درست |
| 83 | `تعداد` | getStrengthTypeLabel() | سٹرینتھ ٹائپ نہ ملے تو | ⚠️ "تعداد" بطور سٹرینتھ لیبل مبہم — `قوت` بہتر |
| 84 | `قوت` | getStrengthTypeSingularLabel() | مفرد سٹرینتھ لیبل fallback | ✅ درست |

---

## 19. qaSlice ایرر مسجز (انگریزی — یوزر کو دکھ سکتے ہیں)

| # | موجودہ ٹیکسٹ (انگریزی) | فائل | حالت | تجویز (اردو) |
|---|---|---|---|---|
| 85 | `Missing required fields for report initialization` | qaSlice:222 | ضروری فیلڈز غائب | `رپورٹ شروع کرنے کے لیے ضروری معلومات نہیں ملیں` |
| 86 | `Authentication expired. Please log in again.` | qaSlice:231,416,562 | ٹوکن ایکسپائر (3 جگہ) | `آپ کا سیشن ختم ہو گیا ہے۔ دوبارہ لاگ ان کریں۔` |
| 87 | `Submission with ID ${id} not found` | qaSlice:249 | سبمشن نہ ملے | `رپورٹ نہیں مل سکی` |
| 88 | `Error fetching submission with ID ${id}` | qaSlice:253 | سبمشن فیچ ایرر | `رپورٹ حاصل کرنے میں خرابی` |
| 89 | `No existing submission found for the given parameters` | qaSlice:293 | کوئی موجود سبمشن نہیں | `اس ٹیمپلیٹ کے لیے کوئی رپورٹ دستیاب نہیں` |
| 90 | `Invalid response format for Report Sections` | qaSlice:313 | سیکشنز فارمیٹ غلط | `رپورٹ سیکشنز حاصل کرنے میں خرابی` |
| 91 | `No sections found for template` | qaSlice:321 | کوئی سیکشن نہ ملے | `اس رپورٹ میں کوئی سیکشن نہیں ملا` |
| 92 | `Invalid response format for Report Questions` | qaSlice:339 | سوالات فارمیٹ غلط | `رپورٹ کے سوالات حاصل کرنے میں خرابی` |
| 93 | `Failed to initialize report data` | qaSlice:385,702 | عام انیشیلائز ایرر (2 جگہ) | `رپورٹ کی معلومات حاصل نہیں ہو سکیں` |
| 94 | `Missing question_id for answer submission` | qaSlice:402 | سوال آئی ڈی غائب | `جواب محفوظ نہیں ہو سکا: سوال کی شناخت نہیں ملی` |
| 95 | `Either string_value or number_value must be provided` | qaSlice:407 | کوئی ویلیو نہیں | `جواب محفوظ نہیں ہو سکا: کوئی جواب درج نہیں کیا گیا` |
| 96 | `No submission ID available. Please initialize the report first.` | qaSlice:431,570 | سبمشن آئی ڈی نہیں (2 جگہ) | `رپورٹ ابھی تیار نہیں ہوئی۔ براہ کرم دوبارہ کوشش کریں۔` |
| 97 | `Failed to save answer` | qaSlice:540,748 | جواب محفوظ فیل (2 جگہ) | `جواب محفوظ نہیں ہو سکا` |
| 98 | `Failed to submit report` | qaSlice:607,774 | رپورٹ جمع فیل (2 جگہ) | `رپورٹ جمع نہیں ہو سکی` |

---

## 20. ڈیبگ/ڈیولپر ٹیکسٹ (CreateReportScreen - صرف DEV موڈ)

| # | موجودہ ٹیکسٹ | فائل | حالت |
|---|---|---|---|
| 99 | `ڈیبگ معلومات کاپی کریں` | CreateReportScreen:460 | ڈیبگ بٹن (صرف __DEV__) |
| 100 | `کاپی ہو گیا` | CreateReportScreen:456 | Alert ٹائٹل (صرف __DEV__) |
| 101 | `ڈیبگ معلومات کاپی ہو گئی۔` | CreateReportScreen:456 | Alert باڈی (صرف __DEV__) |

---

## خلاصہ تبدیلیاں (مکمل ✅)

### درست کی گئی تبدیلیاں:
1. ✅ **"آٹو کیلکولیٹ"** → `خود بخود حساب` (AutoQuestionInput placeholder)
2. ✅ **"لوڈ ہو رہا ہے..."** → `معلومات حاصل ہو رہی ہیں...` (4 جگہ: CreateReportScreen + 3 modals)
3. ✅ **"ان پٹ بہت لمبا"** → `متن بہت لمبا` (SectionList validation)
4. ✅ **"ڈرافٹ"** → `مسودہ` (activity status label)
5. ✅ **"ریکارڈ/ریکارڈز"** → `اندراج/اندراجات` (strength modal title, list header, empty state)
6. ✅ **"linked_to_id میسر نہیں"** → `سوال کی ترتیب میں خرابی ہے` (5 جگہ)
7. ✅ **"نامعلوم linked_to_type"** → `سوال کی قسم نامعلوم ہے`
8. ✅ **"سبمشن آئی ڈی"** → `رپورٹ ابھی تیار نہیں ہوئی` (SectionList error)
9. ✅ **خالی لسٹ میں `(0)` ہٹایا** (تینوں modals)
10. ✅ **سٹرینتھ ٹائپ fallback "تعداد"** → `قوت` (getStrengthTypeLabel)
11. ✅ **qaSlice کے تمام 21 انگریزی ایرر مسجز اردو میں** — اب یوزر کو اردو میں ایرر دکھے گا

### باقی جائزہ (آپ کے لیے):
- **ایکٹیویٹیز موڈل ٹائٹل** `${getActivityTypeLabel()} کی سرگرمیاں` — کیا یہ ٹھیک ہے یا صرف `${label}` کافی ہے؟

---

*آخری تازہ کاری: 2026-02-21*

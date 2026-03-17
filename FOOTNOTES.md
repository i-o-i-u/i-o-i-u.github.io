# دليل إضافة الهوامش والمراجع

---

## الفكرة العامة

لكل هامش جزآن:
- **إشارة في النص**: رقم صغير ملوَّن يضعه القارئ يده عليه فتظهر نافذة بالهامش
- **قسم الهوامش**: في أسفل المقالة، يحتوي النصوص الكاملة

---

## الجزء الأول — إشارة الهامش في متن النص

ضعه مباشرة بعد الكلمة أو الجملة المراد الإحالة إليها، بلا مسافة قبله:

```html
<sup class="fn-ref" id="fnref-1"><a href="#fn-1">1</a></sup>
```

**للهامش الثاني:**
```html
<sup class="fn-ref" id="fnref-2"><a href="#fn-2">2</a></sup>
```

**القاعدة:** كل ما تغيره هو الأرقام فقط. `fnref-1` ← الرقم، `fn-1` ← نفس الرقم، `1` ← نفس الرقم.

---

## الجزء الثاني — قسم الهوامش في أسفل المقالة

أضفه في نهاية ملف المقالة (`.md`):

```html
<div class="footnotes-section">
  <h4 class="footnotes-title">
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    المصادر والهوامش
  </h4>
  <ol class="fn-list">

    <li class="fn-item" id="fn-1">
      <span class="fn-num-badge">1</span>
      <span class="fn-text">
        نص الهامش الأول هنا.
        <a class="fn-back" href="#fnref-1" title="عُد إلى النص">↩</a>
      </span>
    </li>

    <li class="fn-item" id="fn-2">
      <span class="fn-num-badge">2</span>
      <span class="fn-text">
        نص الهامش الثاني هنا.
        <a class="fn-back" href="#fnref-2" title="عُد إلى النص">↩</a>
      </span>
    </li>

  </ol>
</div>
```

---

## مثال كامل

```html
قال الأصمعيُّ في «الأصمعيات»: إن هذا البيتَ لعَنترة<sup class="fn-ref" id="fnref-1"><a href="#fn-1">1</a></sup>،
وخالفه ابنُ سلَّام<sup class="fn-ref" id="fnref-2"><a href="#fn-2">2</a></sup> في ذلك.


<div class="footnotes-section">
  <h4 class="footnotes-title">
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    المصادر والهوامش
  </h4>
  <ol class="fn-list">

    <li class="fn-item" id="fn-1">
      <span class="fn-num-badge">1</span>
      <span class="fn-text">
        الأصمعي، الأصمعيات، تحقيق أحمد شاكر، ص٤٥.
        <a class="fn-back" href="#fnref-1" title="عُد إلى النص">↩</a>
      </span>
    </li>

    <li class="fn-item" id="fn-2">
      <span class="fn-num-badge">2</span>
      <span class="fn-text">
        ابن سلَّام الجُمَحي، طبقات فحول الشعراء، ج١، ص١٢.
        <a class="fn-back" href="#fnref-2" title="عُد إلى النص">↩</a>
      </span>
    </li>

  </ol>
</div>
```

---

## ملاحظات

- الأرقام تبدأ من **1** وتتسلسل صعودًا في كل مقالة على حدة
- السهم **↩** في قسم الهوامش يعيد القارئ إلى موضع الهامش في النص
- النقر على الرقم في النص يُظهر نافذة صغيرة بنص الهامش دون الحاجة للتمرير
- النقر مرة ثانية أو الضغط على **Escape** يُغلق النافذة

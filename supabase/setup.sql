-- ============================================================
-- تأمين نظام التعليقات — يُنفَّذ مرة واحدة في Supabase
-- (Dashboard → SQL Editor → لصق الملف كاملًا → Run)
--
-- قبل هذا الإصلاح كان مفتاح Supabase العلني يسمح لأي زائر
-- بالتعديل والحذف والإخفاء مباشرة عبر REST. بعده:
--   - الزائر: قراءة التعليقات الظاهرة، وإضافة تعليق، والإعجاب فقط.
--   - تعديل/إخفاء/حذف تعليقه: عبر دوالّ تتحقق من مُعرِّفه.
--   - صلاحيات المدير: عبر دوالّ تتحقق من كلمة السر في الخادوم.
-- كلمة السر نفسها لم تتغير.
-- ============================================================

create extension if not exists pgcrypto;

-- ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
-- دالة داخلية: التحقق من كلمة سر المدير (نفس الكلمة الحالية)
-- ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
create or replace function _admin_ok(pw text)
returns boolean
language sql
immutable
as $$
  select encode(digest(coalesce(pw, ''), 'sha256'), 'hex')
       = 'e8cde359ae5242c5022ba199a0aebbb351bc154acdd79449ee6e71520861ae20';
$$;

-- ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
-- تفعيل RLS وحذف أي سياسات قديمة
-- ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
alter table comments enable row level security;
alter table likes    enable row level security;

do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('comments','likes')
  loop
    execute format('drop policy %I on %I', p.policyname, p.tablename);
  end loop;
end $$;

-- ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
-- سياسات الزوار (المفتاح العلني)
-- ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
-- قراءة التعليقات الظاهرة فقط (المخفية لا تصل إلى المتصفح أصلًا)
create policy comments_public_read on comments
  for select using (coalesce(is_hidden, false) = false);

-- إضافة تعليق: مسموح، لكن لا يجوز انتحال اسم صاحب الموقع
create policy comments_public_insert on comments
  for insert with check (
    coalesce(author_name, '') <> 'سيف العشيرة'
    and coalesce(is_hidden, false) = false
    and coalesce(admin_liked, false) = false
  );

-- لا سياسة UPDATE أو DELETE للزوار = ممنوعة عبر REST مباشرة

-- الإعجابات: قراءة وإضافة وحذف (فريدة لكل زائر بقيد unique)
create policy likes_public_read   on likes for select using (true);
create policy likes_public_insert on likes for insert with check (true);
create policy likes_public_delete on likes for delete using (true);

-- ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
-- دوالّ الزائر: التصرف في تعليقه هو فقط (بمطابقة مُعرِّفه)
-- ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
create or replace function visitor_edit_comment(cid text, uid text, new_body text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if new_body is null or length(trim(new_body)) = 0 or length(new_body) > 1500 then
    raise exception 'نص غير صالح';
  end if;
  update comments set body = new_body
  where id::text = cid and author_uid = uid;
  if not found then raise exception 'غير مسموح'; end if;
end $$;

create or replace function visitor_hide_comment(cid text, uid text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update comments set is_hidden = true
  where id::text = cid and author_uid = uid;
  if not found then raise exception 'غير مسموح'; end if;
end $$;

create or replace function visitor_delete_comment(cid text, uid text)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from comments where id::text = cid and author_uid = uid;
  if not found then raise exception 'غير مسموح'; end if;
end $$;

-- ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
-- دوالّ المدير: كل عملية تتحقق من كلمة السر في الخادوم
-- ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
create or replace function admin_verify(pw text)
returns boolean language sql stable as $$
  select _admin_ok(pw);
$$;

-- قراءة كل تعليقات الصفحة بما فيها المخفية
create or replace function admin_list_comments(pw text, slug text)
returns setof comments language plpgsql security definer set search_path = public as $$
begin
  if not _admin_ok(pw) then raise exception 'كلمة السر خاطئة'; end if;
  return query select * from comments where page_slug = slug order by created_at asc;
end $$;

-- إخفاء / إظهار / حذف / تبديل إعجاب المدير
create or replace function admin_moderate(pw text, cid text, action text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not _admin_ok(pw) then raise exception 'كلمة السر خاطئة'; end if;
  if action = 'hide' then
    update comments set is_hidden = true  where id::text = cid;
  elsif action = 'unhide' then
    update comments set is_hidden = false where id::text = cid;
  elsif action = 'delete' then
    delete from comments where id::text = cid;
  elsif action = 'like_toggle' then
    update comments set admin_liked = not coalesce(admin_liked, false) where id::text = cid;
  else
    raise exception 'عملية غير معروفة';
  end if;
end $$;

-- نشر تعليق أو ردّ باسم صاحب الموقع
create or replace function admin_add_comment(pw text, slug text, uid text, body text, parent text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not _admin_ok(pw) then raise exception 'كلمة السر خاطئة'; end if;
  if body is null or length(trim(body)) = 0 or length(body) > 1500 then
    raise exception 'نص غير صالح';
  end if;
  if parent is null or parent = '' then
    insert into comments (page_slug, author_name, author_uid, body)
    values (slug, 'سيف العشيرة', uid, body);
  else
    -- ربط الرد بالتعليق الأصل دون افتراض نوع عمود المعرّف
    insert into comments (page_slug, author_name, author_uid, body, parent_id)
    select slug, 'سيف العشيرة', uid, body, c.id from comments c where c.id::text = parent;
    if not found then raise exception 'التعليق الأصل غير موجود'; end if;
  end if;
end $$;

-- السماح باستدعاء الدوالّ عبر المفتاح العلني
grant execute on function admin_verify(text),
  admin_list_comments(text, text),
  admin_moderate(text, text, text),
  admin_add_comment(text, text, text, text, text),
  visitor_edit_comment(text, text, text),
  visitor_hide_comment(text, text),
  visitor_delete_comment(text, text)
to anon;

-- منع الوصول المباشر للدالة الداخلية
revoke execute on function _admin_ok(text) from anon;

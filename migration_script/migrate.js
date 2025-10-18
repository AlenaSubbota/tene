// migrate.js (версия 2)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');

// --- НАСТРОЙКИ ---
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});
const db = admin.firestore();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ---
// (остается без изменений)
async function migrateCollection(collectionName, supabaseTableName, transformFn, idMap) {
    console.log(`[START] Миграция коллекции: ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) {
        console.log(`[INFO] Коллекция ${collectionName} пуста.`);
        return;
    }
    const dataToInsert = snapshot.docs.flatMap(doc => {
        try {
            return transformFn(doc.id, doc.data(), idMap);
        } catch (e) {
            console.warn(`[WARN] Ошибка обработки документа ${doc.id}: ${e.message}`);
            return [];
        }
    }).filter(Boolean);
    if (dataToInsert.length === 0) {
        console.log(`[INFO] Нет данных для вставки в таблицу ${supabaseTableName}.`);
        return;
    }
    for (let i = 0; i < dataToInsert.length; i += 500) {
        const chunk = dataToInsert.slice(i, i + 500);
        const { error } = await supabase.from(supabaseTableName).insert(chunk);
        if (error) {
            console.error(`[ERROR] Ошибка при вставке в ${supabaseTableName}:`, error.message);
            return;
        }
    }
    console.log(`[SUCCESS] Успешно перенесено ${dataToInsert.length} записей из ${collectionName} в ${supabaseTableName}.`);
}


// --- ОСНОВНАЯ ЛОГИКА МИГРАЦИИ ---
async function main() {
  console.log('--- НАЧАЛО МИГРАЦИИ ДАННЫХ (v2) ---');

  // 1. Создаем карту соответствия Firebase UID -> Supabase UUID
  console.log('[INFO] Создаем карту соответствия ID пользователей...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('[ERROR] Не удалось получить пользователей из Supabase:', error.message);
    return;
  }
  const firebaseToSupabaseIdMap = users.reduce((acc, user) => {
    if (user.user_metadata?.firebase_uid) {
      acc[user.user_metadata.firebase_uid] = user.id;
    }
    return acc;
  }, {});
  console.log(`[INFO] Карта создана. Найдено ${Object.keys(firebaseToSupabaseIdMap).length} пользователей.`);


  // 2. users -> profiles
  await migrateCollection('users', 'profiles', (firebaseId, data, idMap) => {
    const supabaseId = idMap[firebaseId];
    if (!supabaseId) return null; // Пропускаем, если пользователя нет в карте
    return {
      id: supabaseId, // ИСПОЛЬЗУЕМ НОВЫЙ ID
      bookmarks: data.bookmarks || [],
      last_read: data.lastRead || {},
      policy_accepted: data.policyAccepted || false,
      settings: data.settings || {},
      subscription: data.subscription || null,
      telegram_id: data.telegramId || null,
    };
  }, firebaseToSupabaseIdMap);

  // 3. user_comment_likes -> user_comment_likes
  await migrateCollection('user_comment_likes', 'user_comment_likes', (firebaseId, data, idMap) => {
    const supabaseId = idMap[firebaseId];
    if (!supabaseId) return null;
    return {
      user_id: supabaseId, // ИСПОЛЬЗУЕМ НОВЫЙ ID
      liked_comments: data.chapters || {},
    };
  }, firebaseToSupabaseIdMap);

  // Остальные коллекции (им карта не нужна)
  await migrateCollection('novels', 'novels', (id, data) => ({ id, author: data.author, cover_url: data.coverUrl, description: data.description, genres: data.genres, title: data.title, latest_chapter_published_at: data.latest_chapter_published_at?._seconds ? new Date(data.latest_chapter_published_at._seconds * 1000).toISOString() : null }));
  await migrateCollection('chapter_info', 'chapter_info', (novelId, data) => Object.entries(data.chapters || {}).map(([chapterNum, chapterData]) => ({ novel_id: novelId, chapter_number: parseInt(chapterNum, 10), is_paid: chapterData.isPaid || false, published_at: chapterData.published_at?._seconds ? new Date(chapterData.published_at._seconds * 1000).toISOString() : null })));
  await migrateCollection('chapter_content', 'chapter_content', (id, data) => { const [novel_id, chapter_number] = id.split('-'); if (!novel_id || !chapter_number) return null; return { novel_id, chapter_number: parseInt(chapter_number, 10), content: data.content || '' }; });
  await migrateCollection('news', 'news', (id, data) => ({ date: data.date?._seconds ? new Date(data.date._seconds * 1000).toISOString() : null, full_text: data.fullText || '', image_url: data.imageUrl || null, short_description: data.shortDescription || '', title: data.title || '' }));
  await migrateCollection('novel_stats', 'novel_stats', (id, data) => ({ novel_id: id, views: data.views || 0 }));
  await migrateCollection('chapters_metadata', 'chapter_likes', (id, data) => { const [novel_id, chapter_number] = id.split('_'); if (!novel_id || !chapter_number) return null; return { novel_id, chapter_number: parseInt(chapter_number, 10), like_count: data.likeCount || 0 }; });
  await migrateCollection('app_state', 'app_state', (id, data) => ({ id: id, last_chapters_check: data.last_chapters_check?._seconds ? new Date(data.last_chapters_check._seconds * 1000).toISOString() : null, last_news_check: data.last_news_check?._seconds ? new Date(data.last_news_check._seconds * 1000).toISOString() : null, last_novel_check: data.last_novel_check?._seconds ? new Date(data.last_novel_check._seconds * 1000).toISOString() : null, last_update_check: data.last_update_check?._seconds ? new Date(data.last_update_check._seconds * 1000).toISOString() : null }));

  console.log('--- МИГРАЦИЯ УСПЕШНО ЗАВЕРШЕНА ---');
}

main().catch(console.error);
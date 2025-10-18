// create_users.js (версия 2)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');

// --- НАСТРОЙКИ ---
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- ОСНОВНАЯ ЛОГИКА ---
async function createSupabaseUsers() {
  console.log('[START] Начинаем создание пользователей в Supabase (v2)...');
  const listUsersResult = await admin.auth().listUsers(1000);

  for (const userRecord of listUsersResult.users) {
    const { uid, email, emailVerified } = userRecord.toJSON();
    if (!email) {
      console.warn(`[WARN] Пропускаем пользователя ${uid}, так как у него нет email.`);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: emailVerified,
      // ВАЖНО: Сохраняем старый Firebase UID в метаданные
      user_metadata: { firebase_uid: uid }, 
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        console.log(`[INFO] Пользователь с email ${email} уже существует.`);
      } else {
        console.error(`[ERROR] Ошибка создания пользователя ${email}:`, error.message);
      }
    } else {
      console.log(`[SUCCESS] Успешно создан пользователь: ${email} (Firebase UID: ${uid})`);
    }
  }
  console.log('[FINISH] Процесс создания пользователей завершен.');
}

createSupabaseUsers();
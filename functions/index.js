const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Загружаем переменные окружения для локального запуска (при деплое они будут установлены автоматически)
require("dotenv").config();

// Инициализируем Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Триггер, который срабатывает при создании нового комментария.
 */
exports.onNewComment = functions.region('europe-central2').firestore
  .document("chapters_metadata/{chapterMetaId}/comments/{commentId}")
  .onCreate(async (snap, context) => {
    const newComment = snap.data();
    const { chapterMetaId, commentId } = context.params;

    functions.logger.info(`New comment detected: ${commentId} in ${chapterMetaId}`);

    // Собираем данные для отправки в бот
    const notificationData = {
      authorName: newComment.userName,
      commentText: newComment.text,
      novelTitle: newComment.novelTitle || "Неизвестная новелла",
      chapterTitle: newComment.chapterTitle || "Неизвестная глава",
      replyToUid: null, // UID пользователя, которому ответили
    };

    // Если это ответ на другой комментарий, найдем автора исходного комментария
    if (newComment.replyTo) {
      const parentCommentRef = db
        .collection(`chapters_metadata/${chapterMetaId}/comments`)
        .doc(newComment.replyTo);
      
      try {
        const parentCommentSnap = await parentCommentRef.get();
        if (parentCommentSnap.exists) {
          const parentCommentData = parentCommentSnap.data();
          // Убедимся, что не отправляем уведомление самому себе
          if (parentCommentData.userId !== newComment.userId) {
             notificationData.replyToUid = parentCommentData.userId;
          }
        } else {
            functions.logger.warn(`Parent comment ${newComment.replyTo} not found.`);
        }
      } catch (error) {
        functions.logger.error("Could not fetch parent comment:", error);
      }
    }
    
    // --- ИЗМЕНЕНИЕ: Получаем URL и секрет из переменных окружения ---
    const botWebhookUrl = process.env.BOT_WEBHOOK_URL; 
    const secret = process.env.BOT_SECRET;

    if (!botWebhookUrl || !secret) {
        functions.logger.error("Bot webhook URL or secret is not configured in Firebase Functions environment.");
        return null;
    }

    functions.logger.info("Sending notification to bot:", notificationData);

    // Отправляем POST-запрос на наш Flask-сервер
    try {
      const response = await fetch(`${botWebhookUrl}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secret}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        functions.logger.error(
          `Bot returned an error: ${response.status} ${response.statusText}`,
          { body: errorBody }
        );
      } else {
        functions.logger.info("Notification sent successfully to bot.");
      }
    } catch (error) {
      functions.logger.error("Failed to send notification to bot:", error);
    }

    return null;
  });


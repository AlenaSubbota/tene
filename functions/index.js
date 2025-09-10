const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Эта новая функция будет "слушать" изменения в документах пользователей
exports.processSubscription = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();
        const userId = context.params.userId;

        // Проверяем, появилась ли у пользователя "заявка на подписку"
        if (newData.pendingSubscription && !oldData.pendingSubscription) {
            const plan = newData.pendingSubscription;
            console.log(`Processing subscription for user: ${userId}, plan: ${plan.name}`);

            const now = new Date();
            let expiresAt;

            // В зависимости от выбранного тарифа, вычисляем дату окончания
            switch (plan.duration) {
                case 1: // 1 месяц
                    expiresAt = new Date(now.setMonth(now.getMonth() + 1));
                    break;
                case 3: // 3 месяца
                    expiresAt = new Date(now.setMonth(now.getMonth() + 3));
                    break;
                case 12: // 1 год
                    expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
                    break;
                default:
                    console.error("Unknown plan duration:", plan.duration);
                    return null; // Если тариф неизвестен, ничего не делаем
            }

            // Создаем настоящую подписку и удаляем "заявку"
            try {
                await admin.firestore().collection('users').doc(userId).update({
                    'subscription': {
                        plan_name: plan.name,
                        purchased_at: admin.firestore.FieldValue.serverTimestamp(),
                        expires_at: admin.firestore.Timestamp.fromDate(expiresAt)
                    },
                    'pendingSubscription': admin.firestore.FieldValue.delete() // Удаляем заявку
                });
                console.log(`Subscription successfully created for user: ${userId}`);
            } catch (error) {
                console.error("Error updating user document:", error);
            }
        }
        return null;
    });
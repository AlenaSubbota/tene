# --- Этап 1: Сборка приложения ---
# Используем официальный образ Node.js для сборки нашего React-приложения
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./
RUN npm install

# Копируем все остальные файлы проекта (исходный код)
COPY . .

ARG VITE_SUPABASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Собираем производственную версию приложения
RUN npm run build

# --- Этап 2: Запуск в Production ---
# Используем легковесный образ веб-сервера Nginx
FROM nginx:1.25-alpine

# Копируем собранные файлы из этапа "builder" в публичную папку Nginx
COPY --from=builder /app/docs /usr/share/nginx/html

# Копируем наш собственный конфигурационный файл для Nginx
# Мы создадим его на следующем шаге
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80, который слушает Nginx
EXPOSE 80

# Команда для запуска Nginx при старте контейнера
CMD ["nginx", "-g", "daemon off;"]
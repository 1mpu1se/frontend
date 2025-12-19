# Frontend (Next.js + React + pnpm)

Этот проект использует **Next.js**, **React**, **pnpm** и **Node.js**. Ниже приведена инструкция по установке окружения, запуску в режиме разработки и развёртыванию в production.

---

## Требования

Перед началом убедитесь, что установлены:

### 1. Node.js

Рекомендуется последняя LTS-версия:
[https://nodejs.org/](https://nodejs.org/)

Проверка версии:
```bash
node -v
```
```bash
npm -v
```

---

### 2. Pnpm

Установка через npm:

```bash
npm install -g pnpm
```

Проверка версии:

```bash
pnpm -v
```

---

### 3. Docker (для production)

Установка:
[https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

Проверка:

```bash
docker -v
```

---

## Установка и запуск (Development)

> Из корня проекта

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Запуск dev-сервера

```bash
pnpm dev
```

Приложение будет доступно по адресу:
[http://localhost:3000](http://localhost:3000)

---

## Развёртывание в Production (Docker)

### Архитектура

* Frontend: `http://localhost:3000`
* Backend: `http://localhost:8080`
* Backend URL задаётся **через переменную окружения**
* Пересборка контейнера **не требуется** при смене backend

---

### 1. Сборка Docker-образа

Из корня проекта:

```bash
docker build -t next-frontend .
```

> Выполняется один раз или при изменении фронтенд-кода

---

### 2. Запуск контейнера

```bash
docker run -d \
  --name next-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 \
  next-frontend
```

После запуска:

* фронт доступен: [http://localhost:3000](http://localhost:3000)
* backend: [http://localhost:8080](http://localhost:8080)

---

### 3. Смена backend без пересборки

Если адрес или порт backend изменились:

```bash
docker stop next-frontend
docker rm next-frontend

docker run -d \
  --name next-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 \
  next-frontend
```

---

### Переменные окружения

| Переменная                | Описание          |
| ------------------------- | ----------------- |
| `NEXT_PUBLIC_BACKEND_URL` | Адрес backend API |

Пример:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

---

## Остановка и удаление контейнера

```bash
docker stop next-frontend
docker rm next-frontend
```

---

## Проверка

В браузере (Console):

```js
window.__RUNTIME_ENV
```

Ожидаемый результат:

```js
{
  NEXT_PUBLIC_BACKEND_URL: "http://localhost:8080"
}
```
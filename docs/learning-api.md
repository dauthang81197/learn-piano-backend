# Learning API — Tài liệu kỹ thuật

Base URL: `/learning`  
Auth: **Bearer JWT** — tất cả endpoints đều yêu cầu header `Authorization: Bearer <token>`

---

## Tổng quan luồng học

```
1. User chọn khóa học → POST /learning/courses/:courseId/start
2. Lấy danh sách bài học kèm tiến độ → GET /learning/courses/:courseId/lessons
3. Mở một bài học → POST /learning/courses/:courseId/lessons/:lessonId/start
4. Hoàn thành bài học → POST /learning/courses/:courseId/lessons/:lessonId/complete
5. Tiếp tục bài tiếp theo → GET /learning/courses/:courseId/next-lesson
```

---

## 1. Bắt đầu học khóa học

**`POST /learning/courses/:courseId/start`**

Tạo bản ghi enrollment cho user. Idempotent — gọi nhiều lần chỉ tạo một record.

### Path Parameters

| Tên        | Kiểu   | Bắt buộc | Mô tả       |
|------------|--------|----------|-------------|
| `courseId` | string | ✓        | UUID khóa học |

### Request Body

Không có.

### Response `201`

```json
{
  "message": "Bắt đầu học khóa học thành công",
  "enrollment": {
    "id": "uuid",
    "courseId": "uuid",
    "startedAt": "2024-01-15T08:00:00.000Z",
    "completedAt": null
  }
}
```

Nếu đã đăng ký trước đó:

```json
{
  "message": "Đã đăng ký khóa học trước đó",
  "enrollment": {
    "id": "uuid",
    "courseId": "uuid",
    "startedAt": "2024-01-10T08:00:00.000Z",
    "completedAt": null
  }
}
```

### Errors

| Status | Mô tả |
|--------|-------|
| `401`  | Chưa đăng nhập |
| `403`  | Khóa học Premium, user đang dùng gói Free |
| `404`  | Khóa học không tồn tại |

---

## 2. Lấy danh sách bài học kèm tiến độ

**`GET /learning/courses/:courseId/lessons`**

Trả về toàn bộ bài học trong khóa học, mỗi bài có trạng thái tiến độ của user hiện tại.

### Path Parameters

| Tên        | Kiểu   | Bắt buộc | Mô tả       |
|------------|--------|----------|-------------|
| `courseId` | string | ✓        | UUID khóa học |

### Request Body

Không có.

### Response `200`

```json
{
  "course": {
    "id": "uuid",
    "title": "Piano cơ bản",
    "description": "Khóa học piano cho người mới bắt đầu",
    "thumbnail": "uuid-media",
    "isPremium": false,
    "order": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "lessons": [
    {
      "id": "uuid",
      "title": "Giới thiệu về nốt Đô",
      "type": "theory",
      "order": 1,
      "xpReward": 10,
      "isPremium": false,
      "locked": false,
      "status": "completed",
      "isCompleted": true,
      "completedAt": "2024-01-15T09:00:00.000Z"
    },
    {
      "id": "uuid",
      "title": "Nốt Rê và Nốt Mi",
      "type": "theory",
      "order": 2,
      "xpReward": 15,
      "isPremium": false,
      "locked": false,
      "status": "in_progress",
      "isCompleted": false,
      "completedAt": null
    },
    {
      "id": "uuid",
      "title": "Bài học nâng cao",
      "type": "theory",
      "order": 3,
      "xpReward": 20,
      "isPremium": true,
      "locked": true,
      "status": null,
      "isCompleted": false,
      "completedAt": null
    }
  ],
  "completedCount": 1,
  "totalCount": 3,
  "progressPercent": 33,
  "enrolledAt": "2024-01-15T08:00:00.000Z",
  "courseCompletedAt": null
}
```

### Ghi chú trường `lessons[].status`

| Giá trị       | Ý nghĩa                          |
|---------------|----------------------------------|
| `null`        | Chưa mở bài học này bao giờ      |
| `"in_progress"` | Đã mở, chưa hoàn thành        |
| `"completed"` | Đã hoàn thành                    |

### Errors

| Status | Mô tả |
|--------|-------|
| `401`  | Chưa đăng nhập |
| `404`  | Khóa học không tồn tại |

---

## 3. Bắt đầu học một bài học

**`POST /learning/courses/:courseId/lessons/:lessonId/start`**

Đánh dấu bài học là `in_progress`. Tự động tạo enrollment nếu chưa có.  
Idempotent — gọi lại khi bài đã `completed` không thay đổi trạng thái.

### Path Parameters

| Tên        | Kiểu   | Bắt buộc | Mô tả       |
|------------|--------|----------|-------------|
| `courseId` | string | ✓        | UUID khóa học |
| `lessonId` | string | ✓        | UUID bài học  |

### Request Body

Không có.

### Response `201`

Lần đầu mở bài:

```json
{
  "lessonId": "uuid",
  "status": "in_progress",
  "message": "Bắt đầu học bài học"
}
```

Bài đang học (gọi lại):

```json
{
  "lessonId": "uuid",
  "status": "in_progress",
  "message": "Đang học bài học này"
}
```

Bài đã hoàn thành (gọi lại):

```json
{
  "lessonId": "uuid",
  "status": "completed",
  "message": "Bài học đã hoàn thành trước đó"
}
```

### Errors

| Status | Mô tả |
|--------|-------|
| `401`  | Chưa đăng nhập |
| `403`  | Bài học Premium, user đang dùng gói Free |
| `404`  | Bài học không tồn tại trong khóa học này |

---

## 4. Hoàn thành bài học và nhận XP

**`POST /learning/courses/:courseId/lessons/:lessonId/complete`**

Đánh dấu bài học hoàn thành, cộng XP vào tài khoản user.  
**An toàn tuyệt đối với double reward** — gọi nhiều lần chỉ cộng XP đúng 1 lần.

### Path Parameters

| Tên        | Kiểu   | Bắt buộc | Mô tả       |
|------------|--------|----------|-------------|
| `courseId` | string | ✓        | UUID khóa học |
| `lessonId` | string | ✓        | UUID bài học  |

### Request Body

Không có.

### Response `201` — Hoàn thành lần đầu

```json
{
  "alreadyCompleted": false,
  "xpGained": 15,
  "leveledUp": false,
  "currentXp": 115,
  "currentLevel": 1,
  "streak": 3,
  "badges": ["Beginner"],
  "message": "Hoàn thành bài học thành công!"
}
```

### Response `201` — Level up

```json
{
  "alreadyCompleted": false,
  "xpGained": 20,
  "leveledUp": true,
  "currentXp": 200,
  "currentLevel": 2,
  "streak": 7,
  "badges": ["Beginner", "Streak 7"],
  "message": "Hoàn thành! Bạn vừa lên cấp 2! 🎉"
}
```

### Response `201` — Đã hoàn thành trước đó (không cộng XP)

```json
{
  "alreadyCompleted": true,
  "xpGained": 0,
  "leveledUp": false,
  "currentXp": 115,
  "currentLevel": 1,
  "message": "Bài học đã hoàn thành trước đó"
}
```

### Ghi chú XP & Level

| Trường         | Mô tả |
|----------------|-------|
| `xpGained`     | XP nhận được từ bài này (`lesson.xpReward`), `0` nếu đã nhận trước đó |
| `leveledUp`    | `true` nếu level tăng sau khi nhận XP |
| `currentXp`    | Tổng XP hiện tại của user sau khi cộng |
| `currentLevel` | Level hiện tại. Công thức: `floor(totalXp / 100)` |
| `streak`       | Số ngày học liên tiếp |
| `badges`       | Danh sách huy hiệu đạt được |

**Logic level:** mỗi 100 XP = 1 level (level 1 = 0–99 XP, level 2 = 100–199 XP, ...)

**Khi hoàn thành bài cuối của khóa học**, `courseEnrollment.completedAt` sẽ tự động được set.

### Errors

| Status | Mô tả |
|--------|-------|
| `401`  | Chưa đăng nhập |
| `403`  | Bài học Premium, user đang dùng gói Free |
| `404`  | Bài học không tồn tại trong khóa học này |

---

## 5. Lấy bài học tiếp theo

**`GET /learning/courses/:courseId/next-lesson`**

Trả về bài học đầu tiên (theo `order` tăng dần) chưa hoàn thành mà user có thể truy cập.  
Bỏ qua bài Premium nếu user đang dùng gói Free.

### Path Parameters

| Tên        | Kiểu   | Bắt buộc | Mô tả       |
|------------|--------|----------|-------------|
| `courseId` | string | ✓        | UUID khóa học |

### Request Body

Không có.

### Response `200` — Còn bài chưa học

```json
{
  "lesson": {
    "id": "uuid",
    "title": "Nốt Rê và Nốt Mi",
    "type": "theory",
    "order": 2,
    "xpReward": 15,
    "isPremium": false
  }
}
```

### Response `200` — Đã hoàn thành tất cả

```json
{
  "message": "Bạn đã hoàn thành tất cả bài học trong khóa học này!",
  "lesson": null
}
```

### Errors

| Status | Mô tả |
|--------|-------|
| `401`  | Chưa đăng nhập |
| `404`  | Khóa học không tồn tại |

---

## Sơ đồ trạng thái bài học

```
         mở bài học                 hoàn thành
[chưa học] ──────────► [in_progress] ──────────► [completed]
  status: null           status: "in_progress"    status: "completed"
```

---

## Sơ đồ database

```
users ──────────────────────────────────────────────────┐
  │                                                      │
  ├─── course_enrollments ───── courses                  │
  │      userId  (FK → users)                            │
  │      courseId (FK → courses)                         │
  │      startedAt                                       │
  │      completedAt (null cho đến khi hoàn thành hết)  │
  │                                                      │
  └─── lesson_progress ─────── lessons ──── courses      │
         userId  (FK → users)                            │
         lessonId (FK → lessons)                         │
         courseId (FK → courses)                         │
         status   ENUM(in_progress, completed)           │
         xpAwarded  BOOLEAN  ← chặn double XP            │
         completedAt                                     │
```

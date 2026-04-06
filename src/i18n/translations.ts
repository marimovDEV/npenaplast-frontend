export type AppLanguage = 'uz' | 'ru';

export const DEFAULT_LANGUAGE: AppLanguage = 'uz';
export const LANGUAGE_STORAGE_KEY = 'penoplast-language';

const LOCALE_BY_LANGUAGE: Record<AppLanguage, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
};

const EXACT_RU_TRANSLATIONS: Record<string, string> = {
  "Sessiya tekshirilmoqda...": 'Проверка сессии...',
  'Tizimga kirish': 'Вход в систему',
  'Login': 'Логин',
  'Parol': 'Пароль',
  'Masalan: admin': 'Например: admin',
  'Kirish': 'Войти',
  "Hisobingiz yo'qmi? Iltimos, administratorga murojaat qiling.": 'Нет учетной записи? Обратитесь к администратору.',
  'Boshqaruv Paneli': 'Панель управления',
  'Hujjatlar Jurnali': 'Журнал документов',
  'Xodimlar': 'Сотрудники',
  'Faollik Jurnali': 'Журнал активности',
  'ERP Tizimi': 'ERP система',
  'Qidirish...': 'Поиск...',
  'QR Skaner': 'QR-сканер',
  'Chiqish': 'Выйти',
  'Asosiy': 'Главная',
  'Ombor': 'Склад',
  'Xom ashyo': 'Сырье',
  'Ishlab ch.': 'Произв.',
  'Sotuv': 'Продажи',
  'Mijozlar': 'Клиенты',
  'Moliya': 'Финансы',
  'Nazorat': 'Контроль',
  'Bloklar': 'Блоки',
  'Sklad': 'Склад',
  'Pardoz': 'Отделка',
  'Yetkazish': 'Доставка',
  'Yana': 'Еще',
  '1. Xom Ashyo Ombori': '1. Склад сырья',
  '2. Ishlab Chiqarish': '2. Производство',
  '3. Tayyor Bloklar': '3. Готовые блоки',
  '4. Dekor Ishlab Chiqarish': '4. Декор-производство',
  '5. Tayyor Mahsulot': '5. Готовая продукция',
  '6. Sotuv & Mijozlar': '6. Продажи и клиенты',
  '7. Hisobotlar': '7. Отчеты',
  '8. Boshqaruv': '8. Управление',
  '9. Moliya': '9. Финансы',
  'Sahifa yuklanmoqda...': 'Страница загружается...',
  'Omborchi': 'Кладовщик',
  'Bosh Admin': 'Главный администратор',
  'Admin': 'Администратор',
  'Ishlab chiqarish ustasi': 'Мастер производства',
  'CNC operatori': 'Оператор CNC',
  'Pardozlovchi': 'Отделочник',
  'Chiqindi operatori': 'Оператор отходов',
  'Sotuv menejeri': 'Менеджер по продажам',
  'Kuryer': 'Курьер',
  'Sklad №1 (Xom Ashyo)': 'Склад №1 (Сырье)',
  'Sklad №2 (Bloklar)': 'Склад №2 (Блоки)',
  'Sklad №3 (Ichki)': 'Склад №3 (Внутренний)',
  'Sklad №4 (Tayyor)': 'Склад №4 (Готовая продукция)',
  'Ishlab Chiqarish': 'Производство',
  'Usta Nazorati': 'Контроль мастера',
  'Buyurtmalar Natijasi': 'Результаты заказов',
  'CNC Sexi': 'Участок CNC',
  'Chiqindi Sexi': 'Участок отходов',
  'Armirlash & Shpaklyovka': 'Армирование и шпаклевка',
  'Sifat Nazorati': 'Контроль качества',
  'Logistika': 'Логистика',
  'Sotuvlar': 'Продажи',
  'Shartnomalar': 'Договоры',
  'Qarzdorlar': 'Должники',
  'Hisobotlar': 'Отчеты',
  'Moliya & Kassa': 'Финансы и касса',
  'Bildirishnomalar': 'Уведомления',
  "Hammasini o'qilgan deb belgilash": 'Отметить все как прочитанные',
  'Yuklanmoqda...': 'Загрузка...',
  "Bildirishnomalar yo'q": 'Уведомлений нет',
  "O'qilgan deb belgilash": 'Отметить как прочитанное',
  "O'chirish": 'Удалить',
  'Live Scanner Simulator': 'Симулятор сканера',
  "Hujjatdagi QR kodni ko'rsating": 'Покажите QR-код документа',
  'Manual QR...': 'QR вручную...',
  'Scan': 'Сканировать',
  'QR Tasdiqlandi!': 'QR подтвержден',
  'Hujjat:': 'Документ:',
  'Qayerdan': 'Откуда',
  'Qayerga': 'Куда',
  'Tranzaksiyani Tasdiqlash': 'Подтвердить транзакцию',
  'Qayta Scan Qilish': 'Сканировать снова',
  'Scanning Queue': 'Очередь сканирования',
  "Navbatda hujjat yo'q": 'В очереди нет документов',
  'Tasdiqlashda xatolik': 'Ошибка подтверждения',
  "Hujjat topilmadi yoki QR kod noto'g'ri": 'Документ не найден или QR-код неверный',
  "Qidiruvda xatolik yuz berdi": 'Произошла ошибка при поиске',
  'Mijozlar & CRM': 'Клиенты и CRM',
  'Barcha hamkorlar, leadlar va aloqa tarixi': 'Все партнеры, лиды и история коммуникаций',
  "Mijoz Qo'shish": 'Добавить клиента',
  'Shaxsiy mijoz': 'Частный клиент',
  'CRM': 'CRM',
  "Mijoz muvaffaqiyatli qo'shildi": 'Клиент успешно добавлен',
  "Mijoz ma'lumotlari yangilandi": 'Данные клиента обновлены',
  "Muloqot tarixi saqlandi": 'История контактов сохранена',
  'Xatolik yuz berdi': 'Произошла ошибка',
  "Mijoz o'chirildi": 'Клиент удален',
  "Mijozni o'chirib bo'lmadi": 'Не удалось удалить клиента',
  'Yangi Lead': 'Новый лид',
  'Muzokara': 'Переговоры',
  'Yutilgan (Mijoz)': 'Выиграно (клиент)',
  'Boy berilgan': 'Потеряно',
  'Mijoz': 'Клиент',
  'Kompaniya': 'Компания',
  'Telefon': 'Телефон',
  'Saqlash': 'Сохранить',
  'Bekor qilish': 'Отмена',
  'Tasdiqlash': 'Подтвердить',
  'Amallar': 'Действия',
  'Holat': 'Статус',
  'Status': 'Статус',
  'Sana': 'Дата',
  'Bo‘lim': 'Отдел',
  "Bo'lim": 'Отдел',
  'Mahsulot': 'Товар',
  'Mahsulot nomi': 'Название товара',
  'Partiya': 'Партия',
  'Partiya ID': 'ID партии',
  'Miqdor': 'Количество',
  'Summa': 'Сумма',
  "Tanlang...": 'Выберите...',
  'Kutilmoqda': 'Ожидает',
  'Tayyor': 'Готово',
  'Yakunlash': 'Завершить',
  'Yaratildi': 'Создано',
  'Tasdiqlandi': 'Подтверждено',
  'Barchasi': 'Все',
  'Aktiv': 'Активно',
  'Noma\'lum': 'Неизвестно',
  'Noma’lum': 'Неизвестно',
  'Belgilanmagan': 'Не указано',
  "Ruxsat yo'q": 'Нет доступа',
  "O'zingizni o'chira olmaysiz": 'Нельзя удалить самого себя',
  'Xodimlar Boshqaruvi': 'Управление сотрудниками',
  'Tizim foydalanuvchilari va ruxsatlar': 'Пользователи системы и права доступа',
  "Xodim qo'shish": 'Добавить сотрудника',
  "Xodimni o'chirib bo'lmadi": 'Не удалось удалить сотрудника',
  'Faoliyat tarixi': 'История активности',
  'Tahrirlash': 'Редактировать',
  "Xodimni o'chirish": 'Удалить сотрудника',
  "Ism, login yoki telefon bo'yicha qidirish...": 'Поиск по имени, логину или телефону...',
  "Xodim yoki modul bo'yicha qidirish...": 'Поиск по сотруднику или модулю...',
  "Zames № yoki Form № bo'yicha qidirish...": 'Поиск по № замеса или формы...',
  "Holati yaxshi yoki nuqson bor bo'lsa yozing...": 'Опишите состояние или укажите дефект...',
  'Mijoz nima dedi?..': 'Что сказал клиент?..',
  'FIO': 'ФИО',
  "Partiya yoki mahsulot bo'yicha qidirish...": 'Поиск по партии или товару...',
  'Qarzdor qidirish...': 'Поиск должника...',
  'Hisobot nomi...': 'Название отчета...',
  "Chiqish vazni (kg)...": 'Выходной вес (кг)...',
  'Masalan: 50': 'Например: 50',
  'Masalan: F-01': 'Например: F-01',
  "Masalan: Uskuna to'xtadi yoki xom ashyo yetishmadi...": 'Например: оборудование остановилось или не хватило сырья...',
  "O'zgartirmaslik uchun bo'sh...": 'Оставьте пустым, чтобы не менять...',
  "Hujjat raqami yoki xodim...": 'Номер документа или сотрудник...',
  'SKU, Partiya yoki nom...': 'SKU, партия или название...',
  'Qidiruv...': 'Поиск...',
  'Qidiruv (ID yoki Batch)...': 'Поиск (ID или batch)...',
  "Yetkazib berish, to'lov va kafolatlar haqida...": 'О доставке, оплате и гарантиях...',
  "Buyurtmalarni qidirish...": 'Поиск заказов...',
  'Tavsif, kassa yoki kategoriya bo‘yicha qidiruv...': 'Поиск по описанию, кассе или категории...',
  "Tavsif, kassa yoki kategoriya bo'yicha qidiruv...": 'Поиск по описанию, кассе или категории...',
  'Amal uchun qisqacha izoh...': 'Краткий комментарий к операции...',
  'Ixtiyoriy': 'Необязательно',
  'Ixtiyoriy izohlar...': 'Необязательный комментарий...',
  'Bugungi Savdo': 'Продажи за сегодня',
  'Chegirma': 'Скидка',
  'Yangi Buyurtma': 'Новый заказ',
  'Umumiy Savdo': 'Общие продажи',
  'Chiqindi Miqdori': 'Объем отходов',
  'Ombor Qiymati': 'Стоимость склада',
  'Xom ashyo kirimi': 'Поступление сырья',
  'Sotuvlar soni': 'Количество продаж',
  'Ishlab chiqarilgan': 'Произведено',
  'Kirim': 'Приход',
  'Chiqim': 'Расход',
  'Bunker': 'Бункер',
  'Quritish': 'Сушка',
  'CNC Kesuv': 'Резка CNC',
  'Pardozlash': 'Отделка',
  'Omborxona': 'Склад',
  'Production': 'Производство',
  'Finishing': 'Отделка',
  'Ready': 'Готово',
  'Empty': 'Пусто',
  'Pending': 'Ожидает',
  'Completed': 'Завершено',
  'InProduction': 'В производстве',
  'Excel': 'Excel',
  'Error': 'Ошибка',
  'success': 'успех',
  'error': 'ошибка',
  'info': 'инфо',
  'ACTIVE': 'Активен',
  'BLOCKED': 'Заблокирован',
  'PENDING': 'Ожидает',
  'RECEIVED': 'Получено',
  'CREATED': 'Создано',
  'CONFIRMED': 'Подтверждено',
  'APPROVED': 'Одобрено',
  'IN_PROGRESS': 'В процессе',
  'IN_TRANSIT': 'В пути',
  'DONE': 'Завершено',
  'CANCELLED': 'Отменено',
  'RETURNED': 'Возвращено',
  'PLANNED': 'Запланировано',
  'QC_PENDING': 'Ожидает ОТК',
  'REPAIR': 'На доработке',
  'DELAYED': 'Задержано',
  'PAUSED': 'Приостановлено',
  'FAILED': 'Ошибка',
  'PASSED': 'Пройдено',
  'LEAD': 'Лид',
  'NEGOTIATION': 'Переговоры',
  'WON': 'Выиграно',
  'LOST': 'Потеряно',
  'HIGH': 'Высокий',
  'MEDIUM': 'Средний',
  'LOW': 'Низкий',
  'WHOLESALE': 'Опт',
  'RETAIL': 'Розница',
  'CASH': 'Наличные',
  'BANK': 'Банк',
  'CARD': 'Карта',
  'INCOME': 'Приход',
  'EXPENSE': 'Расход',
  'RAW': 'Сырье',
  'SEMI': 'Полуфабрикат',
  'FINISHED': 'Готовая продукция',
  'OTHER': 'Прочее',
  'dona': 'шт',
  'jami': 'всего',
};

const EXACT_MAP_RU = new Map(
  Object.entries(EXACT_RU_TRANSLATIONS).map(([key, value]) => [canonicalize(key), value]),
);

type DynamicRule = {
  pattern: RegExp;
  replace: (...args: string[]) => string;
};

const RU_DYNAMIC_RULES: DynamicRule[] = [
  {
    pattern: /^(.+)ni bazadan o'chirmoqchimisiz\?$/u,
    replace: (full, name) => `Удалить ${name} из базы?`,
  },
  {
    pattern: /^(.+)ni tizimdan o'chirmoqchimisiz\?$/u,
    replace: (full, name) => `Удалить ${name} из системы?`,
  },
  {
    pattern: /^Hujjat (.+) tasdiqlandi!?$/u,
    replace: (full, number) => `Документ ${number} подтвержден!`,
  },
  {
    pattern: /^(.+) ma'lumotlari yangilandi$/u,
    replace: (full, name) => `Данные ${name} обновлены`,
  },
  {
    pattern: /^(.+) tizimga qo'shildi$/u,
    replace: (full, name) => `${name} добавлен(а) в систему`,
  },
  {
    pattern: /^(.+) o'chirildi$/u,
    replace: (full, name) => `${name} удален(а)`,
  },
  {
    pattern: /^Masalan: (.+)$/u,
    replace: (full, example) => `Например: ${example}`,
  },
  {
    pattern: /^m-n: (.+)$/u,
    replace: (full, example) => `напр.: ${example}`,
  },
  {
    pattern: /^Plan: (.+)$/u,
    replace: (full, value) => `План: ${value}`,
  },
  {
    pattern: /^Chegirma: -(.+)$/u,
    replace: (full, value) => `Скидка: -${value}`,
  },
  {
    pattern: /^(.+) Hisoboti - (.+)$/u,
    replace: (full, reportType, date) => `${reportType} отчет - ${date}`,
  },
];

export function canonicalize(text: string): string {
  return text
    .replace(/[’`ʻʼ]/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSupportedLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'uz' || value === 'ru';
}

export function resolveLanguage(value: string | null | undefined): AppLanguage {
  return isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE;
}

export function getStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  return resolveLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function persistLanguage(language: AppLanguage) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function getLocale(language: AppLanguage): string {
  return LOCALE_BY_LANGUAGE[language];
}

function translateTrimmedText(text: string, language: AppLanguage): string {
  if (language === 'uz') {
    return text;
  }

  const exact = EXACT_MAP_RU.get(canonicalize(text));
  if (exact) {
    return exact;
  }

  for (const rule of RU_DYNAMIC_RULES) {
    if (rule.pattern.test(text)) {
      return text.replace(rule.pattern, (...args) => rule.replace(...args.slice(0, -2)));
    }
  }

  return text;
}

export function translateText(text: string, language: AppLanguage): string {
  if (!text || language === 'uz') {
    return text;
  }

  const match = text.match(/^(\s*)(.*?)(\s*)$/su);
  if (!match) {
    return text;
  }

  const [, leading, trimmed, trailing] = match;
  if (!trimmed) {
    return text;
  }

  return `${leading}${translateTrimmedText(trimmed, language)}${trailing}`;
}

export function translateTextForCurrentLanguage(text: string): string {
  return translateText(text, getStoredLanguage());
}

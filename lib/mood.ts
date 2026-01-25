export const moods: {
  key: string;
  label: string;
  value: number;
  color: string;
}[] = [
  { key: "excited", label: "ذوق زده", value: 9, color: "#F48FB1" },
  { key: "happy", label: "خوشحال", value: 8, color: "#FFD54F" },
  { key: "normal", label: "معمولی", value: 7, color: "#90A4AE" },
  { key: "relaxed", label: "ریلکس", value: 6, color: "#80CBC4" },
  { key: "tired", label: "بی خواب", value: 5, color: "#B39DDB" },
  { key: "sad", label: "ناراحت", value: 4, color: "#7986CB" },
  { key: "angry", label: "عصبانی", value: 3, color: "#E57373" },
  { key: "crying", label: "غمگین", value: 2, color: "#64B5F6" },
  { key: "anxious", label: "مضطرب", value: 1, color: "#BA68C8" },
];
export const trains = {
  normal: ["meditation_short", "light_breathing", "daily_tip"],
  happy: ["positive_meditation", "gratitude_exercise"],
  excited: ["grounding_meditation", "calm_breathing"],
  sad: ["calm_meditation", "chatbot_support", "journaling"],
  tired: ["restorative_meditation", "478_breathing"],
  relaxed: ["visualization_meditation", "gratitude_exercise"],
  anxious: ["box_breathing", "anxiety_meditation", "chatbot_support"],
  crying: [
    "soft_meditation",
    "calm_breathing",
    "chatbot_support",
    "journaling",
  ],
  angry: ["anger_release_meditation", "deep_breathing", "chatbot_support"],
};

// مشخص کردن نوع مدیتیشن برای مود
export const getMeditationTypesForMood = (moodKey: string): string[] => {
  const map: Record<string, string[]> = {
    excited: ["calm", "nature"],
    happy: ["love", "instrumental"],
    normal: ["calm", "instrumental"],
    relaxed: ["nature", "calm"],
    tired: ["sleep", "sleep music", "self"],
    sad: ["calm", "love", "self"],
    angry: ["calm", "nature", "self"],
    crying: ["calm", "love", "self"],
    anxious: ["calm", "anxiety", "self"],
  };
  return map[moodKey] || ["calm"];
};

// مشخص کردن نوع تمرین تنفس برای مود
export const getBreathingTypesForMood = (moodKey: string): string[] => {
  const map: Record<string, string[]> = {
    excited: ["calm_breathing", "light_breathing", "mindful_breathing"],
    happy: ["light_breathing", "mindful_breathing"],
    normal: ["light_breathing", "mindful_breathing"],
    relaxed: ["calm_breathing", "light_breathing", "yogic_breathing"],
    tired: ["478_breathing", "deep_breathing", "yogic_breathing"],
    sad: ["calm_breathing", "mindful_breathing"],
    angry: ["deep_breathing", "box_breathing", "fire_breathing"],
    crying: ["calm_breathing", "mindful_breathing"],
    anxious: ["box_breathing", "calm_breathing", "mindful_breathing"],
  };
  return map[moodKey] || ["light_breathing"];
};
export const breathingTypes: string[] = [
  "calm_breathing",
  "light_breathing",
  "mindful_breathing",
  "yogic_breathing",
  "478_breathing",
  "deep_breathing",
  "box_breathing",
  "fire_breathing",
];
export const breathingDetails: Record<
  string,
  {
    inhaleDuration: number;
    holdDuration: number;
    exhaleDuration: number;
    description: string;
  }
> = {
  light_breathing: {
    inhaleDuration: 0,
    holdDuration: 0,
    exhaleDuration: 0,
    description:
      "معرفی: تنفس سبک به شما کمک می‌کند به سرعت ذهن و بدن خود را آرام کنید و تنش‌های روزانه را کاهش دهید.\n\n" +
      "راهنمای استفاده:\n" +
      "• در یک محیط ساکت و راحت بنشینید یا دراز بکشید.\n" +
      "• موسیقی آرامش‌بخش را پخش کنید.\n" +
      "• دایره در حال بزرگ و کوچک شدن را دنبال کنید.\n" +
      "• دایره بزرگ → دم آرام\n" +
      "• دایره کوچک → بازدم آرام\n\n" +
      "نکته: این تنفس بدون شمارش است و فقط روی آرامی و آگاهی از نفس تمرکز دارد.",
  },

  calm_breathing: {
    inhaleDuration: 4000,
    holdDuration: 0,
    exhaleDuration: 4000,
    description:
      "معرفی: تنفس آرام سیستم عصبی را آرام می‌کند و برای کاهش استرس و احساسات شدید بسیار مؤثر است.\n\n" +
      "راهنمای استفاده:\n" +
      "• در وضعیت راحت قرار بگیرید.\n" +
      "• با بزرگ شدن دایره، آرام دم بگیرید.\n" +
      "• با کوچک شدن دایره، بازدم نرم و طولانی انجام دهید.\n\n" +
      "نکته: می‌توانید بین دم و بازدم مکث کوتاهی داشته باشید.",
  },

  mindful_breathing: {
    inhaleDuration: 1000,
    holdDuration: 1000,
    exhaleDuration: 1000,
    description:
      "معرفی: تنفس آگاهانه پایه مدیتیشن ذهن‌آگاهی است و به حضور در لحظه حال کمک می‌کند.\n\n" +
      "راهنمای استفاده:\n" +
      "• بدن را در حالت راحت قرار دهید.\n" +
      "• بدون تغییر ریتم نفس، فقط آن را مشاهده کنید.\n" +
      "• اگر ذهن پرت شد، آرام توجه را به نفس برگردانید.\n\n" +
      "نکته: کنترل نفس لازم نیست؛ مشاهده کافی است.",
  },

  yogic_breathing: {
    inhaleDuration: 5000,
    holdDuration: 2000,
    exhaleDuration: 6000,
    description:
      "معرفی: تنفس یوگایی باعث افزایش ظرفیت ریه و آرامش عمیق جسم و ذهن می‌شود.\n\n" +
      "راهنمای استفاده:\n" +
      "• ابتدا شکم و سپس قفسه سینه را پر از هوا کنید.\n" +
      "• نفس را کمی نگه دارید.\n" +
      "• بازدم را آرام و کامل انجام دهید.\n\n" +
      "نکته: بازدم طولانی‌تر اثر آرامش‌بخش بیشتری دارد.",
  },

  "478_breathing": {
    inhaleDuration: 4000,
    holdDuration: 7000,
    exhaleDuration: 8000,
    description:
      "معرفی: تنفس ۴-۷-۸ یکی از مؤثرترین تکنیک‌ها برای کاهش اضطراب و آماده‌سازی برای خواب است.\n\n" +
      "راهنمای استفاده:\n" +
      "• ۴ ثانیه دم بگیرید.\n" +
      "• ۷ ثانیه نفس را نگه دارید.\n" +
      "• ۸ ثانیه بازدم انجام دهید.\n\n" +
      "نکته: برای شروع، ۲ تا ۳ چرخه کافی است.",
  },

  deep_breathing: {
    inhaleDuration: 5000,
    holdDuration: 1000,
    exhaleDuration: 5000,
    description:
      "معرفی: تنفس عمیق برای تخلیه تنش، خشم و افزایش انرژی بسیار مفید است.\n\n" +
      "راهنمای استفاده:\n" +
      "• ستون فقرات را صاف نگه دارید.\n" +
      "• دم عمیق و کامل بگیرید.\n" +
      "• بازدم را آهسته و کنترل‌شده انجام دهید.\n\n" +
      "نکته: حرکت شکم نشانه انجام صحیح تمرین است.",
  },

  box_breathing: {
    inhaleDuration: 4000,
    holdDuration: 4000,
    exhaleDuration: 4000,
    description:
      "معرفی: تنفس جعبه‌ای به کنترل اضطراب و افزایش تمرکز کمک می‌کند.\n\n" +
      "راهنمای استفاده:\n" +
      "• ۴ ثانیه دم بگیرید.\n" +
      "• ۴ ثانیه نگه دارید.\n" +
      "• ۴ ثانیه بازدم انجام دهید.\n" +
      "• ۴ ثانیه مکث کنید.\n\n" +
      "نکته: مناسب موقعیت‌های استرس‌زا و تصمیم‌گیری.",
  },

  fire_breathing: {
    inhaleDuration: 500,
    holdDuration: 0,
    exhaleDuration: 1000,
    description:
      "معرفی: تنفس آتشین یک تمرین انرژی‌بخش برای افزایش هوشیاری و تمرکز است.\n\n" +
      "راهنمای استفاده:\n" +
      "• بازدم‌های کوتاه و قوی از بینی انجام دهید.\n" +
      "• دم به‌صورت طبیعی و خودکار انجام می‌شود.\n" +
      "• ریتم را با انیمیشن هماهنگ کنید.\n\n" +
      "نکته: در صورت سرگیجه، تمرین را متوقف کنید.",
  },
};

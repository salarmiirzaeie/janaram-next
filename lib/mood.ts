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

export const originalTrains = {
  normal: ["meditation_short", "light_breathing", "daily_tip"],
  happy: ["positive_meditation", "gratitude_exercise", "focus_music"],
  excited: ["grounding_meditation", "calm_breathing", "mindful_activity"],
  sad: ["calm_meditation", "chatbot_support", "journaling"],
  tired: ["restorative_meditation", "478_breathing", "sleep_music"],
  relaxed: [
    "visualization_meditation",
    "mindfulness_practice",
    "gratitude_short",
  ],
  anxious: [
    "box_breathing",
    "anxiety_meditation",
    "chatbot_support",
    "grounding_activity",
  ],
  crying: [
    "soft_meditation",
    "calm_breathing",
    "chatbot_support",
    "journaling_release",
  ],
  angry: [
    "anger_release_meditation",
    "deep_breathing",
    "body_scan",
    "chatbot_support",
  ],
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
    excited: ["calm_breathing", "light_breathing"],
    happy: ["light_breathing"],
    normal: ["light_breathing"],
    relaxed: ["calm_breathing", "light_breathing"],
    tired: ["478_breathing", "deep_breathing"],
    sad: ["calm_breathing"],
    angry: ["deep_breathing", "box_breathing"],
    crying: ["calm_breathing"],
    anxious: ["box_breathing", "calm_breathing"],
  };
  return map[moodKey] || ["light_breathing"];
};

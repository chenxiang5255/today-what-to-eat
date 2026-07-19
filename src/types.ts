export interface Profile {
  gender: 'male' | 'female';
  age: number;
  height: number; // cm
  weight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'heavy'; // 运动等级
  goal: 'maintain' | 'lose-slow' | 'lose-normal' | 'lose-fast'; // 减脂目标
  calorieBudget: number; // 每日卡路里目标
  proteinTarget: number; // 克
  carbTarget: number; // 克
  fatTarget: number; // 克
  lowFatCholesterolDiet: boolean; // 是否开启低脂低胆固醇饮食
  gastricFriendlyDiet: boolean; // 是否开启肠胃友好饮食
}


export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  calories: number; // kcal / 100g or per unit
  protein: number; // g / 100g
  carbs: number; // g / 100g
  fat: number; // g / 100g
  unit: string; // 'g' 或 '个' 等
  isFatLossFriendly: boolean;
  category: 'protein' | 'carb' | 'veg' | 'snack' | 'mixed';
  servingSize: number; // 默认份量 (例如 100g 或 1个)
  sourceType?: 'self' | 'delivery' | 'both'; // 自己做 (self) / 点外卖 (delivery) / 两者皆可 (both)
}

export interface MealLog {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  amount: number; // 数量，如 1.5 份 (Serving) 或克数
  mealType: MealType;
  timestamp: number;
}

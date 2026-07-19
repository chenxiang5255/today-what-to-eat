import type { FoodItem } from './types';

export const INITIAL_FOODS: FoodItem[] = [
  // 高蛋白主菜 (protein)
  { id: 'p1', name: '香煎鸡胸肉', calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: 'g', isFatLossFriendly: true, category: 'protein', servingSize: 100, sourceType: 'self' },
  { id: 'p2', name: '水煮蛋', calories: 72, protein: 6.3, carbs: 0.6, fat: 4.8, unit: '个', isFatLossFriendly: true, category: 'protein', servingSize: 1, sourceType: 'self' },
  { id: 'p3', name: '白灼基围虾', calories: 99, protein: 22, carbs: 0, fat: 1.1, unit: 'g', isFatLossFriendly: true, category: 'protein', servingSize: 100, sourceType: 'self' },
  { id: 'p4', name: '五香卤牛肉', calories: 150, protein: 25, carbs: 1, fat: 5, unit: 'g', isFatLossFriendly: true, category: 'protein', servingSize: 100, sourceType: 'both' },
  { id: 'p5', name: '香煎三文鱼', calories: 208, protein: 22, carbs: 0, fat: 13, unit: 'g', isFatLossFriendly: true, category: 'protein', servingSize: 100, sourceType: 'both' },
  { id: 'p6', name: '凉拌豆腐', calories: 80, protein: 8, carbs: 2.5, fat: 4.5, unit: 'g', isFatLossFriendly: true, category: 'protein', servingSize: 100, sourceType: 'self' },
  { id: 'p7', name: '照烧鸡腿肉', calories: 180, protein: 18, carbs: 8, fat: 8, unit: 'g', isFatLossFriendly: false, category: 'protein', servingSize: 100, sourceType: 'both' },
  { id: 'p8', name: '厚切炸猪排', calories: 340, protein: 14, carbs: 12, fat: 25, unit: '块', isFatLossFriendly: false, category: 'protein', servingSize: 1, sourceType: 'both' },
  { id: 'p9', name: '清蒸鲈鱼', calories: 105, protein: 18, carbs: 0, fat: 3, unit: 'g', isFatLossFriendly: true, category: 'protein', servingSize: 100, sourceType: 'both' },

  // 优质碳水 (carb)
  { id: 'c1', name: '糙米饭', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, unit: 'g', isFatLossFriendly: true, category: 'carb', servingSize: 100, sourceType: 'self' },
  { id: 'c2', name: '蒸红薯', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, unit: 'g', isFatLossFriendly: true, category: 'carb', servingSize: 100, sourceType: 'self' },
  { id: 'c3', name: '煮玉米', calories: 112, protein: 4, carbs: 22, fat: 1.2, unit: 'g', isFatLossFriendly: true, category: 'carb', servingSize: 100, sourceType: 'self' },
  { id: 'c4', name: '全麦面包', calories: 85, protein: 3.1, carbs: 15, fat: 1.5, unit: '片', isFatLossFriendly: true, category: 'carb', servingSize: 1, sourceType: 'self' },
  { id: 'c5', name: '水煮紫薯', calories: 106, protein: 1.6, carbs: 24.3, fat: 0.2, unit: 'g', isFatLossFriendly: true, category: 'carb', servingSize: 100, sourceType: 'self' },
  { id: 'c6', name: '白米饭', calories: 130, protein: 2.5, carbs: 28, fat: 0.3, unit: 'g', isFatLossFriendly: false, category: 'carb', servingSize: 100, sourceType: 'self' },
  { id: 'c7', name: '乌冬面', calories: 140, protein: 4, carbs: 30, fat: 1, unit: '份', isFatLossFriendly: false, category: 'carb', servingSize: 1, sourceType: 'both' },
  { id: 'c8', name: '龙猫紫菜饭团', calories: 160, protein: 4, carbs: 32, fat: 1, unit: '个', isFatLossFriendly: true, category: 'carb', servingSize: 1, sourceType: 'self' },
  { id: 'c9', name: '日式荞麦面', calories: 120, protein: 5, carbs: 25, fat: 1, unit: '份', isFatLossFriendly: true, category: 'carb', servingSize: 1, sourceType: 'both' },

  // 蔬菜 (veg)
  { id: 'v1', name: '白灼西兰花', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, unit: 'g', isFatLossFriendly: true, category: 'veg', servingSize: 100, sourceType: 'self' },
  { id: 'v2', name: '凉拌黄瓜', calories: 15, protein: 0.8, carbs: 2.9, fat: 0.2, unit: 'g', isFatLossFriendly: true, category: 'veg', servingSize: 100, sourceType: 'self' },
  { id: 'v3', name: '清炒油麦菜', calories: 40, protein: 1.4, carbs: 4.2, fat: 2, unit: 'g', isFatLossFriendly: true, category: 'veg', servingSize: 100, sourceType: 'self' },
  { id: 'v4', name: '什锦沙拉(油醋)', calories: 45, protein: 1.2, carbs: 6, fat: 2.2, unit: 'g', isFatLossFriendly: true, category: 'veg', servingSize: 150, sourceType: 'both' },
  { id: 'v5', name: '水煮菠菜', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, unit: 'g', isFatLossFriendly: true, category: 'veg', servingSize: 100, sourceType: 'self' },
  { id: 'v6', name: '胡萝卜煎蛋', calories: 120, protein: 6, carbs: 8, fat: 7, unit: '份', isFatLossFriendly: true, category: 'veg', servingSize: 1, sourceType: 'self' },
  { id: 'v7', name: '蒜蓉空心菜', calories: 45, protein: 2, carbs: 4, fat: 2.5, unit: 'g', isFatLossFriendly: true, category: 'veg', servingSize: 100, sourceType: 'both' },
  { id: 'v8', name: '干锅包菜', calories: 85, protein: 2, carbs: 6, fat: 6, unit: 'g', isFatLossFriendly: false, category: 'veg', servingSize: 100, sourceType: 'both' },

  // 加餐/零食 (snack)
  { id: 's1', name: '红富士苹果', calories: 78, protein: 0.4, carbs: 21, fat: 0.3, unit: '个', isFatLossFriendly: true, category: 'snack', servingSize: 1, sourceType: 'self' },
  { id: 's2', name: '无糖希腊酸奶', calories: 63, protein: 3.5, carbs: 4.5, fat: 3.5, unit: 'g', isFatLossFriendly: true, category: 'snack', servingSize: 100, sourceType: 'self' },
  { id: 's3', name: '珍珠加糖奶茶', calories: 400, protein: 3, carbs: 70, fat: 12.5, unit: '杯', isFatLossFriendly: false, category: 'snack', servingSize: 1, sourceType: 'delivery' },
  { id: 's4', name: '炸薯条(大份)', calories: 312, protein: 3.4, carbs: 41, fat: 15, unit: '份', isFatLossFriendly: false, category: 'snack', servingSize: 1, sourceType: 'delivery' },
  { id: 's5', name: '焦糖布丁', calories: 150, protein: 3, carbs: 22, fat: 5, unit: '个', isFatLossFriendly: false, category: 'snack', servingSize: 1, sourceType: 'both' },

  // 复合主食/定食主菜 (mixed)
  { id: 'm1', name: '番茄炒蛋', calories: 85, protein: 4.4, carbs: 4, fat: 5.5, unit: 'g', isFatLossFriendly: true, category: 'mixed', servingSize: 100, sourceType: 'self' },
  { id: 'm2', name: '经典红烧肉', calories: 489, protein: 10, carbs: 5, fat: 48, unit: 'g', isFatLossFriendly: false, category: 'mixed', servingSize: 100, sourceType: 'both' },
  { id: 'm3', name: '咖喱牛肉土豆', calories: 250, protein: 15, carbs: 18, fat: 12, unit: 'g', isFatLossFriendly: false, category: 'mixed', servingSize: 150, sourceType: 'both' },
  { id: 'm4', name: '日式寿喜锅', calories: 320, protein: 25, carbs: 12, fat: 18, unit: '份', isFatLossFriendly: true, category: 'mixed', servingSize: 1, sourceType: 'both' },
  { id: 'm5', name: '糖醋里脊', calories: 290, protein: 14, carbs: 25, fat: 15, unit: 'g', isFatLossFriendly: false, category: 'mixed', servingSize: 100, sourceType: 'both' },
  { id: 'm6', name: '香辣烤鱼', calories: 220, protein: 18, carbs: 5, fat: 14, unit: 'g', isFatLossFriendly: false, category: 'mixed', servingSize: 150, sourceType: 'delivery' },
  { id: 'm7', name: '经典意式腊肠披萨', calories: 268, protein: 11, carbs: 28, fat: 12, unit: 'g', isFatLossFriendly: false, category: 'mixed', servingSize: 100, sourceType: 'delivery' },
  { id: 'm8', name: '超值双层牛肉汉堡', calories: 490, protein: 26, carbs: 40, fat: 25, unit: '个', isFatLossFriendly: false, category: 'mixed', servingSize: 1, sourceType: 'delivery' },
  { id: 'm9', name: '青椒肉丝', calories: 180, protein: 12, carbs: 4, fat: 13, unit: 'g', isFatLossFriendly: true, category: 'mixed', servingSize: 100, sourceType: 'self' }
];

export const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case 'protein': return '高蛋白';
    case 'carb': return '优质碳水';
    case 'veg': return '膳食纤维';
    case 'snack': return '加餐/水果';
    case 'mixed': return '复合主食';
    default: return '其他';
  }
};

export interface SafetyResult {
  score: 1 | 2 | 3; // 1 = 绝对禁忌, 2 = 条件禁用, 3 = 优先推荐/放行
  levelLabel: '绝对禁忌' | '条件禁用' | '安全推荐' | '普通';
  reason: string;
}

// 辅助检测：匹配某些关键词
const containsAny = (text: string, keywords: string[]): boolean => {
  const normalized = text.toLowerCase();
  return keywords.some(keyword => normalized.includes(keyword.toLowerCase()));
};

// 1. 低脂低胆固醇饮食安全性检测
export const checkLowFatSafety = (foodName: string): SafetyResult => {
  // 级别 1: 绝对禁忌
  if (containsAny(foodName, ['西柚', '葡萄柚', '红柚', '柚子汁'])) {
    return {
      score: 1,
      levelLabel: '绝对禁忌',
      reason: '西柚/葡萄柚类会严重干扰阿托伐他汀等药物代谢，增加肌溶解风险，属于强交互拦截食品！'
    };
  }
  if (containsAny(foodName, ['代可可脂', '植物黄油', '氢化植物油', '氢化油', '起酥油', '人造奶油', '人造黄油', '酥皮', '曲奇', '饼干'])) {
    return {
      score: 1,
      levelLabel: '绝对禁忌',
      reason: '含有工业反式脂肪（如代可可脂、起酥油等），极易升高坏胆固醇，损害血管！'
    };
  }
  if (containsAny(foodName, ['烈酒', '白酒', '伏特加', '威士忌', '白兰地', '啤酒', '红酒', '重度料酒', '大曲酒'])) {
    return {
      score: 1,
      levelLabel: '绝对禁忌',
      reason: '酒精对服药期的肝脏负担极高，且易诱发血脂紊乱！'
    };
  }

  // 级别 2: 条件禁用
  if (containsAny(foodName, ['油炸', '深炸', '炸鸡', '薯条', '炸猪排', '酥炸', '煎炸', '烧烤', '烤串', '爆炒', '重油'])) {
    return {
      score: 2,
      levelLabel: '条件禁用',
      reason: '油炸/煎炸/重油爆炒/烧烤会带来极高饱和脂肪与热量！建议换用清蒸、水煮或无油烤。'
    };
  }
  if (containsAny(foodName, ['肥肉', '肥牛', '肥羊', '五花肉', '脑', '肝', '肾', '内脏', '鸡皮', '鸭皮', '蟹黄', '鱼子', '鱼卵', '大肠'])) {
    return {
      score: 2,
      levelLabel: '条件禁用',
      reason: '含有极高饱和脂肪或外源性胆固醇，会直接对冲降脂药物效果，应绝对避免！'
    };
  }
  if (containsAny(foodName, ['骨头汤', '排骨汤', '浓汤', '白汤', '久炖汤', '高汤'])) {
    return {
      score: 2,
      levelLabel: '条件禁用',
      reason: '长时间久炖的乳白肉汤/骨头汤中含有大量乳化的饱和脂肪和胆固醇，不利于血脂控制！'
    };
  }

  // 级别 3: 优先推荐
  if (containsAny(foodName, ['鸡胸肉', '去皮鸡', '鲈鱼', '鳕鱼', '龙利鱼', '虾仁', '基围虾', '扇贝', '贝柱']) && 
      containsAny(foodName, ['蒸', '煮', '清炒', '白灼', '炖'])) {
    return {
      score: 3,
      levelLabel: '安全推荐',
      reason: '低脂优质白肉且采用温和烹饪，极低饱和脂肪与胆固醇，是血管保护期的完美蛋白质来源！'
    };
  }
  if (containsAny(foodName, ['里脊', '牛里脊', '猪里脊', '牛肉丝', '猪肉丝', '肉糜', '肉丸']) && 
      !containsAny(foodName, ['炸', '烤', '重油'])) {
    return {
      score: 3,
      levelLabel: '安全推荐',
      reason: '极低脂瘦红肉，采用快炒/肉丸/慢炖至软烂，既补充铁与蛋白质又避免过多脂肪摄入。'
    };
  }
  if (containsAny(foodName, ['燕麦', '大麦', '荞麦', '山药', '南瓜'])) {
    return {
      score: 3,
      levelLabel: '安全推荐',
      reason: '富含水溶性膳食纤维的粗粮，有助于在肠道中结合胆汁酸，从而辅助降低胆固醇！'
    };
  }
  if (containsAny(foodName, ['豆腐', '北豆腐', '老豆腐', '豆干']) && !containsAny(foodName, ['炸', '煎', '凉拌'])) {
    return {
      score: 3,
      levelLabel: '安全推荐',
      reason: '豆制品含有丰富的优质植物蛋白，且天然无胆固醇、低脂肪，推荐炖煮。'
    };
  }
  if (containsAny(foodName, ['菠菜', '菜心', '胡萝卜', '西葫芦', '番茄', '西红柿', '蓝莓', '草莓', '猕猴桃'])) {
    return {
      score: 3,
      levelLabel: '安全推荐',
      reason: '富含抗氧化维生素和水溶性纤维，能极好地保护血管内皮、抗硬化。'
    };
  }
  if (containsAny(foodName, ['橄榄油', '茶油'])) {
    return {
      score: 3,
      levelLabel: '安全推荐',
      reason: '富含单不饱和脂肪酸，利于提高好胆固醇。需严格控油（单餐量<15g）。'
    };
  }

  // 默认普通
  return {
    score: 3,
    levelLabel: '普通',
    reason: '该食物对于低脂低胆固醇饮食属于普通级别，请确保烹饪时严格控油、避免肥肉。'
  };
};

// 2. 肠胃友好饮食安全性检测
export const checkGastricSafety = (foodName: string): SafetyResult => {
  // 级别 1: 绝对禁忌
  if (containsAny(foodName, ['可乐', '雪碧', '苏打水', '起泡酒', '碳酸', '汽水', '冰淇淋', '奶茶', '甜饮料'])) {
    return {
      score: 1,
      levelLabel: '绝对禁忌',
      reason: '碳酸饮料和高糖高脂饮品极易引起胃部积气、腹胀，刺激脆弱胃黏膜！'
    };
  }

  // 级别 2: 条件禁用
  if (containsAny(foodName, ['纯牛奶', '全脂奶', '肥肉', '浓汤', '骨头汤', '炸猪排', '油炸', '薯条', '炸鸡', '炸'])) {
    return {
      score: 2,
      levelLabel: '条件禁用',
      reason: '高脂肪及含乳糖食物会严重延缓胃排空，使食物在胃内发酵产气，加重胃胀气！'
    };
  }
  if (containsAny(foodName, ['西兰花', '花菜', '卷心菜', '洋葱', '大蒜', '蒜', '芦笋'])) {
    if (containsAny(foodName, ['生', '沙拉', '凉拌', '未熟', '夹生'])) {
      return {
        score: 2,
        levelLabel: '条件禁用',
        reason: '高发酵（高FODMAP）蔬菜生食或未熟透时在肠胃中会剧烈产气，导致严重腹胀！'
      };
    }
  }
  if (containsAny(foodName, ['苹果', '梨', '芒果', '西瓜'])) {
    if (containsAny(foodName, ['生', '直接', '冰', '凉', '冻'])) {
      return {
        score: 2,
        levelLabel: '条件禁用',
        reason: '高发酵/高糖水果直接生吃或冰镇易刺激胃痉挛并引起腹胀发酵！'
      };
    }
  }
  if (containsAny(foodName, ['糯米', '粽子', '年糕', '红薯', '芋头'])) {
    if (containsAny(foodName, ['凉', '冷', '冻'])) {
      return {
        score: 2,
        levelLabel: '条件禁用',
        reason: '高支链淀粉（糯米制品、薯类）冷却后会回生，极难消化并在胃中发酵产气，建议热食。'
      };
    }
  }
  if (containsAny(foodName, ['黄豆', '绿豆', '红豆'])) {
    if (!containsAny(foodName, ['彻底', '烂', '熟', '软'])) {
      return {
        score: 2,
        levelLabel: '条件禁用',
        reason: '豆类含有较多低聚糖，如果未彻底煮烂或生饮豆浆，极易在胃肠中大量产气。'
      };
    }
  }

  // 级别 3: 优先推荐
  if (containsAny(foodName, ['小米粥', '白米粥', '烂面条', '软面', '稀饭', '山药', '南瓜']) && 
      !containsAny(foodName, ['凉', '冰'])) {
    return {
      score: 3,
      levelLabel: '安全推荐',
      reason: '充分糊化的温热流食/软食易于消化吸收，能保护胃黏膜并促进胃排空。'
    };
  }
  if (containsAny(foodName, ['冬瓜', '丝瓜', '西葫芦', '去皮茄子', '熟番茄', '西红柿']) && 
      !containsAny(foodName, ['生', '凉拌'])) {
    return {
      score: 3,
      levelLabel: '安全推荐',
      reason: '去皮、切丝并焖烂的温和低发酵蔬菜，纤维细嫩，对胃黏膜无磨损、不产气。'
    };
  }
  if (containsAny(foodName, ['鱼肉', '鱼片', '去皮鸡胸肉', '虾仁', '肉糜', '肉丸', '老豆腐']) && 
      !containsAny(foodName, ['煎', '炸', '冷', '凉'])) {
    return {
      score: 3,
      levelLabel: '安全推荐',
      reason: '鱼肉、虾仁或肉泥丸，肌纤维短易消化，清蒸或水煮极软烂，减轻胃部负担。'
    };
  }
  if (containsAny(foodName, ['蓝莓', '草莓', '猕猴桃']) && !containsAny(foodName, ['冰', '冷'])) {
    return {
      score: 3,
      levelLabel: '安全推荐',
      reason: '低发酵安全水果，常温食用，不刺激胃酸过度分泌或胀气。'
    };
  }
  if (containsAny(foodName, ['生姜', '姜丝', '陈皮', '薄荷', '大麦茶', '荞麦茶'])) {
    return {
      score: 3,
      levelLabel: '安全推荐',
      reason: '生姜、陈皮、薄荷等配料温中散寒、行气消胀、促进胃动力，非常适合茶饮。'
    };
  }

  // 默认普通
  return {
    score: 3,
    levelLabel: '普通',
    reason: '该食物对于肠胃健康属于普通级别，请确保趁热吃、细嚼慢咽，烹饪软烂。'
  };
};

export const SAFE_FALLBACK_FOODS: FoodItem[] = [
  { id: 'sf1', name: '清蒸鲈鱼', calories: 105, protein: 18, carbs: 0, fat: 3, unit: 'g', isFatLossFriendly: true, category: 'protein', servingSize: 100, sourceType: 'self' },
  { id: 'sf2', name: '白灼基围虾', calories: 99, protein: 22, carbs: 0, fat: 1.1, unit: 'g', isFatLossFriendly: true, category: 'protein', servingSize: 100, sourceType: 'self' },
  { id: 'sf3', name: '水煮菠菜', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, unit: 'g', isFatLossFriendly: true, category: 'veg', servingSize: 100, sourceType: 'self' },
  { id: 'sf4', name: '小米粥', calories: 46, protein: 1.4, carbs: 8.4, fat: 0.7, unit: 'g', isFatLossFriendly: true, category: 'carb', servingSize: 100, sourceType: 'self' },
  { id: 'sf5', name: '蒸南瓜(热)', calories: 23, protein: 0.7, carbs: 5.3, fat: 0.1, unit: 'g', isFatLossFriendly: true, category: 'carb', servingSize: 100, sourceType: 'self' },
  { id: 'sf6', name: '老豆腐清汤', calories: 50, protein: 5.5, carbs: 1.5, fat: 2.5, unit: 'g', isFatLossFriendly: true, category: 'protein', servingSize: 100, sourceType: 'self' },
  { id: 'sf7', name: '清蒸去皮鸡胸肉', calories: 120, protein: 26, carbs: 0, fat: 1.8, unit: 'g', isFatLossFriendly: true, category: 'protein', servingSize: 100, sourceType: 'self' },
  { id: 'sf8', name: '温热烂面条', calories: 110, protein: 4, carbs: 22, fat: 0.8, unit: 'g', isFatLossFriendly: true, category: 'carb', servingSize: 100, sourceType: 'self' }
];


import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Compass, 
  Camera, 
  History, 
  Settings as SettingsIcon, 
  Trash2, 
  Sparkles, 
  RotateCw, 
  Calendar,
  ShieldCheck,
  AlertCircle,
  Refrigerator,
  ShieldAlert,
  Heart
} from 'lucide-react';
import type { FoodItem, MealLog, Profile, MealType } from './types';
import { INITIAL_FOODS, checkLowFatSafety, checkGastricSafety, SAFE_FALLBACK_FOODS } from './db';

// 基础 TDEE 及目标热量计算函数
const calculateTargets = (profile: Omit<Profile, 'calorieBudget' | 'proteinTarget' | 'carbTarget' | 'fatTarget'>): {
  calorieBudget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
} => {
  const { gender, age, height, weight, activityLevel, goal, lowFatCholesterolDiet } = profile;
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr = gender === 'male' ? bmr + 5 : bmr - 161;

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    heavy: 1.725
  };

  const tdee = bmr * activityMultipliers[activityLevel];
  let deficit = 500;
  if (goal === 'maintain') deficit = 0;
  if (goal === 'lose-slow') deficit = 300;
  if (goal === 'lose-normal') deficit = 500;
  if (goal === 'lose-fast') deficit = 750;

  const calorieBudget = Math.max(1200, Math.round(tdee - deficit));
  const proteinTarget = Math.round(weight * 2.0); // 蛋白质：2g/kg
  
  // 开启低脂低胆固醇饮食时，脂肪供能比由 20% 收紧至 15%，碳水相应调高
  const fatRatio = lowFatCholesterolDiet ? 0.15 : 0.20;
  const fatTarget = Math.round((calorieBudget * fatRatio) / 9);
  const carbTarget = Math.round((calorieBudget - (proteinTarget * 4) - (fatTarget * 9)) / 4);

  return { calorieBudget, proteinTarget, carbTarget, fatTarget };
};


export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wheel' | 'scan' | 'logs' | 'settings' | 'fridge'>('dashboard');
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [guideTab, setGuideTab] = useState<'lowFat' | 'gastric'>('lowFat');

  // 用户个人配置
  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem('diet_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          lowFatCholesterolDiet: false,
          gastricFriendlyDiet: false,
          ...parsed
        };
      } catch (e) {}
    }
    const initialRaw = {
      gender: 'male' as const,
      age: 26,
      height: 175,
      weight: 75,
      activityLevel: 'moderate' as const,
      goal: 'lose-normal' as const,
      lowFatCholesterolDiet: false,
      gastricFriendlyDiet: false,
    };
    const targets = calculateTargets(initialRaw);
    return { ...initialRaw, ...targets };
  });

  // 食物列表与今日打卡记录
  const [foodList, setFoodList] = useState<FoodItem[]>(() => {
    const saved = localStorage.getItem('diet_foods');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_FOODS;
  });

  const [logs, setLogs] = useState<MealLog[]>(() => {
    const saved = localStorage.getItem('diet_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const today = new Date().setHours(0, 0, 0, 0);
        return parsed.filter((log: any) => new Date(log.timestamp).setHours(0, 0, 0, 0) === today);
      } catch (e) {}
    }
    return [];
  });

  const [fridgeItems, setFridgeItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('fitlife_fridge');
    return saved ? JSON.parse(saved) : ['番茄', '鸡蛋', '半个洋葱', '生菜'];
  });

  const [newFridgeItem, setNewFridgeItem] = useState('');
  const [fridgeRecipeCount, setFridgeRecipeCount] = useState<number>(1);

  useEffect(() => {
    localStorage.setItem('fitlife_fridge', JSON.stringify(fridgeItems));
  }, [fridgeItems]);

  // API 密钥配置
  const [apiType, setApiType] = useState<'gemini' | 'bailian'>(() => {
    return (localStorage.getItem('api_type') as 'gemini' | 'bailian') || 'gemini';
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('api_key') || localStorage.getItem('gemini_api_key') || '';
  });
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => {
    return localStorage.getItem('api_base_url') || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  });
  const [modelName, setModelName] = useState<string>(() => {
    return localStorage.getItem('model_name') || 'qwen3.6-plus';
  });

  // 保存数据联动到 LocalStorage
  useEffect(() => { localStorage.setItem('diet_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('diet_foods', JSON.stringify(foodList)); }, [foodList]);
  useEffect(() => { localStorage.setItem('diet_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('api_type', apiType); }, [apiType]);
  useEffect(() => { localStorage.setItem('api_key', apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem('api_base_url', apiBaseUrl); }, [apiBaseUrl]);
  useEffect(() => { localStorage.setItem('model_name', modelName); }, [modelName]);

  // 添加打卡
  const addMealLog = (food: Omit<FoodItem, 'id' | 'isFatLossFriendly' | 'category'>, amount: number, mealType: MealType) => {
    const factor = amount / food.servingSize;
    const newLog: MealLog = {
      id: Math.random().toString(36).substr(2, 9),
      foodName: food.name,
      calories: Math.round(food.calories * factor),
      protein: parseFloat((food.protein * factor).toFixed(1)),
      carbs: parseFloat((food.carbs * factor).toFixed(1)),
      fat: parseFloat((food.fat * factor).toFixed(1)),
      amount,
      mealType,
      timestamp: Date.now(),
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const deleteLog = (id: string) => { setLogs(prev => prev.filter(log => log.id !== id)); };
  const clearAllLogs = () => { if (window.confirm('确认清除今日所有饮食记录吗？')) setLogs([]); };

  // 控制台计算
  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = logs.reduce((sum, log) => sum + log.protein, 0);
  const totalCarbs = logs.reduce((sum, log) => sum + log.carbs, 0);
  const totalFat = logs.reduce((sum, log) => sum + log.fat, 0);

  const caloriePercentage = Math.min(100, Math.round((totalCalories / profile.calorieBudget) * 100));
  const proteinPercentage = Math.min(100, Math.round((totalProtein / profile.proteinTarget) * 100));
  const carbPercentage = Math.min(100, Math.round((totalCarbs / profile.carbTarget) * 100));
  const fatPercentage = Math.min(100, Math.round((totalFat / profile.fatTarget) * 100));

  // 校验当前所有已打卡食物的安全性，返回需要警报的内容
  const loggedAlerts = React.useMemo(() => {
    const alerts: { foodName: string; score: 1 | 2; type: 'low-fat' | 'gastric'; reason: string }[] = [];
    
    logs.forEach(log => {
      if (profile.lowFatCholesterolDiet) {
        const check = checkLowFatSafety(log.foodName);
        if (check.score === 1 || check.score === 2) {
          alerts.push({
            foodName: log.foodName,
            score: check.score,
            type: 'low-fat',
            reason: check.reason
          });
        }
      }
      if (profile.gastricFriendlyDiet) {
        const check = checkGastricSafety(log.foodName);
        if (check.score === 1 || check.score === 2) {
          alerts.push({
            foodName: log.foodName,
            score: check.score,
            type: 'gastric',
            reason: check.reason
          });
        }
      }
    });

    return alerts;
  }, [logs, profile.lowFatCholesterolDiet, profile.gastricFriendlyDiet]);

  // 大转盘逻辑
  const [wheelFoodPool, setWheelFoodPool] = useState<FoodItem[]>([]);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinWinner, setSpinWinner] = useState<FoodItem | null>(null);
  const [spinCombo, setSpinCombo] = useState<FoodItem[]>([]);
  const [wheelMealType, setWheelMealType] = useState<MealType>('lunch');
  const [wheelFatLossOnly, setWheelFatLossOnly] = useState(true);
  const [wheelLowFatOnly, setWheelLowFatOnly] = useState(() => {
    const saved = localStorage.getItem('diet_profile');
    if (saved) {
      try {
        return JSON.parse(saved).lowFatCholesterolDiet || false;
      } catch (e) {}
    }
    return false;
  });
  const [wheelGastricOnly, setWheelGastricOnly] = useState(() => {
    const saved = localStorage.getItem('diet_profile');
    if (saved) {
      try {
        return JSON.parse(saved).gastricFriendlyDiet || false;
      } catch (e) {}
    }
    return false;
  });
  const [wheelSourceType, setWheelSourceType] = useState<'all' | 'self' | 'delivery'>('all');
  const [wheelMode, setWheelMode] = useState<'db' | 'custom'>('db');
  const [customChoices, setCustomChoices] = useState<string[]>(['黄焖鸡米饭', '轻爽蔬菜沙拉', '西红柿鸡蛋面']);
  const [spinModalOpen, setSpinModalOpen] = useState(false);
  const [customSpinAmount, setCustomSpinAmount] = useState<number>(100);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 当用户配置更新时，自动同步转盘的勾选项
  useEffect(() => {
    setWheelLowFatOnly(profile.lowFatCholesterolDiet);
    setWheelGastricOnly(profile.gastricFriendlyDiet);
  }, [profile.lowFatCholesterolDiet, profile.gastricFriendlyDiet]);

  useEffect(() => {
    let filtered = foodList;
    
    // 按餐次过滤
    if (wheelMealType === 'breakfast') {
      filtered = filtered.filter(f => f.category === 'carb' || f.category === 'protein' || f.category === 'snack');
    } else if (wheelMealType === 'snack') {
      filtered = filtered.filter(f => f.category === 'snack');
    } else {
      filtered = filtered.filter(f => f.category !== 'snack');
    }

    // 按减脂友好过滤
    if (wheelFatLossOnly) {
      filtered = filtered.filter(f => f.isFatLossFriendly);
    }
    
    // 按制作来源过滤
    if (wheelSourceType !== 'all') {
      filtered = filtered.filter(f => !f.sourceType || f.sourceType === 'both' || f.sourceType === wheelSourceType);
    }

    // 按低脂低胆固醇防线过滤
    if (wheelLowFatOnly) {
      filtered = filtered.filter(f => {
        const check = checkLowFatSafety(f.name);
        return check.score !== 1 && check.score !== 2;
      });
    }

    // 按肠胃友好防线过滤
    if (wheelGastricOnly) {
      filtered = filtered.filter(f => {
        const check = checkGastricSafety(f.name);
        return check.score !== 1 && check.score !== 2;
      });
    }

    if (filtered.length === 0) {
      if (wheelLowFatOnly || wheelGastricOnly) {
        // 如果开启了健康防线且过滤后为空，使用量身定制的无感防线保底池
        filtered = SAFE_FALLBACK_FOODS;
      } else {
        filtered = INITIAL_FOODS.filter(f => f.isFatLossFriendly);
      }
    }
    setWheelFoodPool(filtered.slice(0, 12));
  }, [foodList, wheelFatLossOnly, wheelLowFatOnly, wheelGastricOnly, wheelMealType, wheelSourceType]);

  useEffect(() => {
    if (!canvasRef.current || wheelFoodPool.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;
    ctx.clearRect(0, 0, size, size);

    const poolSize = wheelMode === 'custom' ? customChoices.length : wheelFoodPool.length;
    if (poolSize === 0) return;
    const arcSize = (2 * Math.PI) / poolSize;

    const sliceColors = [
      'rgba(124, 169, 130, 0.4)', // Ghibli Green
      'rgba(136, 178, 204, 0.3)', // Sky Blue
      'rgba(230, 138, 92, 0.4)',  // Warm Orange
      'rgba(244, 196, 48, 0.3)',  // Golden Yellow
      'rgba(217, 83, 79, 0.3)',   // Studio Ghibli Red
      'rgba(180, 150, 210, 0.4)'  // Soft Lavender
    ];

    for (let index = 0; index < poolSize; index++) {
      const startAngle = index * arcSize;
      const endAngle = startAngle + arcSize;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      if (wheelMode === 'custom') {
        ctx.fillStyle = sliceColors[index % sliceColors.length];
      } else {
        const food = wheelFoodPool[index];
        if (food && food.isFatLossFriendly) {
          ctx.fillStyle = index % 2 === 0 ? 'rgba(124, 169, 130, 0.4)' : 'rgba(136, 178, 204, 0.3)';
        } else {
          ctx.fillStyle = index % 2 === 0 ? 'rgba(230, 138, 92, 0.4)' : 'rgba(217, 83, 79, 0.3)';
        }
      }
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      let text = '';
      let isFriendly = true;
      if (wheelMode === 'custom') {
        text = customChoices[index] || '';
        ctx.fillStyle = '#3B2E2A';
      } else {
        const food = wheelFoodPool[index];
        if (food) {
          text = food.name;
          isFriendly = food.isFatLossFriendly;
        }
        ctx.fillStyle = isFriendly ? '#3B2E2A' : '#D9534F';
      }

      ctx.font = 'bold 11px system-ui';
      const displayText = text.length > 5 ? text.slice(0, 5) + '..' : text;
      ctx.fillText(displayText, radius - 15, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0b16';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [wheelFoodPool, wheelMode, customChoices]);

  const spinWheel = () => {
    const poolSize = wheelMode === 'custom' ? customChoices.length : wheelFoodPool.length;
    if (isSpinning || poolSize === 0) return;
    setIsSpinning(true);
    setSpinWinner(null);

    const winnerIndex = Math.floor(Math.random() * poolSize);
    const sliceAngle = 360 / poolSize;
    const targetAngle = 1800 + (360 - (winnerIndex * sliceAngle) - (sliceAngle / 2)) - 90;
    
    setWheelRotation(targetAngle);

    setTimeout(() => {
      setIsScanning(false); // 确保重置AI标志
      setIsSpinning(false);
      
      let winner: FoodItem;
      let combo: FoodItem[] = [];

      if (wheelMode === 'custom') {
        const winnerName = customChoices[winnerIndex];
        winner = {
          id: 'custom_winner',
          name: winnerName,
          calories: 450, // 默认的估算占位
          protein: 18.0,
          carbs: 55.0,
          fat: 15.0,
          unit: '份',
          isFatLossFriendly: true,
          category: 'mixed',
          servingSize: 1,
          sourceType: 'delivery'
        };
      } else {
        winner = wheelFoodPool[winnerIndex];
        if (winner.category === 'protein' || winner.category === 'mixed') {
          const carbs = INITIAL_FOODS.filter(f => f.category === 'carb');
          const vegs = INITIAL_FOODS.filter(f => f.category === 'veg');
          const randomCarb = carbs[Math.floor(Math.random() * carbs.length)];
          const randomVeg = vegs[Math.floor(Math.random() * vegs.length)];
          combo = [randomCarb, randomVeg];
        }
      }

      setSpinWinner(winner);
      setSpinCombo(combo);
      setCustomSpinAmount(winner.servingSize);
      setSpinModalOpen(true);
    }, 5000);
  };

  // AI 识图与文字识别逻辑
  const [scanMode, setScanMode] = useState<'photo' | 'text'>('photo');
  const [textInput, setTextInput] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    foodName: string;
    estimatedWeight: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: number;
    reasoning: string;
    isMock?: boolean;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanMealType, setScanMealType] = useState<MealType>('lunch');

  const scanLowFatCheck = scanResult && profile.lowFatCholesterolDiet ? checkLowFatSafety(scanResult.foodName) : null;
  const scanGastricCheck = scanResult && profile.gastricFriendlyDiet ? checkGastricSafety(scanResult.foodName) : null;

  const winnerLowFatCheck = spinWinner && profile.lowFatCholesterolDiet ? checkLowFatSafety(spinWinner.name) : null;
  const winnerGastricCheck = spinWinner && profile.gastricFriendlyDiet ? checkGastricSafety(spinWinner.name) : null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setScanResult(null);
        setScanError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // 模拟识别
  const simulateScan = () => {
    setIsScanning(true);
    setScanError(null);

    // 延时展示高大上的识别动效
    setTimeout(() => {
      setIsScanning(false);
      if (scanMode === 'photo') {
        // 如果开启了健康防线，图片识别返回一个完美避坑的套餐以示成功
        if (profile.lowFatCholesterolDiet || profile.gastricFriendlyDiet) {
          setScanResult({
            foodName: '清蒸鲈鱼配小米稠粥及熟番茄',
            estimatedWeight: 400,
            calories: 320,
            protein: 24.5,
            carbs: 48.0,
            fat: 3.5,
            confidence: 0.94,
            reasoning: '检测到低脂/肠胃友好防线已开启。评估：清蒸鲈鱼（~120g白肉，极低饱和脂肪）极易消化；小米稠粥高温足水充分糊化，能保护胃黏膜并促进胃排空；熟番茄无酸且去皮，纤维细嫩，是完美避坑的推荐膳食。',
            isMock: true
          });
        } else {
          setScanResult({
            foodName: '香煎鸡胸肉配藜麦饭与烤时蔬',
            estimatedWeight: 350,
            calories: 385,
            protein: 35.2,
            carbs: 45.5,
            fat: 7.8,
            confidence: 0.92,
            reasoning: '根据盘中食物外观，含有约120g熟鸡胸肉（~200大卡），100g熟藜麦饭（~120大卡），以及少量橄榄油烤制的南瓜与西兰花（~65大卡）。总体蛋白质丰富，适合减脂晚餐。',
            isMock: true
          });
        }
      } else {
        const input = textInput.trim().toLowerCase();
        
        if (input.includes('西柚') || input.includes('柚子')) {
          setScanResult({
            foodName: '鲜榨西柚汁',
            estimatedWeight: 250,
            calories: 110,
            protein: 1.2,
            carbs: 26.5,
            fat: 0.2,
            confidence: 0.98,
            reasoning: '分析输入“西柚汁”：绝对禁忌食品。西柚中的呋喃香豆素类化合物会强效抑制肠道及肝脏的 CYP3A4 酶活性，导致他汀类药物血药浓度异常增高，增加严重的肌溶解和肝损伤风险！',
            isMock: true
          });
        } else if (input.includes('可乐') || input.includes('雪碧') || input.includes('汽水') || input.includes('碳酸')) {
          setScanResult({
            foodName: '冰镇碳酸可乐',
            estimatedWeight: 330,
            calories: 140,
            protein: 0,
            carbs: 35,
            fat: 0,
            confidence: 0.98,
            reasoning: '分析输入碳酸饮料：绝对禁忌食品。强酸性与高含气量会严重刺激胃黏膜，导致胃张力急剧上升、发酵积气，并剧烈延缓胃排空速度！',
            isMock: true
          });
        } else if (input.includes('炸鸡') || input.includes('炸猪排') || input.includes('薯条') || input.includes('油炸') || input.includes('炸')) {
          setScanResult({
            foodName: '脆皮炸鸡配炸薯条',
            estimatedWeight: 300,
            calories: 780,
            protein: 28.5,
            carbs: 55.0,
            fat: 45.5,
            confidence: 0.95,
            reasoning: '分析输入炸物：条件禁用/绝对避免。高温深炸吸油严重，包含高饱和脂肪，强效刺激胆囊收缩并严重减缓胃排空速度（脂肪在胃内停留超4小时），对心血管及肠胃有双重高危打击！',
            isMock: true
          });
        } else if (input.includes('冰西瓜') || (input.includes('西瓜') && (input.includes('冰') || input.includes('冷')))) {
          setScanResult({
            foodName: '冰镇西瓜',
            estimatedWeight: 400,
            calories: 120,
            protein: 2.4,
            carbs: 28.0,
            fat: 0.4,
            confidence: 0.96,
            reasoning: '分析输入冰西瓜：肠胃条件禁用。西瓜属于高糖高发酵水果，冰镇状态下摄入会使胃壁血管骤然收缩，抑制胃动力并引发食物胃内异常发酵，诱发胃痉挛与胃胀气！',
            isMock: true
          });
        } else if (input.includes('骨头汤') || input.includes('浓汤') || input.includes('排骨汤')) {
          setScanResult({
            foodName: '久炖浓白猪骨汤',
            estimatedWeight: 300,
            calories: 220,
            protein: 8.5,
            carbs: 3.0,
            fat: 19.5,
            confidence: 0.94,
            reasoning: '分析输入浓肉汤：低脂及肠胃条件禁用。长时间炖煮使肉骨脂肪充分乳化，汤中充斥高浓度饱和脂肪与游离胆固醇，会使降脂药效果全失；高脂肉汤亦会极大降低胃排空，加剧胀气！',
            isMock: true
          });
        } else if (input.includes('小米') || input.includes('粥') || input.includes('山药')) {
          setScanResult({
            foodName: '温热铁棍山药小米稠粥',
            estimatedWeight: 300,
            calories: 138,
            protein: 3.8,
            carbs: 28.5,
            fat: 0.8,
            confidence: 0.97,
            reasoning: '分析主食粥：优先推荐。经过高温足水充分糊化，极易消化吸收；富含山药多糖，能在胃黏膜表面形成保护膜，且属于低发酵，是胃部不适期的黄金膳食！',
            isMock: true
          });
        } else {
          // 默认根据开启的健康偏好推荐安全食物
          if (profile.lowFatCholesterolDiet && profile.gastricFriendlyDiet) {
            setScanResult({
              foodName: '水煮鸡胸肉配小米稠粥及水煮菠菜',
              estimatedWeight: 350,
              calories: 280,
              protein: 28.5,
              carbs: 35.0,
              fat: 2.2,
              confidence: 0.95,
              reasoning: `分析输入“${textInput.trim() || '默认减脂餐'}”：已同时开启低脂低胆固醇与肠胃友好模式。默认推荐水煮鸡胸肉（极低脂白肉）+ 小米稠粥（高糊化主食）+ 熟菠菜（温和纤维）。低脂且温热，完美契合！`,
              isMock: true
            });
          } else if (profile.lowFatCholesterolDiet) {
            setScanResult({
              foodName: '白灼基围虾配蒸南瓜',
              estimatedWeight: 250,
              calories: 190,
              protein: 22.5,
              carbs: 20.0,
              fat: 1.2,
              confidence: 0.94,
              reasoning: `分析输入“${textInput.trim() || '默认减脂餐'}”：已开启低脂低胆固醇模式。推荐白灼海虾仁（高蛋白极低脂）+ 蒸南瓜（健康粗粮）。饱和脂肪与胆固醇极低，有益心血管。`,
              isMock: true
            });
          } else if (profile.gastricFriendlyDiet) {
            setScanResult({
              foodName: '清蒸鳕鱼片配烂面条',
              estimatedWeight: 300,
              calories: 240,
              protein: 18.0,
              carbs: 32.0,
              fat: 1.8,
              confidence: 0.93,
              reasoning: `分析输入“${textInput.trim() || '默认减脂餐'}”：已开启肠胃友好模式。推荐清蒸鳕鱼（短肌纤维极易消化）+ 烂面条（糊化细软主食）。不产气、不延缓胃排空，抚平胃胀气。`,
              isMock: true
            });
          } else {
            const inputVal = textInput.trim() || '我吃了两个水煮蛋和一碗糙米饭';
            setScanResult({
              foodName: inputVal.includes('蛋') && inputVal.includes('米') ? '水煮蛋配糙米饭' : '减脂沙拉组合',
              estimatedWeight: inputVal.includes('蛋') && inputVal.includes('米') ? 200 : 250,
              calories: inputVal.includes('蛋') && inputVal.includes('米') ? 255 : 210,
              protein: inputVal.includes('蛋') && inputVal.includes('米') ? 15.2 : 18.5,
              carbs: inputVal.includes('蛋') && inputVal.includes('米') ? 23.6 : 12.0,
              fat: inputVal.includes('蛋') && inputVal.includes('米') ? 10.5 : 8.5,
              confidence: 0.92,
              reasoning: `分析输入“${inputVal}”：估算营养素及卡路里构成。总体热量合理，符合常规减脂餐。`,
              isMock: true
            });
          }
        }
      }
    }, 2500);
  };

  // 真实大模型 API 识图或文本计算
  const runRealScan = async () => {
    if (scanMode === 'photo' && !selectedImage) return;
    if (scanMode === 'text' && !textInput.trim()) {
      setScanError('请输入你吃过的食物描述文字！');
      return;
    }

    if (!apiKey) {
      setScanError(`⚠️ 未配置 API Key，无法使用真实 AI 进行分析。请前往「配置」页面填入有效的 ${apiType === 'gemini' ? 'Gemini' : '阿里云百炼'} API Key。你可以点击下方的“本地模拟”进行功能效果预览。`);
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      let healthInstructions = '';
      if (profile.lowFatCholesterolDiet) {
        healthInstructions += `\n- 用户开启了【低脂低胆固醇防线】：特别关注低饱和脂肪和低外源性胆固醇。绝对拦截西柚/葡萄柚（影响他汀代谢）、反式脂肪和高浓度酒精；条件拦截油炸/烧烤、高脂五花肉/内脏/鸡鸭皮及动物浓汤。`;
      }
      if (profile.gastricFriendlyDiet) {
        healthInstructions += `\n- 用户开启了【肠胃友好防线】：特别关注易消化防胀气。绝对拦截碳酸饮料/高糖高脂饮品；条件拦截生冷/凉拌/冰镇高产气食物（如生西兰花/卷心菜/洋葱/蒜，凉糯米/红薯，冰西瓜/苹果等）及高脂全脂牛奶（严重延缓胃排空）。`;
      }
      if (healthInstructions) {
        healthInstructions += `\n请在 "reasoning" 字段中，除了常规的估算说明外，必须针对该用户的健康防线，额外给出一句避坑安全点评或膳食搭配建议。`;
      }

      let prompt = '';
      if (scanMode === 'photo') {
        prompt = `你是一个专业的减脂与临床营养师。请分析这张食物照片，识别照片中的食物种类，估算其总分量（克），并提供总能量（大卡卡路里）、蛋白质（克）、碳水化合物（克）、脂肪（克）的估算数值。${healthInstructions}请确保只返回一个完整的 JSON 对象，格式如下，不要包含 markdown 标记或任何其他多余的解释文字：
{
  "foodName": "食物名称 (中文)",
  "estimatedWeight": 150,
  "calories": 250,
  "protein": 15.0,
  "carbs": 30.0,
  "fat": 8.0,
  "confidence": 0.9,
  "reasoning": "热量估算构成及健康防线安全评估点评"
}`;
      } else {
        prompt = `你是一个专业的减脂与临床营养师。用户向你描述了他吃过的食物内容：
【${textInput}】
请分析他吃的东西，识别出食物种类并估算其总分量（克），计算出总能量（大卡卡路里）、蛋白质（克）、碳水化合物（克）、脂肪（克）的估算数值。${healthInstructions}请确保只返回一个完整的 JSON 对象，格式如下，不要包含 markdown 标记或任何其他多余的解释文字：
{
  "foodName": "主要食物名称",
  "estimatedWeight": 150,
  "calories": 250,
  "protein": 15.0,
  "carbs": 30.0,
  "fat": 8.0,
  "confidence": 0.9,
  "reasoning": "根据文字描述进行估算，并结合健康防线给出安全评估点评"
}`;
      }

      let parsedResult;

      if (apiType === 'gemini') {
        const parts: any[] = [{ text: prompt }];
        if (scanMode === 'photo') {
          const base64Data = selectedImage!.split(',')[1];
          const mimeType = selectedImage!.split(',')[0].split(':')[1].split(';')[0];
          parts.push({
            inlineData: { mimeType, data: base64Data }
          });
        }

        let response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );

        if (response.status === 503) {
          console.warn('Gemini 3.5 Flash 拥挤 (503)，正在自动降级请求 3.1 Flash Lite...');
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { responseMimeType: "application/json" }
              })
            }
          );
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API 连接失败 (状态码: ${response.status})，错误原因: ${errText}`);
        }
        const resData = await response.json();
        const textResult = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResult) throw new Error('Gemini API 未能解析出有效数据。');

        let cleanJson = textResult.trim();
        if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
        if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
        parsedResult = JSON.parse(cleanJson.trim());
      } else {
        const cleanBaseUrl = apiBaseUrl.trim().replace(/\/+$/, '');
        let messagesContent: any = prompt;
        if (scanMode === 'photo') {
          messagesContent = [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: selectedImage } }
          ];
        }

        const response = await fetch(
          `${cleanBaseUrl}/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: modelName,
              messages: [{ role: 'user', content: messagesContent }],
              response_format: { type: 'json_object' }
            })
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`百炼 API 请求失败 (代码: ${response.status})，错误原因: ${errText}`);
        }

        const resData = await response.json();
        const textResult = resData.choices?.[0]?.message?.content;
        if (!textResult) throw new Error('百炼 API 返回数据为空，未解析到结果内容。');

        let cleanJson = textResult.trim();
        if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
        if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
        parsedResult = JSON.parse(cleanJson.trim());
      }

      setScanResult({
        ...parsedResult,
        isMock: false
      });
    } catch (err: any) {
      console.error(err);
      setScanError(`真实 AI 接口调用失败: ${err.message || '网络连接超时'}。请检查你的 API Key 是否填写正确、余额是否充足，或者是否存在浏览器跨域 (CORS) 限制。`);
    } finally {
      setIsScanning(false);
    }
  };

  // 设置页配置与自定义食物
  const [editProfile, setEditProfile] = useState<{
    gender: 'male' | 'female';
    age: number | string;
    height: number | string;
    weight: number | string;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'heavy';
    goal: 'maintain' | 'lose-slow' | 'lose-normal' | 'lose-fast';
    lowFatCholesterolDiet: boolean;
    gastricFriendlyDiet: boolean;
  }>({
    gender: profile.gender,
    age: profile.age,
    height: profile.height,
    weight: profile.weight,
    activityLevel: profile.activityLevel,
    goal: profile.goal,
    lowFatCholesterolDiet: profile.lowFatCholesterolDiet || false,
    gastricFriendlyDiet: profile.gastricFriendlyDiet || false
  });

  useEffect(() => {
    setEditProfile({
      gender: profile.gender,
      age: profile.age,
      height: profile.height,
      weight: profile.weight,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
      lowFatCholesterolDiet: profile.lowFatCholesterolDiet || false,
      gastricFriendlyDiet: profile.gastricFriendlyDiet || false
    });
  }, [profile]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedProfile = {
      gender: editProfile.gender,
      age: Number(editProfile.age) || 0,
      height: Number(editProfile.height) || 0,
      weight: Number(editProfile.weight) || 0,
      activityLevel: editProfile.activityLevel,
      goal: editProfile.goal,
      lowFatCholesterolDiet: editProfile.lowFatCholesterolDiet,
      gastricFriendlyDiet: editProfile.gastricFriendlyDiet
    };
    const targets = calculateTargets(parsedProfile);
    setProfile({ ...parsedProfile, ...targets });
    alert('个人档案及健康膳食设置已更新！');
    setActiveTab('dashboard');
  };

  const [newFood, setNewFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    category: 'protein' as FoodItem['category'],
    isFatLossFriendly: true,
    sourceType: 'both' as FoodItem['sourceType']
  });

  const handleAddCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFood.name || !newFood.calories) {
      alert('请输入食物名称和卡路里值！');
      return;
    }
    const item: FoodItem = {
      id: 'custom_' + Math.random().toString(36).substr(2, 9),
      name: newFood.name,
      calories: parseInt(newFood.calories),
      protein: parseFloat(newFood.protein) || 0,
      carbs: parseFloat(newFood.carbs) || 0,
      fat: parseFloat(newFood.fat) || 0,
      unit: 'g',
      isFatLossFriendly: newFood.isFatLossFriendly,
      category: newFood.category,
      servingSize: 100,
      sourceType: newFood.sourceType
    };
    setFoodList(prev => [item, ...prev]);
    alert(`成功添加自定义食物：${item.name}！`);
    setNewFood({ name: '', calories: '', protein: '', carbs: '', fat: '', category: 'protein', isFatLossFriendly: true, sourceType: 'both' });
  };

  return (
    <div className="app-shell">
      {/* 头部 Topbar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--panel-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FDFBF7',
        backdropFilter: 'blur(10px)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(140, 90, 53, 0.2)'
          }}>
            <img src="/pwa-192x192.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px' }} className="gradient-title">
            今天吃什么
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <Calendar size={13} />
          <span>今日</span>
        </div>
      </div>

      {/* 主体页面内容 */}
      <div className="app-content">
        
        {/* TAB 1: 仪表盘 DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 顶端健康防线指示器 */}
            {(profile.lowFatCholesterolDiet || profile.gastricFriendlyDiet) && (
              <div style={{
                display: 'flex',
                gap: '8px',
                rowGap: '6px',
                flexWrap: 'wrap',
                background: 'var(--panel-bg)',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--panel-border)',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} color="var(--neon-cyan)" /> 已开启健康防线：
                </span>
                {profile.lowFatCholesterolDiet && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(124, 169, 130, 0.15)',
                    color: 'var(--neon-cyan)',
                    border: '1px solid rgba(124, 169, 130, 0.3)',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    🛡️ 低脂低胆固醇
                  </span>
                )}
                {profile.gastricFriendlyDiet && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(136, 178, 204, 0.15)',
                    color: 'var(--neon-green)',
                    border: '1px solid rgba(136, 178, 204, 0.3)',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    🧘 肠胃友好
                  </span>
                )}
              </div>
            )}

            <div className="glass-card glow-cyan" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '120px',
                height: '120px',
                background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    今日剩余赤字额度
                  </h3>
                  <h2 style={{ fontSize: '32px', fontWeight: '800', marginTop: '4px', fontFamily: 'monospace' }}>
                    {Math.max(0, profile.calorieBudget - totalCalories)} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>kcal</span>
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '4px 8px', 
                    borderRadius: '20px', 
                    background: 'rgba(0, 255, 136, 0.1)', 
                    color: 'var(--neon-green)',
                    border: '1px solid rgba(0, 255, 136, 0.2)'
                  }}>
                    {profile.goal === 'lose-normal' ? '稳健减脂' : profile.goal === 'lose-fast' ? '快速切脂' : profile.goal === 'lose-slow' ? '慢速减脂' : '维持体重'}
                  </span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{
                  width: `${caloriePercentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--neon-cyan) 0%, var(--neon-green) 100%)',
                  boxShadow: '0 0 10px var(--neon-cyan-glow)',
                  borderRadius: '5px',
                  transition: 'width 0.5s ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>已摄入: {totalCalories} kcal</span>
                <span>目标上限: {profile.calorieBudget} kcal ({caloriePercentage}%)</span>
              </div>
            </div>

            {/* 今日饮食安全警报 */}
            {loggedAlerts.length > 0 && (
              <div className="glass-card glow-orange" style={{ background: 'rgba(230, 138, 92, 0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-orange)' }}>
                  <ShieldAlert size={18} />
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>今日饮食安全警报 ({loggedAlerts.length})</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {loggedAlerts.map((alert, idx) => (
                    <div key={idx} style={{
                      padding: '8px 12px',
                      background: alert.score === 1 ? 'rgba(217, 83, 79, 0.08)' : 'rgba(230, 138, 92, 0.05)',
                      borderLeft: `4px solid ${alert.score === 1 ? 'var(--neon-purple)' : 'var(--neon-orange)'}`,
                      borderRadius: '8px',
                      fontSize: '11px',
                      lineHeight: '1.4'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', flexWrap: 'wrap', gap: '4px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{alert.foodName}</strong>
                        <span style={{
                          color: alert.score === 1 ? 'var(--neon-purple)' : 'var(--neon-orange)',
                          fontWeight: 'bold',
                          fontSize: '10px'
                        }}>
                          {alert.score === 1 ? '🛑 绝对禁忌' : '❌ 条件禁用'} ({alert.type === 'low-fat' ? '低脂低胆' : '肠胃友好'})
                        </span>
                      </div>
                      <span style={{ color: 'var(--text-secondary)' }}>{alert.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 三大营养素打卡 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', borderLeft: '3px solid var(--neon-purple)', paddingLeft: '8px' }}>
                三大营养素打卡
              </h4>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>蛋白质 (高蛋白保护肌肉)</span>
                  <span style={{ color: 'var(--neon-green)' }}>{Math.round(totalProtein)}g / {profile.proteinTarget}g</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${proteinPercentage}%`,
                    height: '100%',
                    background: 'var(--neon-green)',
                    boxShadow: '0 0 8px var(--neon-green-glow)',
                    borderRadius: '3px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>碳水化合物 (控卡供能)</span>
                  <span style={{ color: 'var(--neon-cyan)' }}>{Math.round(totalCarbs)}g / {profile.carbTarget}g</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${carbPercentage}%`,
                    height: '100%',
                    background: 'var(--neon-cyan)',
                    boxShadow: '0 0 8px var(--neon-cyan-glow)',
                    borderRadius: '3px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>脂肪 (维持基础内分泌)</span>
                  <span style={{ color: 'var(--neon-orange)' }}>{Math.round(totalFat)}g / {profile.fatTarget}g</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${fatPercentage}%`,
                    height: '100%',
                    background: 'var(--neon-orange)',
                    boxShadow: '0 0 8px var(--neon-orange-glow)',
                    borderRadius: '3px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            </div>

            {/* 快速入口 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div 
                className="glass-card glass-card-interactive glow-purple" 
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center', padding: '15px' }}
                onClick={() => setActiveTab('wheel')}
              >
                <Compass size={24} color="var(--neon-purple)" />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>纠结吃什么</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>转盘抽取减脂餐</span>
                </div>
              </div>

              <div 
                className="glass-card glass-card-interactive glow-green" 
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center', padding: '15px' }}
                onClick={() => { setScanMode('photo'); setScanResult(null); setActiveTab('scan'); }}
              >
                <Camera size={24} color="var(--neon-green)" className="pulse-button" />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>AI 膳食估算</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>拍照/文字识别能量</span>
                </div>
              </div>
            </div>

            {/* 饮食避坑与推荐指南 */}
            {(profile.lowFatCholesterolDiet || profile.gastricFriendlyDiet) && (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div 
                  onClick={() => setGuideExpanded(!guideExpanded)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Heart size={16} color="var(--neon-purple)" />
                    <h4 style={{ fontSize: '14px', fontWeight: '700' }}>💡 饮食避坑与健康指南</h4>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {guideExpanded ? '折叠 ▲' : '展开详情 ▼'}
                  </span>
                </div>

                {guideExpanded && (
                  <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* 子 Tab 切换（只有在双模式同时开启时才显示） */}
                    {profile.lowFatCholesterolDiet && profile.gastricFriendlyDiet && (
                      <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.02)', padding: '4px', borderRadius: '8px' }}>
                        <button
                          onClick={() => setGuideTab('lowFat')}
                          style={{
                            flex: 1, padding: '6px', borderRadius: '6px', border: 'none',
                            background: guideTab === 'lowFat' ? 'var(--panel-bg)' : 'transparent',
                            color: guideTab === 'lowFat' ? 'var(--neon-purple)' : 'var(--text-secondary)',
                            fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', boxShadow: guideTab === 'lowFat' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none'
                          }}
                        >
                          🛡️ 低脂低胆固醇
                        </button>
                        <button
                          onClick={() => setGuideTab('gastric')}
                          style={{
                            flex: 1, padding: '6px', borderRadius: '6px', border: 'none',
                            background: guideTab === 'gastric' ? 'var(--panel-bg)' : 'transparent',
                            color: guideTab === 'gastric' ? 'var(--neon-green)' : 'var(--text-secondary)',
                            fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', boxShadow: guideTab === 'gastric' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none'
                          }}
                        >
                          🧘 肠胃友好
                        </button>
                      </div>
                    )}

                    {/* 指南详情展示 */}
                    {((profile.lowFatCholesterolDiet && !profile.gastricFriendlyDiet) || (profile.lowFatCholesterolDiet && profile.gastricFriendlyDiet && guideTab === 'lowFat')) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '11px', background: 'rgba(217, 83, 79, 0.15)', color: 'var(--neon-purple)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            🛑 绝对禁忌 (Level 1)
                          </span>
                          <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '18px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'disc' }}>
                            <li>西柚 / 葡萄柚及其所有衍生制品（红柚、西柚汁、复合果汁等，影响他汀代谢）</li>
                            <li>工业反式脂肪（代可可脂巧克力、植物黄油、氢化植物油、起酥糕点、曲奇、饼干）</li>
                            <li>高浓度酒精（各类烈酒、白酒、啤酒、红酒及大曲酒重度烹饪）</li>
                          </ul>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', background: 'rgba(230, 138, 92, 0.15)', color: 'var(--neon-orange)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            ❌ 条件禁用 (Level 2)
                          </span>
                          <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '18px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'disc' }}>
                            <li>【任何食材】 × 【油炸 / 煎炸 / 重油爆炒 / 烧烤】</li>
                            <li>【高脂/高胆固醇肉及内脏】（肥肉、五花肉、猪脑、猪肝、鸡鸭皮、蟹黄、鱼子等）</li>
                            <li>【动物骨头/肥肉】 × 【长时间久炖浓白汤 / 骨头汤】</li>
                          </ul>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', background: 'rgba(124, 169, 130, 0.15)', color: 'var(--neon-cyan)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            🟢 优先推荐 (Level 3)
                          </span>
                          <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '18px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'disc' }}>
                            <li>【超低脂海鲜与瘦肉】（去皮鸡胸、鲈鱼、鳕鱼、虾仁、贝柱、里脊） × 【清蒸/水煮/少油炒】</li>
                            <li>【降脂粗粮】（燕麦、大麦、荞麦、山药、南瓜） × 【熬稠粥/蒸熟】</li>
                            <li>【纯植物性蛋白质】（北豆腐/老豆腐） × 【慢火炖/做清汤】</li>
                            <li>【护血管果蔬】（菠菜、菜心、胡萝卜、西葫芦、番茄、蓝莓、草莓、猕猴桃）</li>
                            <li>【单不饱和油】（特级初榨橄榄油、茶油） × 【出锅前少量点缀（单餐总量 &lt; 15克）】</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {((!profile.lowFatCholesterolDiet && profile.gastricFriendlyDiet) || (profile.lowFatCholesterolDiet && profile.gastricFriendlyDiet && guideTab === 'gastric')) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '11px', background: 'rgba(217, 83, 79, 0.15)', color: 'var(--neon-purple)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            🛑 绝对禁忌 (Level 1)
                          </span>
                          <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '18px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'disc' }}>
                            <li>碳酸饮料与高糖高脂饮品（可乐、雪碧、苏打水、起泡酒、高糖奶茶、冰淇淋）</li>
                          </ul>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', background: 'rgba(230, 138, 92, 0.15)', color: 'var(--neon-orange)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            ❌ 条件禁用 (Level 2)
                          </span>
                          <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '18px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'disc' }}>
                            <li>【高发酵蔬菜】（西兰花、花菜、卷心菜、洋葱、大蒜、芦笋） × 【生食/凉拌/夹生炒】</li>
                            <li>【高产气豆类】（黄豆、绿豆、红豆） × 【未彻底烹烂/直接打生豆浆】</li>
                            <li>【高发酵/高糖水果】（苹果、梨、芒果、西瓜） × 【直接生食/冰镇】</li>
                            <li>【高支链淀粉】（糯米制品如粽子/年糕、红薯、芋头） × 【冷却后食用/凉吃/冻食】</li>
                            <li>【高脂或含乳糖食品】（全脂纯牛奶、肥肉、浓肉汤、油炸食品） × 【任何烹饪】（延缓胃排空）</li>
                          </ul>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', background: 'rgba(124, 169, 130, 0.15)', color: 'var(--neon-cyan)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            🟢 优先推荐 (Level 3)
                          </span>
                          <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '18px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'disc' }}>
                            <li>【易消化主食】（大米、小米、细面条、山药、去皮南瓜） × 【高温足水熬粥/软饭/趁热吃】</li>
                            <li>【低发酵温蔬菜】（冬瓜、丝瓜、西葫芦、去皮茄子、熟番茄、去梗嫩菠菜/小白菜） × 【焖烂/炖软】</li>
                            <li>【易消化蛋白质】（鱼肉片、去皮鸡胸肉、虾仁、剁肉糜的里脊丸、老豆腐） × 【清蒸/水煮/烂熟】</li>
                            <li>【低发酵安全水果】（蓝莓、草莓、猕猴桃） × 【常温食用】</li>
                            <li>【胃动力理气配料】（生姜、陈皮、薄荷、大麦、荞麦） × 【泡茶/熟姜丝入菜】</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 饮食明细列表 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', borderLeft: '3px solid var(--neon-cyan)', paddingLeft: '8px' }}>
                  今日已吃饮食明细
                </h4>
                {logs.length > 0 && (
                  <button 
                    onClick={clearAllLogs}
                    style={{ background: 'none', border: 'none', color: 'var(--neon-pink)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    <Trash2 size={12} /> 清空
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  今日暂无打卡，快去大转盘决策或 AI 识图记账吧！
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                  {logs.map(log => {
                    const lowFatCheck = profile.lowFatCholesterolDiet ? checkLowFatSafety(log.foodName) : null;
                    const gastricCheck = profile.gastricFriendlyDiet ? checkGastricSafety(log.foodName) : null;
                    return (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ flex: 1, marginRight: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', rowGap: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600' }}>{log.foodName}</span>
                            <span style={{ fontSize: '10px', color: 'var(--neon-cyan)', padding: '2px 4px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '4px' }}>
                              {log.mealType === 'breakfast' ? '早餐' : log.mealType === 'lunch' ? '午餐' : log.mealType === 'dinner' ? '晚餐' : '加餐'}
                            </span>
                            {profile.lowFatCholesterolDiet && lowFatCheck && (
                              <span 
                                title={lowFatCheck.reason}
                                style={{
                                  fontSize: '9px',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: lowFatCheck.score === 1 ? 'rgba(217, 83, 79, 0.12)' : lowFatCheck.score === 2 ? 'rgba(230, 138, 92, 0.12)' : 'rgba(124, 169, 130, 0.12)',
                                  color: lowFatCheck.score === 1 ? 'var(--neon-purple)' : lowFatCheck.score === 2 ? 'var(--neon-orange)' : 'var(--neon-cyan)',
                                  border: `1px solid ${lowFatCheck.score === 1 ? 'rgba(217, 83, 79, 0.25)' : lowFatCheck.score === 2 ? 'rgba(230, 138, 92, 0.25)' : 'rgba(124, 169, 130, 0.25)'}`,
                                  cursor: 'help',
                                  fontWeight: '600'
                                }}
                              >
                                {lowFatCheck.score === 1 ? '🚨 脂胆绝对禁忌' : lowFatCheck.score === 2 ? '⚠️ 脂胆条件禁用' : '🛡️ 脂胆放行'}
                              </span>
                            )}
                            {profile.gastricFriendlyDiet && gastricCheck && (
                              <span 
                                title={gastricCheck.reason}
                                style={{
                                  fontSize: '9px',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: gastricCheck.score === 1 ? 'rgba(217, 83, 79, 0.12)' : gastricCheck.score === 2 ? 'rgba(230, 138, 92, 0.12)' : 'rgba(124, 169, 130, 0.12)',
                                  color: gastricCheck.score === 1 ? 'var(--neon-purple)' : gastricCheck.score === 2 ? 'var(--neon-orange)' : 'var(--neon-cyan)',
                                  border: `1px solid ${gastricCheck.score === 1 ? 'rgba(217, 83, 79, 0.25)' : gastricCheck.score === 2 ? 'rgba(230, 138, 92, 0.25)' : 'rgba(124, 169, 130, 0.25)'}`,
                                  cursor: 'help',
                                  fontWeight: '600'
                                }}
                              >
                                {gastricCheck.score === 1 ? '🚨 肠胃绝对禁忌' : gastricCheck.score === 2 ? '⚠️ 肠胃条件禁用' : '🧘 肠胃放行'}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                            分量: {log.amount}g/份 | P:{log.protein}g C:{log.carbs}g F:{log.fat}g
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace' }}>{log.calories} kcal</span>
                          <button onClick={() => deleteLog(log.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: 今天吃什么转盘 WHEEL */}
        {activeTab === 'wheel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', width: '100%' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>纠结终结转盘</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                一键摇出适合当前时段的减脂健康餐！
              </p>
            </div>

            {/* 决策模式切换器 */}
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.02)', padding: '4px', borderRadius: '10px', width: '100%' }}>
              <button
                onClick={() => setWheelMode('db')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                  background: wheelMode === 'db' ? 'var(--panel-bg)' : 'transparent',
                  color: wheelMode === 'db' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                  fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                  boxShadow: wheelMode === 'db' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                🍲 系统饮食库推荐
              </button>
              <button
                onClick={() => setWheelMode('custom')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                  background: wheelMode === 'custom' ? 'var(--panel-bg)' : 'transparent',
                  color: wheelMode === 'custom' ? 'var(--neon-green)' : 'var(--text-secondary)',
                  fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                  boxShadow: wheelMode === 'custom' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                ✍️ 纠结选项自拟
              </button>
            </div>

            {wheelMode === 'db' ? (
              <div className="glass-card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>只筛选减脂友好食品</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                    <input 
                      type="checkbox" 
                      checked={wheelFatLossOnly}
                      onChange={(e) => setWheelFatLossOnly(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: wheelFatLossOnly ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)',
                      transition: '0.4s', borderRadius: '24px',
                      boxShadow: wheelFatLossOnly ? '0 0 10px var(--neon-green-glow)' : 'none'
                    }}>
                      <span style={{
                        position: 'absolute', height: '18px', width: '18px', left: '3px', bottom: '3px',
                        backgroundColor: '#0a0b16', transition: '0.4s', borderRadius: '50%',
                        transform: wheelFatLossOnly ? 'translateX(20px)' : 'none'
                      }} />
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--panel-border)', paddingTop: '10px', marginTop: '2px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>只筛选低胆固醇低脂食品</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      自动屏蔽西柚、肥肉、反式脂肪与油炸食品
                    </span>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={wheelLowFatOnly}
                      onChange={(e) => setWheelLowFatOnly(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: wheelLowFatOnly ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)',
                      transition: '0.4s', borderRadius: '24px',
                      boxShadow: wheelLowFatOnly ? '0 0 10px var(--neon-green-glow)' : 'none'
                    }}>
                      <span style={{
                        position: 'absolute', height: '18px', width: '18px', left: '3px', bottom: '3px',
                        backgroundColor: '#0a0b16', transition: '0.4s', borderRadius: '50%',
                        transform: wheelLowFatOnly ? 'translateX(20px)' : 'none'
                      }} />
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--panel-border)', paddingTop: '10px', marginTop: '2px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>只筛选肠胃友好食品</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      屏蔽碳酸饮料、生冷水果与难消化发酵菜
                    </span>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={wheelGastricOnly}
                      onChange={(e) => setWheelGastricOnly(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: wheelGastricOnly ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)',
                      transition: '0.4s', borderRadius: '24px',
                      boxShadow: wheelGastricOnly ? '0 0 10px var(--neon-green-glow)' : 'none'
                    }}>
                      <span style={{
                        position: 'absolute', height: '18px', width: '18px', left: '3px', bottom: '3px',
                        backgroundColor: '#0a0b16', transition: '0.4s', borderRadius: '50%',
                        transform: wheelGastricOnly ? 'translateX(20px)' : 'none'
                      }} />
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setWheelMealType(type)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                        borderColor: wheelMealType === type ? 'var(--neon-cyan)' : 'var(--panel-border)',
                        background: wheelMealType === type ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        color: wheelMealType === type ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                        fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {type === 'breakfast' ? '早餐' : type === 'lunch' ? '午餐' : type === 'dinner' ? '晚餐' : '加餐'}
                    </button>
                  ))}
                </div>

                {/* 制作方式筛选器 */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  {([
                    { key: 'all', label: '🍳 全部来源' },
                    { key: 'self', label: '👨‍🍳 自己做' },
                    { key: 'delivery', label: '🛵 点外卖' }
                  ] as const).map(source => (
                    <button
                      key={source.key}
                      onClick={() => setWheelSourceType(source.key)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                        borderColor: wheelSourceType === source.key ? 'var(--neon-green)' : 'var(--panel-border)',
                        background: wheelSourceType === source.key ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        color: wheelSourceType === source.key ? 'var(--neon-green)' : 'var(--text-secondary)',
                        fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {source.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>✍️ 手动录入决择选项 (2-8个)</span>
                  <button
                    onClick={() => {
                      if (customChoices.length < 8) {
                        setCustomChoices([...customChoices, `选项 ${customChoices.length + 1}`]);
                      } else {
                        alert('最多添加 8 个决择选项！');
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--neon-green)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    + 增加选项
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '2px' }}>
                  {customChoices.map((choice, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '32px', fontFamily: 'monospace' }}>#{idx+1}</span>
                      <input
                        type="text"
                        className="cyber-input"
                        value={choice}
                        onChange={(e) => {
                          const updated = [...customChoices];
                          updated[idx] = e.target.value;
                          setCustomChoices(updated);
                        }}
                        placeholder={`选项 ${idx + 1}`}
                        style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                      />
                      {customChoices.length > 2 && (
                        <button
                          onClick={() => {
                            setCustomChoices(customChoices.filter((_, i) => i !== idx));
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--neon-purple)', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="wheel-container">
              <div className="wheel-pointer"></div>
              <canvas 
                ref={canvasRef} 
                width="280" 
                height="280" 
                className="wheel-canvas"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isSpinning ? 'transform 5s cubic-bezier(0.15, 0.99, 0.18, 1)' : 'none'
                }}
              />
              <div className="wheel-center-button" onClick={spinWheel}>
                {isSpinning ? '...' : '抽取'}
              </div>
            </div>

            <div style={{ width: '100%', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                * 转盘中绿字代表低卡减脂食材，橙字为高油糖对比项
              </span>
            </div>

            {/* 抽中食物弹窗 Modal */}
            {spinModalOpen && spinWinner && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px'
              }}>
                <div className="glass-card glow-purple" style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(217, 83, 79, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <Sparkles color="var(--neon-purple)" size={24} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {spinWinner.id === 'custom_winner' ? '🎉 纠结终结！今日自拟选项结果：' : '🎉 今日决定：建议你吃'}
                    </span>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', marginTop: '5px', color: 'var(--neon-purple)' }}>
                      {spinWinner.name}
                    </h2>
                    {spinCombo.length > 0 && (
                      <div style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>搭配：</span>
                        {spinCombo.map(item => item.name).join(' + ')}
                      </div>
                    )}
                  </div>

                  {/* 中奖选项安全评级警告条 */}
                  {(winnerLowFatCheck || winnerGastricCheck) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {winnerLowFatCheck && winnerLowFatCheck.score !== 3 && (
                        <div style={{
                          padding: '8px 10px',
                          background: winnerLowFatCheck.score === 1 ? 'rgba(217, 83, 79, 0.08)' : 'rgba(230, 138, 92, 0.08)',
                          borderLeft: `4px solid ${winnerLowFatCheck.score === 1 ? 'var(--neon-purple)' : 'var(--neon-orange)'}`,
                          borderRadius: '8px',
                          fontSize: '11px',
                          lineHeight: '1.4',
                          textAlign: 'left',
                          color: 'var(--text-primary)'
                        }}>
                          <strong style={{ color: winnerLowFatCheck.score === 1 ? 'var(--neon-purple)' : 'var(--neon-orange)', display: 'block', marginBottom: '2px' }}>
                            {winnerLowFatCheck.score === 1 ? '🚨 低脂低胆固醇防线绝对拦截！' : '⚠️ 低脂低胆固醇防线注意：条件禁用'}
                          </strong>
                          {winnerLowFatCheck.reason}
                        </div>
                      )}
                      {winnerGastricCheck && winnerGastricCheck.score !== 3 && (
                        <div style={{
                          padding: '8px 10px',
                          background: winnerGastricCheck.score === 1 ? 'rgba(217, 83, 79, 0.08)' : 'rgba(230, 138, 92, 0.08)',
                          borderLeft: `4px solid ${winnerGastricCheck.score === 1 ? 'var(--neon-purple)' : 'var(--neon-orange)'}`,
                          borderRadius: '8px',
                          fontSize: '11px',
                          lineHeight: '1.4',
                          textAlign: 'left',
                          color: 'var(--text-primary)'
                        }}>
                          <strong style={{ color: winnerGastricCheck.score === 1 ? 'var(--neon-purple)' : 'var(--neon-orange)', display: 'block', marginBottom: '2px' }}>
                            {winnerGastricCheck.score === 1 ? '🚨 肠胃友好防线绝对拦截！' : '⚠️ 肠胃友好防线注意：条件禁用'}
                          </strong>
                          {winnerGastricCheck.reason}
                        </div>
                      )}
                    </div>
                  )}

                  {spinWinner.id === 'custom_winner' ? (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'left', fontWeight: 'bold' }}>
                        ✍️ 手动预估选项营养素（可微调）：
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <span>预估能量 (kcal):</span>
                        <input
                          type="number"
                          className="cyber-input"
                          value={spinWinner.calories}
                          onChange={(e) => setSpinWinner({ ...spinWinner, calories: parseInt(e.target.value) || 0 })}
                          style={{ width: '80px', padding: '4px 8px', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '6px', borderRadius: '6px' }}>
                          <div>蛋白质(g)</div>
                          <input
                            type="number"
                            className="cyber-input"
                            value={spinWinner.protein}
                            onChange={(e) => setSpinWinner({ ...spinWinner, protein: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '4px', marginTop: '4px', fontSize: '11px', textAlign: 'center', fontFamily: 'monospace' }}
                          />
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '6px', borderRadius: '6px' }}>
                          <div>碳水(g)</div>
                          <input
                            type="number"
                            className="cyber-input"
                            value={spinWinner.carbs}
                            onChange={(e) => setSpinWinner({ ...spinWinner, carbs: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '4px', marginTop: '4px', fontSize: '11px', textAlign: 'center', fontFamily: 'monospace' }}
                          />
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '6px', borderRadius: '6px' }}>
                          <div>脂肪(g)</div>
                          <input
                            type="number"
                            className="cyber-input"
                            value={spinWinner.fat}
                            onChange={(e) => setSpinWinner({ ...spinWinner, fat: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '4px', marginTop: '4px', fontSize: '11px', textAlign: 'center', fontFamily: 'monospace' }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#FFF', padding: '15px', borderRadius: '12px', border: '1px solid var(--panel-border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span>主菜卡路里:</span>
                        <strong style={{ fontFamily: 'monospace' }}>{spinWinner.calories} kcal / {spinWinner.servingSize}{spinWinner.unit}</strong>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '6px', borderRadius: '6px' }}>
                          <div>蛋白质</div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '2px' }}>{spinWinner.protein}g</div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '6px', borderRadius: '6px' }}>
                          <div>碳水</div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '2px' }}>{spinWinner.carbs}g</div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '6px', borderRadius: '6px' }}>
                          <div>脂肪</div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '2px' }}>{spinWinner.fat}g</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      主菜摄入克数 / 数量 (单位: {spinWinner.unit})
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="number"
                        className="cyber-input"
                        value={customSpinAmount}
                        onChange={(e) => setCustomSpinAmount(parseFloat(e.target.value) || 0)}
                        style={{ fontFamily: 'monospace' }}
                      />
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{spinWinner.unit}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => setSpinModalOpen(false)}
                      style={{ flex: 1, padding: '12px', background: '#FFF', border: '1px solid var(--panel-border)', color: 'var(--text-secondary)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      重新抽取
                    </button>
                    <button 
                      onClick={() => {
                        addMealLog(spinWinner, customSpinAmount, wheelMealType);
                        spinCombo.forEach(item => addMealLog(item, item.servingSize, wheelMealType));
                        setSpinModalOpen(false);
                        setActiveTab('dashboard');
                      }}
                      className="btn-neon btn-neon-purple"
                      style={{ flex: 1, padding: '12px' }}
                    >
                      一键打卡套餐
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI 识别与文字估算 SCAN */}
        {activeTab === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>AI 智能膳食估算</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                支持拍照识图或直接输入文字，AI 科学估算食物能量及营养素
              </p>
            </div>

            {/* 功能模式选择器 */}
            {!scanResult && (
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  onClick={() => {
                    setScanMode('photo');
                    setScanResult(null);
                    setScanError(null);
                  }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid',
                    borderColor: scanMode === 'photo' ? 'var(--neon-cyan)' : 'var(--panel-border)',
                    background: scanMode === 'photo' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    color: scanMode === 'photo' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                    fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  📸 拍照识图
                </button>
                <button
                  onClick={() => {
                    setScanMode('text');
                    setScanResult(null);
                    setScanError(null);
                  }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid',
                    borderColor: scanMode === 'text' ? 'var(--neon-cyan)' : 'var(--panel-border)',
                    background: scanMode === 'text' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    color: scanMode === 'text' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                    fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  ✍️ 文字估算
                </button>
              </div>
            )}

            {/* 1. 拍照选择区 */}
            {scanMode === 'photo' && !scanResult && (
              <div 
                className="glass-card" 
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px',
                  border: '2px dashed var(--panel-border)', borderRadius: '20px', position: 'relative', overflow: 'hidden',
                  background: selectedImage ? 'none' : 'rgba(255,255,255,0.01)'
                }}
              >
                {selectedImage ? (
                  <>
                    <img src={selectedImage} alt="Food preview" style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '16px' }} />
                    {isScanning && <div className="scanner-line"></div>}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={30} color="var(--neon-cyan)" />
                    </div>
                    <div>
                      <label htmlFor="camera-input" style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan)', borderRadius: '8px', color: 'var(--neon-cyan)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                        点击拍照或选图
                      </label>
                      <input type="file" id="camera-input" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>支持拍照或从相册选择</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. 文字输入区 */}
            {scanMode === 'text' && !scanResult && !isScanning && (
              <div className="glass-card glow-cyan" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>✍️ 描述你吃过的食物：</label>
                <textarea
                  className="cyber-input"
                  style={{ minHeight: '120px', resize: 'none', lineHeight: '1.5', fontSize: '14px', fontFamily: 'inherit' }}
                  placeholder="例如：中午吃了一盘番茄炒蛋，半碗糙米饭，大约100克卤牛肉，喝了一小杯无糖酸奶。"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={runRealScan} className="btn-neon btn-neon-green pulse-button" style={{ padding: '12px' }}>
                    <Sparkles size={16} /> AI 估算卡路里
                  </button>
                  <button
                    onClick={simulateScan}
                    style={{ padding: '8px', background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    本地模拟估算 (无需 API Key)
                  </button>
                </div>
              </div>
            )}

            {selectedImage && !isScanning && !scanResult && scanMode === 'photo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { setSelectedImage(null); setScanResult(null); }}
                    style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color: 'var(--text-secondary)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    重新选图
                  </button>
                  <button onClick={runRealScan} className="btn-neon btn-neon-green pulse-button" style={{ flex: 1, padding: '12px' }}>
                    <Sparkles size={16} /> AI 智能识别
                  </button>
                </div>
                <button
                  onClick={simulateScan}
                  style={{ padding: '8px', background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}
                >
                  本地模拟识别 (无需 API Key)
                </button>
              </div>
            )}

            {isScanning && (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px' }}>
                <RotateCw size={30} color="var(--neon-green)" className="pulse-button" style={{ animation: 'spin 2s linear infinite' }} />
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold' }}>AI 正在智能估算食物能量...</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    分析食材构成、分量配比及三大营养素卡路里
                  </p>
                </div>
              </div>
            )}

            {scanError && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'rgba(255, 94, 0, 0.1)', border: '1px solid rgba(255, 94, 0, 0.2)', borderRadius: '10px', color: 'var(--neon-orange)', fontSize: '12px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{scanError}</span>
              </div>
            )}

            {/* AI 识别结果 (图片及文字识别均使用相同的编辑打卡面板) */}
            {scanResult && (
              <div className="glass-card glow-green" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {scanResult.isMock && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 189, 0, 0.1)',
                    border: '1px solid rgba(255, 189, 0, 0.2)',
                    borderRadius: '8px',
                    color: 'var(--neon-orange)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    📢 当前显示为【演示模拟数据】。请在「配置」中填入 API Key 激活真实 AI。
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--neon-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={12} /> AI 估算完成 (可编辑微调)
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>置信度: {Math.round(scanResult.confidence * 100)}%</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>识别食物名称</label>
                      <input 
                        type="text" className="cyber-input" value={scanResult.foodName} 
                        onChange={(e) => setScanResult({ ...scanResult, foodName: e.target.value })}
                        style={{ padding: '8px 12px', marginTop: '3px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>估算克数/分量 (g)</label>
                        <input 
                          type="number" className="cyber-input" value={scanResult.estimatedWeight} 
                          onChange={(e) => setScanResult({ ...scanResult, estimatedWeight: parseInt(e.target.value) || 0 })}
                          style={{ padding: '8px 12px', marginTop: '3px', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>估算热量 (kcal)</label>
                        <input 
                          type="number" className="cyber-input" value={scanResult.calories} 
                          onChange={(e) => setScanResult({ ...scanResult, calories: parseInt(e.target.value) || 0 })}
                          style={{ padding: '8px 12px', marginTop: '3px', fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '11px' }}>
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }}>蛋白质 (g)</label>
                        <input 
                          type="number" className="cyber-input" value={scanResult.protein} 
                          onChange={(e) => setScanResult({ ...scanResult, protein: parseFloat(e.target.value) || 0 })}
                          style={{ padding: '6px', marginTop: '3px', textAlign: 'center', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }}>碳水 (g)</label>
                        <input 
                          type="number" className="cyber-input" value={scanResult.carbs} 
                          onChange={(e) => setScanResult({ ...scanResult, carbs: parseFloat(e.target.value) || 0 })}
                          style={{ padding: '6px', marginTop: '3px', textAlign: 'center', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }}>脂肪 (g)</label>
                        <input 
                          type="number" className="cyber-input" value={scanResult.fat} 
                          onChange={(e) => setScanResult({ ...scanResult, fat: parseFloat(e.target.value) || 0 })}
                          style={{ padding: '6px', marginTop: '3px', textAlign: 'center', fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 扫描结果安全评估条 */}
                {(scanLowFatCheck || scanGastricCheck) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                    {scanLowFatCheck && scanLowFatCheck.score !== 3 && (
                      <div style={{
                        padding: '10px 12px',
                        background: scanLowFatCheck.score === 1 ? 'rgba(217, 83, 79, 0.08)' : 'rgba(230, 138, 92, 0.08)',
                        borderLeft: `4px solid ${scanLowFatCheck.score === 1 ? 'var(--neon-purple)' : 'var(--neon-orange)'}`,
                        borderRadius: '8px',
                        fontSize: '11px',
                        lineHeight: '1.4',
                        color: 'var(--text-primary)'
                      }}>
                        <strong style={{ color: scanLowFatCheck.score === 1 ? 'var(--neon-purple)' : 'var(--neon-orange)', display: 'block', marginBottom: '2px' }}>
                          {scanLowFatCheck.score === 1 ? '🚨 低脂低胆固醇防线拦截：绝对禁忌' : '⚠️ 低脂低胆固醇防线注意：条件禁用'}
                        </strong>
                        {scanLowFatCheck.reason}
                      </div>
                    )}
                    {scanGastricCheck && scanGastricCheck.score !== 3 && (
                      <div style={{
                        padding: '10px 12px',
                        background: scanGastricCheck.score === 1 ? 'rgba(217, 83, 79, 0.08)' : 'rgba(230, 138, 92, 0.08)',
                        borderLeft: `4px solid ${scanGastricCheck.score === 1 ? 'var(--neon-purple)' : 'var(--neon-orange)'}`,
                        borderRadius: '8px',
                        fontSize: '11px',
                        lineHeight: '1.4',
                        color: 'var(--text-primary)'
                      }}>
                        <strong style={{ color: scanGastricCheck.score === 1 ? 'var(--neon-purple)' : 'var(--neon-orange)', display: 'block', marginBottom: '2px' }}>
                          {scanGastricCheck.score === 1 ? '🚨 肠胃友好防线拦截：绝对禁忌' : '⚠️ 肠胃友好防线注意：条件禁用'}
                        </strong>
                        {scanGastricCheck.reason}
                      </div>
                    )}
                    {((scanLowFatCheck && scanLowFatCheck.score === 3) || (scanGastricCheck && scanGastricCheck.score === 3)) && 
                     !(scanLowFatCheck && scanLowFatCheck.score !== 3) && !(scanGastricCheck && scanGastricCheck.score !== 3) && (
                      <div style={{
                        padding: '8px 12px',
                        background: 'rgba(124, 169, 130, 0.08)',
                        borderLeft: '4px solid var(--neon-cyan)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        lineHeight: '1.4',
                        color: 'var(--text-primary)'
                      }}>
                        <strong style={{ color: 'var(--neon-cyan)', display: 'block', marginBottom: '2px' }}>
                          🟢 健康防线评估：推荐安全食用
                        </strong>
                        {scanLowFatCheck && scanLowFatCheck.score === 3 && scanLowFatCheck.reason !== '该食物对于低脂低胆固醇饮食属于普通级别，请确保烹饪时严格控油、避免肥肉。' 
                          ? scanLowFatCheck.reason 
                          : (scanGastricCheck && scanGastricCheck.score === 3 && scanGastricCheck.reason !== '该食物对于肠胃健康属于普通级别，请确保趁热吃、细嚼慢咽，烹饪软烂。'
                            ? scanGastricCheck.reason 
                            : '符合健康饮食原则，推荐控油少油烹饪、趁热软烂食用。')}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong>分析说明：</strong> {scanResult.reasoning}
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>记录餐次</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
                      <button
                        key={type} onClick={() => setScanMealType(type)}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                          borderColor: scanMealType === type ? 'var(--neon-green)' : 'var(--panel-border)',
                          background: scanMealType === type ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                          color: scanMealType === type ? 'var(--neon-green)' : 'var(--text-secondary)',
                          fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                      >
                        {type === 'breakfast' ? '早餐' : type === 'lunch' ? '午餐' : type === 'dinner' ? '晚餐' : '加餐'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { setSelectedImage(null); setTextInput(''); setScanResult(null); }}
                    style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color: 'var(--text-secondary)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    取消重置
                  </button>
                  <button 
                    onClick={() => {
                      addMealLog({
                        name: scanResult.foodName,
                        calories: scanResult.calories,
                        protein: scanResult.protein,
                        carbs: scanResult.carbs,
                        fat: scanResult.fat,
                        servingSize: scanResult.estimatedWeight,
                        unit: 'g'
                      }, scanResult.estimatedWeight, scanMealType);
                      setSelectedImage(null);
                      setTextInput('');
                      setScanResult(null);
                      setActiveTab('dashboard');
                      alert('AI 估算记录已成功记账打卡！');
                    }}
                    className="btn-neon btn-neon-green"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    确认记账
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: 历史记录 LOGS */}
        {activeTab === 'logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>今日摄入明细</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                今日已摄入卡路里及各类营养素详情汇总
              </p>
            </div>

            <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ textAlign: 'center', borderRight: '1px solid var(--panel-border)', paddingRight: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>今日已摄入热量</span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '5px', fontFamily: 'monospace' }}>
                  {totalCalories} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>kcal</span>
                </h3>
              </div>
              <div style={{ textAlign: 'center', paddingLeft: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>今日消耗赤字</span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '5px', color: 'var(--neon-green)', fontFamily: 'monospace' }}>
                  {Math.max(0, profile.calorieBudget - totalCalories)} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>kcal</span>
                </h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((meal, index) => {
                const mealLogs = logs.filter(l => l.mealType === meal);
                const mealCals = mealLogs.reduce((sum, l) => sum + l.calories, 0);
                
                return (
                  <div key={meal} style={{ borderBottom: index === 3 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: index === 3 ? '0' : '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: meal === 'breakfast' ? 'var(--neon-cyan)' : meal === 'lunch' ? 'var(--neon-green)' : meal === 'dinner' ? 'var(--neon-purple)' : 'var(--neon-orange)'
                        }} />
                        <strong style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                          {meal === 'breakfast' ? '早餐' : meal === 'lunch' ? '午餐' : meal === 'dinner' ? '晚餐' : '加餐/零食'}
                        </strong>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace' }}>{mealCals} kcal</span>
                    </div>

                    {mealLogs.length === 0 ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>暂无记录</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {mealLogs.map(log => (
                          <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingLeft: '14px', color: 'var(--text-secondary)' }}>
                            <span>{log.foodName} ({log.amount}g)</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <span>{log.calories} kcal</span>
                              <button onClick={() => deleteLog(log.id)} style={{ background: 'none', border: 'none', color: 'var(--neon-pink)', cursor: 'pointer' }}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4.5: 冰箱 FRIDGE */}
        {activeTab === 'fridge' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>我的小冰箱</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                把你有的食材放进来，不知道吃什么时让 AI 帮你变魔术
              </p>
            </div>
            
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="cyber-input" 
                  placeholder="输入食材，例如：半块豆腐"
                  value={newFridgeItem}
                  onChange={(e) => setNewFridgeItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFridgeItem.trim()) {
                      setFridgeItems([...fridgeItems, newFridgeItem.trim()]);
                      setNewFridgeItem('');
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button 
                  className="btn-neon btn-neon-green"
                  style={{ padding: '0 15px' }}
                  onClick={() => {
                    if (newFridgeItem.trim()) {
                      setFridgeItems([...fridgeItems, newFridgeItem.trim()]);
                      setNewFridgeItem('');
                    }
                  }}
                >
                  放入
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {fridgeItems.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', 
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', 
                    padding: '6px 12px', borderRadius: '20px', fontSize: '13px' 
                  }}>
                    <span>{item}</span>
                    <button 
                      onClick={() => setFridgeItems(fridgeItems.filter((_, i) => i !== index))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0' }}
                    >✕</button>
                  </div>
                ))}
                {fridgeItems.length === 0 && (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>冰箱空空如也，快去采购吧！</span>
                )}
              </div>

              {/* 菜品数量选择 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', padding: '12px 0 0 0', borderTop: '1px dashed var(--panel-border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>想做几个菜？</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setFridgeRecipeCount(num)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        border: '1px solid',
                        borderColor: fridgeRecipeCount === num ? 'var(--neon-purple)' : 'var(--panel-border)',
                        background: fridgeRecipeCount === num ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                        color: fridgeRecipeCount === num ? 'var(--neon-purple)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: fridgeRecipeCount === num ? 'bold' : 'normal',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {num} 个菜
                    </button>
                  ))}
                </div>
              </div>

              <button 
                className="btn-neon btn-neon-purple"
                style={{ width: '100%', padding: '14px', marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onClick={() => {
                  setScanMode('text');
                  setTextInput(`看看我的冰箱里有这些食材：${fridgeItems.join('、')}。请帮我用这些食材推荐 ${fridgeRecipeCount} 道不同的菜（不要太复杂，分条列出），并估算每道菜的大致卡路里和三大营养素。`);
                  setActiveTab('scan');
                }}
                disabled={fridgeItems.length === 0}
              >
                <Sparkles size={18} /> 用冰箱里的菜变魔术！
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: 设置 SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>系统配置与减脂设置</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                个性化定制你的卡路里限制及密钥配置
              </p>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', borderLeft: '3px solid var(--neon-cyan)', paddingLeft: '8px' }}>
                个人身体指标 (科学估算 TDEE)
              </h4>
              
              <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>性别</label>
                    <div className="select-wrapper" style={{ marginTop: '4px' }}>
                      <select 
                        className="cyber-select"
                        value={editProfile.gender}
                        onChange={(e) => setEditProfile({ ...editProfile, gender: e.target.value as 'male' | 'female' })}
                      >
                        <option value="male">男生 (Male)</option>
                        <option value="female">女生 (Female)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>年龄 (岁)</label>
                    <input 
                      type="number" className="cyber-input" style={{ marginTop: '4px' }}
                      value={editProfile.age}
                      onChange={(e) => setEditProfile({ ...editProfile, age: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>身高 (cm)</label>
                    <input 
                      type="number" className="cyber-input" style={{ marginTop: '4px' }}
                      value={editProfile.height}
                      onChange={(e) => setEditProfile({ ...editProfile, height: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>体重 (kg)</label>
                    <input 
                      type="number" step="0.1" className="cyber-input" style={{ marginTop: '4px' }}
                      value={editProfile.weight}
                      onChange={(e) => setEditProfile({ ...editProfile, weight: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>日常运动频率</label>
                  <div className="select-wrapper" style={{ marginTop: '4px' }}>
                    <select 
                      className="cyber-select"
                      value={editProfile.activityLevel}
                      onChange={(e) => setEditProfile({ ...editProfile, activityLevel: e.target.value as any })}
                    >
                      <option value="sedentary">久坐族（极少或无运动）</option>
                      <option value="light">轻度活跃（每周慢跑/运动 1-3 天）</option>
                      <option value="moderate">中度活跃（每周健身/运动 3-5 天）</option>
                      <option value="heavy">重度活跃（每天高强度健身/体力劳动）</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>减脂目标速度</label>
                  <div className="select-wrapper" style={{ marginTop: '4px' }}>
                    <select 
                      className="cyber-select"
                      value={editProfile.goal}
                      onChange={(e) => setEditProfile({ ...editProfile, goal: e.target.value as any })}
                    >
                      <option value="maintain">维持现有体重（不设置赤字）</option>
                      <option value="lose-slow">缓和减脂（每日赤字 300大卡）</option>
                      <option value="lose-normal">健康科学减脂（每日赤字 500大卡，推荐）</option>
                      <option value="lose-fast">高强度减脂（每日赤字 750大卡，慎选）</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>辅助饮食健康设置</label>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>🛡️ 低脂低胆固醇饮食</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.3' }}>适合高胆固醇、服用他汀药物人群，防脂肪/西柚</span>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={editProfile.lowFatCholesterolDiet}
                        onChange={(e) => setEditProfile({ ...editProfile, lowFatCholesterolDiet: e.target.checked })}
                        style={{ opacity: 0, width: 0, height: 0 }} 
                      />
                      <span style={{
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: editProfile.lowFatCholesterolDiet ? 'var(--neon-green)' : 'rgba(0,0,0,0.1)',
                        transition: '0.4s', borderRadius: '24px',
                        boxShadow: editProfile.lowFatCholesterolDiet ? '0 0 8px var(--neon-green-glow)' : 'none'
                      }}>
                        <span style={{
                          position: 'absolute', height: '18px', width: '18px', left: '3px', bottom: '3px',
                          backgroundColor: '#FFF', transition: '0.4s', borderRadius: '50%',
                          transform: editProfile.lowFatCholesterolDiet ? 'translateX(20px)' : 'none'
                        }} />
                      </span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--panel-border)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>🧘 肠胃友好饮食</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.3' }}>适合胃胀气、胃动力不足，屏蔽产气与生冷食物</span>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={editProfile.gastricFriendlyDiet}
                        onChange={(e) => setEditProfile({ ...editProfile, gastricFriendlyDiet: e.target.checked })}
                        style={{ opacity: 0, width: 0, height: 0 }} 
                      />
                      <span style={{
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: editProfile.gastricFriendlyDiet ? 'var(--neon-green)' : 'rgba(0,0,0,0.1)',
                        transition: '0.4s', borderRadius: '24px',
                        boxShadow: editProfile.gastricFriendlyDiet ? '0 0 8px var(--neon-green-glow)' : 'none'
                      }}>
                        <span style={{
                          position: 'absolute', height: '18px', width: '18px', left: '3px', bottom: '3px',
                          backgroundColor: '#FFF', transition: '0.4s', borderRadius: '50%',
                          transform: editProfile.gastricFriendlyDiet ? 'translateX(20px)' : 'none'
                        }} />
                      </span>
                    </label>
                  </div>
                </div>

                <button type="submit" className="btn-neon btn-neon-green" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                  保存指标并自动计算控卡配额
                </button>
              </form>
            </div>

            {/* API 密钥设置 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', borderLeft: '3px solid var(--neon-purple)', paddingLeft: '8px' }}>
                AI 识图模型 API 配置
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                支持调用 Gemini 接口或阿里云百炼（DashScope 通义千问）接口进行实物拍照识别。数据完全保存在你手机本地。
              </p>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>接口服务类型</label>
                <div className="select-wrapper">
                  <select 
                    className="cyber-select"
                    value={apiType}
                    onChange={(e) => setApiType(e.target.value as 'gemini' | 'bailian')}
                  >
                    <option value="gemini">Google Gemini API (国外首选)</option>
                    <option value="bailian">阿里云百炼 API (国内推荐)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>API Key (密钥)</label>
                <input 
                  type="password" className="cyber-input" placeholder={apiType === 'gemini' ? 'Gemini Key (AI_zaSy...)' : '百炼 API Key (sk-...)'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              {apiType === 'bailian' && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>API 接口地址 (Base URL)</label>
                    <input 
                      type="text" className="cyber-input" placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>读图模型名称 (Model Name)</label>
                    <div className="select-wrapper">
                      <select className="cyber-select" value={modelName} onChange={(e) => setModelName(e.target.value)}>
                        <option value="qwen3.6-plus">qwen3.6-plus (阿里最新旗舰视觉多模态)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                {apiKey ? (
                  <span style={{ fontSize: '11px', color: 'var(--neon-green)', display: 'block' }}>
                    ✓ 密钥已配置。已激活真实 {apiType === 'gemini' ? 'Gemini' : '阿里云百炼'} 读图服务。
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                    * 留空将默认启动【本地模拟识图模式】进行演示测试。
                  </span>
                )}
              </div>
            </div>

            {/* 自定义食物添加 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', borderLeft: '3px solid var(--neon-orange)', paddingLeft: '8px' }}>
                添加自定义菜品/食材
              </h4>
              <form onSubmit={handleAddCustomFood} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>菜品名称</label>
                  <input type="text" className="cyber-input" placeholder="如: 清炖牛肉面" value={newFood.name} onChange={(e) => setNewFood({ ...newFood, name: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>卡路里 (kcal/100g)</label>
                    <input type="number" className="cyber-input" placeholder="如: 120" value={newFood.calories} onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>是否适合减脂</label>
                    <div className="select-wrapper" style={{ marginTop: '4px' }}>
                      <select className="cyber-select" value={newFood.isFatLossFriendly ? 'yes' : 'no'} onChange={(e) => setNewFood({ ...newFood, isFatLossFriendly: e.target.value === 'yes' })}>
                        <option value="yes">减脂推荐 (低卡/高蛋白)</option>
                        <option value="no">非减脂推荐 (高热量对比)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>制作/获取来源</label>
                  <div className="select-wrapper" style={{ marginTop: '4px' }}>
                    <select className="cyber-select" value={newFood.sourceType} onChange={(e) => setNewFood({ ...newFood, sourceType: e.target.value as any })}>
                      <option value="both">两者皆可 (Both)</option>
                      <option value="self">自己做 (Homemade)</option>
                      <option value="delivery">点外卖 (Delivery)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '11px' }}>
                  <div>
                    <label style={{ color: 'var(--text-secondary)' }}>蛋白质(g/100g)</label>
                    <input type="number" step="0.1" className="cyber-input" placeholder="0" value={newFood.protein} onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-secondary)' }}>碳水(g/100g)</label>
                    <input type="number" step="0.1" className="cyber-input" placeholder="0" value={newFood.carbs} onChange={(e) => setNewFood({ ...newFood, carbs: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-secondary)' }}>脂肪(g/100g)</label>
                    <input type="number" step="0.1" className="cyber-input" placeholder="0" value={newFood.fat} onChange={(e) => setNewFood({ ...newFood, fat: e.target.value })} />
                  </div>
                </div>

                <button type="submit" className="btn-neon btn-neon-orange" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                  添加至专属食物池
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 底部 Tab 导航栏 */}
      <div className="nav-bar">
        <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <Flame size={20} /> <span>控制台</span>
        </button>
        <button className={`nav-item ${activeTab === 'wheel' ? 'active' : ''}`} onClick={() => setActiveTab('wheel')}>
          <Compass size={20} /> <span>抽选</span>
        </button>
        <button className={`nav-item ${activeTab === 'fridge' ? 'active' : ''}`} onClick={() => setActiveTab('fridge')}>
          <Refrigerator size={20} /> <span>冰箱</span>
        </button>
        <button className={`nav-item ${activeTab === 'scan' ? 'active' : ''}`} onClick={() => setActiveTab('scan')}>
          <Camera size={20} /> <span>AI估算</span>
        </button>
        <button className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <History size={20} /> <span>饮食明细</span>
        </button>
        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <SettingsIcon size={20} /> <span>配置</span>
        </button>
      </div>
    </div>
  );
}

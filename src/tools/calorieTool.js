const { DynamicTool } = require('@langchain/core/tools');

class CalorieTool {
  constructor() {
    // Common food calorie database (per 100g)
    this.foodDatabase = {
      // 水果類
      '蘋果': 52,
      '香蕉': 89,
      '橘子': 47,
      '葡萄': 62,
      '草莓': 32,
      '奇異果': 61,
      '芒果': 60,
      '鳳梨': 50,
      '西瓜': 30,
      '哈密瓜': 34,
      '櫻桃': 63,
      '桃子': 39,
      '梨子': 57,
      '柳橙': 47,
      
      // 蔬菜類
      '白菜': 13,
      '高麗菜': 25,
      '菠菜': 23,
      '花椰菜': 25,
      '紅蘿蔔': 41,
      '番茄': 18,
      '小黃瓜': 16,
      '萵苣': 15,
      '洋蔥': 40,
      '馬鈴薯': 77,
      '地瓜': 86,
      '玉米': 86,
      
      // 肉類
      '雞胸肉': 165,
      '雞腿肉': 209,
      '豬肉': 242,
      '牛肉': 250,
      '魚肉': 206,
      '蝦子': 99,
      '蛋': 155,
      
      // 主食類
      '白米飯': 130,
      '糙米飯': 111,
      '麵條': 131,
      '麵包': 265,
      '吐司': 264,
      
      // 堅果類
      '花生': 567,
      '杏仁': 579,
      '核桃': 654,
      '腰果': 553,
      
      // 飲品類
      '牛奶': 42,
      '豆漿': 33,
      '可樂': 42,
      '果汁': 45,
      
      // 零食類
      '巧克力': 546,
      '餅乾': 502,
      '洋芋片': 536,
      '冰淇淋': 207
    };

    // Common portion sizes in grams
    this.portionSizes = {
      '蘋果': 182, // 1顆中等大小
      '香蕉': 118, // 1根
      '橘子': 154, // 1顆
      '雞蛋': 50,  // 1顆
      '白米飯': 150, // 1碗
      '麵包': 28,   // 1片
      '牛奶': 240   // 1杯
    };
  }

  // Create LangChain tool
  createTool() {
    return new DynamicTool({
      name: "calorie_calculator",
      description: "計算食物的卡路里含量。可以輸入食物名稱和份量，例如：'1顆蘋果'、'100g雞胸肉'、'1碗白米飯'",
      func: async (input) => {
        try {
          return await this.calculateCalories(input);
        } catch (error) {
          console.error('Calorie tool error:', error);
          return `抱歉，無法計算卡路里：${error.message}`;
        }
      }
    });
  }

  // Calculate calories for food input
  async calculateCalories(input) {
    try {
      const parsedInput = this.parseInput(input);
      
      if (!parsedInput) {
        return this.getUsageHelp();
      }

      const { food, amount, unit } = parsedInput;
      
      // Find food in database
      const foodItem = this.findFood(food);
      if (!foodItem) {
        return this.suggestSimilarFoods(food);
      }

      // Calculate calories
      const calories = this.calculateFoodCalories(foodItem.name, amount, unit);
      
      return this.formatCalorieResponse(foodItem.name, amount, unit, calories, foodItem.caloriesPer100g);
      
    } catch (error) {
      throw new Error(error.message || '卡路里計算失敗');
    }
  }

  // Parse user input to extract food, amount, and unit
  parseInput(input) {
    // Remove common characters
    const cleaned = input.replace(/[，。！？]/g, '').trim();
    
    // Pattern matching for different input formats
    const patterns = [
      // "1顆蘋果", "2根香蕉"
      /(\d+(?:\.\d+)?)\s*([顆個根片碗杯條塊份])\s*(.+)/,
      // "100g雞胸肉", "50克花生"
      /(\d+(?:\.\d+)?)\s*([gG克公克])\s*(.+)/,
      // "蘋果1顆"
      /(.+?)\s*(\d+(?:\.\d+)?)\s*([顆個根片碗杯條塊份])/,
      // "雞胸肉100g"
      /(.+?)\s*(\d+(?:\.\d+)?)\s*([gG克公克])/,
      // Just food name "蘋果"
      /^(.+)$/
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        if (pattern.source.includes('(.+)$')) {
          // Just food name, use default portion
          return {
            food: match[1],
            amount: 1,
            unit: 'default'
          };
        } else if (match[3]) {
          // Amount + unit + food or food + amount + unit
          return {
            food: match[3] || match[1],
            amount: parseFloat(match[1] || match[2]),
            unit: match[2] || match[3]
          };
        }
      }
    }

    return null;
  }

  // Find food in database
  findFood(foodName) {
    // Exact match
    if (this.foodDatabase[foodName]) {
      return {
        name: foodName,
        caloriesPer100g: this.foodDatabase[foodName]
      };
    }

    // Partial match
    const foods = Object.keys(this.foodDatabase);
    const partialMatch = foods.find(food => 
      food.includes(foodName) || foodName.includes(food)
    );

    if (partialMatch) {
      return {
        name: partialMatch,
        caloriesPer100g: this.foodDatabase[partialMatch]
      };
    }

    return null;
  }

  // Calculate calories based on amount and unit
  calculateFoodCalories(foodName, amount, unit) {
    const caloriesPer100g = this.foodDatabase[foodName];
    
    if (unit === 'default') {
      // Use default portion size if available
      const defaultPortion = this.portionSizes[foodName] || 100;
      return Math.round((caloriesPer100g * defaultPortion * amount) / 100);
    }
    
    if (unit.match(/[gG克公克]/)) {
      // Weight-based calculation
      return Math.round((caloriesPer100g * amount) / 100);
    }
    
    // Unit-based calculation (顆、片、碗等)
    const portionSize = this.portionSizes[foodName] || 100;
    return Math.round((caloriesPer100g * portionSize * amount) / 100);
  }

  // Format calorie response
  formatCalorieResponse(foodName, amount, unit, calories, caloriesPer100g) {
    let portionDescription;
    
    if (unit === 'default') {
      portionDescription = `1份${foodName}`;
    } else if (unit.match(/[gG克公克]/)) {
      portionDescription = `${amount}${unit}${foodName}`;
    } else {
      portionDescription = `${amount}${unit}${foodName}`;
    }

    return `
🍎 卡路里計算結果

📊 食物：${foodName}
⚖️ 份量：${portionDescription}
🔥 卡路里：${calories} 大卡

📋 營養資訊：
• ${foodName}每100g含有 ${caloriesPer100g} 大卡
• 建議每日成人攝取量：1800-2400大卡

💡 小提醒：實際卡路里可能因品種、烹調方式而有所差異
    `.trim();
  }

  // Suggest similar foods
  suggestSimilarFoods(searchFood) {
    const foods = Object.keys(this.foodDatabase);
    const suggestions = foods.filter(food => 
      food.includes(searchFood.charAt(0)) || 
      searchFood.includes(food.charAt(0))
    ).slice(0, 5);

    let response = `❌ 很抱歉，找不到「${searchFood}」的卡路里資訊。\n\n`;
    
    if (suggestions.length > 0) {
      response += `🔍 您是否要查詢：\n${suggestions.map(food => `• ${food}`).join('\n')}\n\n`;
    }
    
    response += `📚 目前支援 ${Object.keys(this.foodDatabase).length} 種食物的卡路里查詢`;
    
    return response;
  }

  // Get usage help
  getUsageHelp() {
    return `
🍎 卡路里計算工具使用說明

✅ 支援的輸入格式：
• "1顆蘋果"
• "100g雞胸肉"  
• "1碗白米飯"
• "50克花生"
• "蘋果" (使用預設份量)

📚 支援的食物類別：
🍎 水果類：蘋果、香蕉、橘子等
🥬 蔬菜類：白菜、菠菜、番茄等  
🍖 肉類：雞胸肉、豬肉、魚肉等
🍚 主食類：白米飯、麵條、麵包等
🥜 堅果類：花生、杏仁、核桃等

請輸入食物名稱和份量來查詢卡路里！
    `.trim();
  }

  // Create BMI calculation tool
  createBMITool() {
    return new DynamicTool({
      name: "bmi_calculator", 
      description: "計算BMI（身體質量指數）。輸入格式：'身高體重'，例如：'170cm 70kg'",
      func: async (input) => {
        try {
          return await this.calculateBMI(input);
        } catch (error) {
          console.error('BMI tool error:', error);
          return `抱歉，無法計算BMI：${error.message}`;
        }
      }
    });
  }

  // Calculate BMI
  async calculateBMI(input) {
    const match = input.match(/(\d+(?:\.\d+)?)\s*(?:cm|公分)?\s*(\d+(?:\.\d+)?)\s*(?:kg|公斤)?/);
    
    if (!match) {
      return `
❌ 輸入格式錯誤

✅ 正確格式：
• "170cm 70kg"
• "165 55"
• "身高170 體重65"

請重新輸入身高和體重！
      `.trim();
    }

    const height = parseFloat(match[1]) / 100; // Convert to meters
    const weight = parseFloat(match[2]);
    
    if (height <= 0 || weight <= 0) {
      return '❌ 身高和體重必須大於0';
    }

    const bmi = weight / (height * height);
    const category = this.getBMICategory(bmi);
    const idealWeight = this.getIdealWeightRange(height);

    return `
📊 BMI 計算結果

👤 身高：${Math.round(height * 100)}cm
⚖️ 體重：${weight}kg
📈 BMI：${bmi.toFixed(1)}

📋 分類：${category.name} ${category.emoji}
💡 ${category.description}

🎯 理想體重範圍：${idealWeight.min}kg - ${idealWeight.max}kg

📚 BMI 分類標準：
• 過輕：< 18.5
• 正常：18.5 - 24.9  
• 過重：25.0 - 29.9
• 肥胖：≥ 30.0
    `.trim();
  }

  // Get BMI category
  getBMICategory(bmi) {
    if (bmi < 18.5) {
      return {
        name: '體重過輕',
        emoji: '📉',
        description: '建議增加營養攝取，適度運動增肌'
      };
    } else if (bmi < 25) {
      return {
        name: '正常範圍',
        emoji: '✅',
        description: '維持良好的生活習慣，繼續保持！'
      };
    } else if (bmi < 30) {
      return {
        name: '體重過重',
        emoji: '⚠️',
        description: '建議控制飲食，增加運動量'
      };
    } else {
      return {
        name: '肥胖',
        emoji: '🚨',
        description: '建議諮詢醫師，制定減重計畫'
      };
    }
  }

  // Get ideal weight range
  getIdealWeightRange(heightInMeters) {
    const heightCm = heightInMeters * 100;
    const minWeight = Math.round(18.5 * heightInMeters * heightInMeters);
    const maxWeight = Math.round(24.9 * heightInMeters * heightInMeters);
    
    return { min: minWeight, max: maxWeight };
  }
}

module.exports = CalorieTool;
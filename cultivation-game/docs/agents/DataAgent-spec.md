# DataAgent 专业规范

## 核心职责
负责灵石升级链数据设计、数值平衡、物品数据结构定义。

## 专业知识

### 数值成长曲线
```javascript
// 指数增长模型：value = base * (ratio ^ level)
const XP_CURVE = {
    base: 10,
    ratio: 3,  // 每级约3倍
    maxLevel: 9
};

function calculateXP(level) {
    return Math.floor(XP_CURVE.base * Math.pow(XP_CURVE.ratio, level - 1));
}
```

### 10级灵石完整数据
```javascript
const STONE_CHAIN = [
    { level: 0, name: '灵气团', icon: '💨', xp: 0, color: '#cccccc', desc: '未凝聚的天地灵气' },
    { level: 1, name: '灵石·下品', icon: '🔮', xp: 10, color: '#9b59b6', desc: '最为常见的灵石，杂质较多' },
    { level: 2, name: '灵石·中品', icon: '💎', xp: 30, color: '#3498db', desc: '经过初步提炼，杂质减少' },
    { level: 3, name: '灵石·上品', icon: '💠', xp: 100, color: '#2ecc71', desc: '较为纯净，修士常用' },
    { level: 4, name: '灵石·极品', icon: '🌟', xp: 300, color: '#f1c40f', desc: '稀有品质，蕴含丰富灵气' },
    { level: 5, name: '玄晶', icon: '🔷', xp: 1000, color: '#e74c3c', desc: '蕴含玄妙之力，可遇不可求' },
    { level: 6, name: '地晶', icon: '🌍', xp: 3000, color: '#8e44ad', desc: '大地精华凝聚，千年成形' },
    { level: 7, name: '天晶', icon: '☀️', xp: 10000, color: '#ff6b6b', desc: '天界流落之物，极为罕见' },
    { level: 8, name: '仙晶·伪', icon: '👑', xp: 30000, color: '#00d2ff', desc: '接近仙界品质，凡间极致' },
    { level: 9, name: '仙晶·真', icon: '✨', xp: 100000, color: '#ffd700', desc: '真正的仙界之物，传说中的存在' }
];
```

### 五行数据
```javascript
const ELEMENTS = {
    gold: { name: '金', icon: '⚔️', color: '#FFD700', sheng: 'water', ke: 'wood' },
    wood: { name: '木', icon: '🌿', color: '#4CAF50', sheng: 'fire', ke: 'earth' },
    water: { name: '水', icon: '💧', color: '#2196F3', sheng: 'wood', ke: 'fire' },
    fire: { name: '火', icon: '🔥', color: '#FF5722', sheng: 'earth', ke: 'gold' },
    earth: { name: '土', icon: '🏔️', color: '#795548', sheng: 'gold', ke: 'water' }
};
```

### 境界数据
```javascript
const REALMS = [
    { id: 0, name: '炼气期', stages: ['前期', '中期', '后期', '大圆满'], baseXP: 100 },
    { id: 1, name: '筑基期', stages: ['前期', '中期', '后期', '大圆满'], baseXP: 200 },
    { id: 2, name: '金丹期', stages: ['前期', '中期', '后期', '大圆满'], baseXP: 400 },
    { id: 3, name: '元婴期', stages: ['前期', '中期', '后期', '大圆满'], baseXP: 800 },
    { id: 4, name: '化神期', stages: ['前期', '中期', '后期', '大圆满'], baseXP: 1600 },
    { id: 5, name: '炼虚期', stages: ['前期', '中期', '后期', '大圆满'], baseXP: 3200 },
    { id: 6, name: '合体期', stages: ['前期', '中期', '后期', '大圆满'], baseXP: 6400 },
    { id: 7, name: '大乘期', stages: ['前期', '中期', '后期', '大圆满'], baseXP: 12800 },
    { id: 8, name: '渡劫期', stages: ['前期', '中期', '后期', '大圆满'], baseXP: 25600 }
];
```

### 数值平衡验证
```javascript
// 验证合成收益是否合理
function validateBalance() {
    // 3个Lv1 = 1个Lv2，理想情况下收益应该合理
    const threeLv1 = STONE_CHAIN[1].xp * 3;  // 30
    const oneLv2 = STONE_CHAIN[2].xp;         // 30
    
    // 考虑合成成本和纯度加成，允许10%误差
    const ratio = oneLv2 / threeLv1;
    console.assert(ratio >= 0.9 && ratio <= 1.1, '数值不平衡');
}
```

## 接口规范
```typescript
interface DataSystem {
    getStone(level: number): StoneData;
    getRealm(realm: number, stage: number): RealmData;
    getElement(type: ElementType): ElementData;
    calculateMergeResult(level: number, isPerfect: boolean): StoneData;
    validateBalance(): boolean;
}
```

## 交付标准
- [ ] 10级灵石数据完整
- [ ] 9境界数据完整
- [ ] 五行数据完整
- [ ] 数值平衡验证通过
- [ ] 数据文档化

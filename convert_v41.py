#!/usr/bin/env python3
import re

# 读取源文件
with open('/root/.openclaw/workspace/cultivation-game/index-v2.1-complete.html', 'r') as f:
    content = f.read()

# 替换规则
replacements = [
    # 标题
    ('修仙合成系统 - V2.1 完整版', '修仙合成系统 - V4.1 完整版'),
    
    # body 背景
    ('background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', 'background: #f8f9fa'),
    
    # 文字颜色
    ('color: #fff;', 'color: #212529;'),
    ('color: white;', 'color: #212529;'),
    
    # 卡片背景
    ('background: rgba(255,255,255,0.05)', 'background: #ffffff'),
    ('background: rgba(255,255,255,0.03)', 'background: #f8f9fa'),
    
    # 边框
    ('border: 1px solid rgba(255,255,255,0.1)', 'border: 1px solid #e9ecef'),
    ('border: 1px solid rgba(255,255,255,0.08)', 'border: 1px solid #dee2e6'),
    ('border: 2px solid rgba(255,255,255,0.1)', 'border: 2px solid #e9ecef'),
    
    # 深色背景
    ('background: rgba(0,0,0,0.2)', 'background: #f1f3f5'),
    ('background: rgba(0,0,0,0.3)', 'background: #e9ecef'),
    
    # 文字颜色
    ('color: #888;', 'color: #868e96;'),
    ('color: #aaa;', 'color: #adb5bd;'),
    ('color: #ccc;', 'color: #ced4da;'),
    
    # 金色强调改为深色
    ('color: #ffd700;', 'color: #212529;'),
]

# 执行替换
for old, new in replacements:
    content = content.replace(old, new)

# 写入目标文件
with open('/root/.openclaw/workspace/cultivation-game/index-v4.1-complete.html', 'w') as f:
    f.write(content)

print('V4.1 版本已生成：/root/.openclaw/workspace/cultivation-game/index-v4.1-complete.html')

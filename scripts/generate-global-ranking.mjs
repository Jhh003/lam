#!/usr/bin/env node

/**
 * 全球排行榜数据聚合脚本
 * 
 * 功能：
 * 1. 从 GitHub Issues 读取带有"已审核"标签的记录（管理员审核通过的记录）
 * 2. 解析 Issue 内容并验证数据
 * 3. 按罪人和人格分组排序
 * 4. 生成 global-ranking.json 文件
 * 5. 为已处理的 Issue 添加"已处理"标签，并移除"已审核"标签
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// GitHub API 配置
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_REPOSITORY?.split('/')[0] || 'jhh003';
const REPO_NAME = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'lam';

// API 端点
const ISSUES_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`;

// 标签名称常量
const LABEL_FLOOR_RECORD = '层数记录';
const LABEL_REVIEWED = '已审核';
const LABEL_PROCESSED = '已处理';

// 罪人名称到ID的映射（与 data/characters.js 中的数据保持一致）
const SINNER_NAME_TO_ID = {
  '李箱 (Yi Sang)': 1,
  '浮士德 (Faust)': 2,
  '堂吉诃德 (Don Quixote)': 3,
  '良秀 (Ryoshu)': 4,
  '默尔索 (Meursault)': 5,
  '鸿璐 (Hong Lu)': 6,
  '希斯克利夫 (Heathcliff)': 7,
  '以实玛利 (Ishmael)': 8,
  '罗佳 (Rodion)': 9,
  '辛克莱 (Sinclair)': 10,
  '格里高尔 (Gregor)': 11,
  '奥提斯 (Outis)': 12
};

/**
 * 从 GitHub Issues 获取已审核的通关记录
 * 只获取带有"已审核"标签的 Issue，确保只处理管理员审核通过的记录
 */
async function fetchIssues() {
  const response = await fetch(`${ISSUES_API}?labels=${encodeURIComponent(LABEL_REVIEWED)}&state=all`, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API 请求失败: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 解析 Issue 内容
 * 支持两种格式：时间记录（submit-clear-run.yml）和层数记录（submit-floor-only.yml）
 */
function parseIssueBody(body, issueLabels) {
  const lines = body.split('\n');
  const record = {};
  
  // 检查是否是仅层数记录（通过标签判断）
  const isFloorOnlyRecord = issueLabels && issueLabels.some(label => label.name === LABEL_FLOOR_RECORD);
  record.isFloorOnly = isFloorOnlyRecord;

  // 解析表单数据（GitHub Issue 表单格式）
  let currentKey = null;
  for (const line of lines) {
    if (line.startsWith('### ')) {
      currentKey = line.substring(4).trim();
    } else if (currentKey && line.trim() && !line.startsWith('_No response_')) {
      const value = line.trim();
      switch (currentKey) {
        case '罪人ID':
          record.sinnerId = parseInt(value, 10);
          break;
        case '罪人名称':
          record.sinnerName = value;
          // 如果没有 sinnerId，则从名称映射获取
          if (!record.sinnerId && SINNER_NAME_TO_ID[value]) {
            record.sinnerId = SINNER_NAME_TO_ID[value];
          }
          break;
        case '人格名称':
          record.personaName = value;
          break;
        case '通关时间（秒）':
          record.clearTime = parseInt(value, 10);
          break;
        case '通关日期':
          record.runDate = value;
          break;
        case '备注（可选）':
          record.comment = value;
          break;
        case '是否使用了 E.G.O':
          // 检查是否勾选了 E.G.O 选项
          record.usedEgo = value.includes('是，我在通关过程中使用了 E.G.O');
          break;
        case '是否成功单通':
          // 检查是否勾选了成功单通
          record.soloClear = value.includes('是，我成功单通了镜像地下城');
          break;
        case '单通层数（仅当选中"成功单通"时填写）':
        case '单通层数':
          // 解析层数（如"第5层" -> 5）
          if (value && value !== '未选择') {
            const match = value.match(/第(\d+)层/);
            if (match) {
              record.floorLevel = parseInt(match[1], 10);
              // 层数记录默认设置 soloClear 为 true
              if (isFloorOnlyRecord) {
                record.soloClear = true;
              }
            }
          }
          break;
      }
    }
  }

  return record;
}

/**
 * 验证时间记录数据
 */
function validateTimeRecord(record) {
  if (!record.sinnerId || record.sinnerId < 1 || record.sinnerId > 12) {
    return false;
  }
  if (!record.sinnerName || !record.personaName) {
    return false;
  }
  if (!record.clearTime || record.clearTime < 7200) {
    return false; // 必须 >= 2小时
  }
  if (!record.runDate) {
    return false;
  }
  return true;
}

/**
 * 验证层数记录数据（仅层数记录，不需要通关时间）
 */
function validateFloorRecord(record) {
  if (!record.sinnerId || record.sinnerId < 1 || record.sinnerId > 12) {
    return false;
  }
  if (!record.sinnerName || !record.personaName) {
    return false;
  }
  if (!record.floorLevel || ![5, 10, 15].includes(record.floorLevel)) {
    return false;
  }
  if (!record.runDate) {
    return false;
  }
  return true;
}

/**
 * 验证记录数据（根据记录类型选择验证方法）
 */
function validateRecord(record) {
  if (record.isFloorOnly) {
    return validateFloorRecord(record);
  }
  return validateTimeRecord(record);
}


/**
 * 标记 Issue 为已处理
 */
async function markIssueAsProcessed(issueNumber) {
  // 添加"已处理"标签
  const addResponse = await fetch(`${ISSUES_API}/${issueNumber}/labels`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ labels: [LABEL_PROCESSED] })
  });

  // 移除"已审核"标签（如果存在），实现近实时更新后的标签清理
  // 注意：如果标签不存在，API 会返回 404，这是预期行为，不需要处理
  try {
    await fetch(`${ISSUES_API}/${issueNumber}/labels/${encodeURIComponent(LABEL_REVIEWED)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
  } catch (error) {
    // 忽略标签移除失败的错误，因为标签可能本来就不存在
    console.log(`  ℹ️ 移除"已审核"标签时出现异常（可忽略）: ${error.message}`);
  }

  return addResponse.ok;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始聚合全球排行榜数据...\n');

  try {
    // 1. 获取所有已审核的通关记录 Issues
    console.log('📡 正在从 GitHub Issues 获取已审核的记录...');
    const issues = await fetchIssues();
    console.log(`✅ 找到 ${issues.length} 条已审核的记录\n`);

    // 2. 读取现有的排行榜数据
    const dataPath = join(process.cwd(), 'data', 'global-ranking.json');
    const floorDataPath = join(process.cwd(), 'data', 'global-floor-ranking.json');
    let rankingData;
    let floorRankingData;
    
    try {
      rankingData = JSON.parse(readFileSync(dataPath, 'utf8'));
    } catch {
      // 如果文件不存在，使用默认结构
      rankingData = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        sinners: {}
      };
    }
    
    try {
      floorRankingData = JSON.parse(readFileSync(floorDataPath, 'utf8'));
    } catch {
      // 如果文件不存在，使用默认结构
      floorRankingData = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        sinners: {}
      };
    }

    // 初始化12个罪人
    for (let i = 1; i <= 12; i++) {
      if (!rankingData.sinners[i]) {
        rankingData.sinners[i] = {
          id: i,
          name: '',
          personas: {}
        };
      }
      if (!floorRankingData.sinners[i]) {
        floorRankingData.sinners[i] = {
          id: i,
          name: '',
          personas: {}
        };
      }
    }

    // 3. 解析并验证每个 Issue
    let processedCount = 0;
    let validCount = 0;

    for (const issue of issues) {
      // 跳过已处理的 Issue
      if (issue.labels.some(label => label.name === LABEL_PROCESSED)) {
        continue;
      }

      const record = parseIssueBody(issue.body, issue.labels);
      
      if (!validateRecord(record)) {
        console.log(`⚠️  Issue #${issue.number} 数据无效，跳过`);
        continue;
      }

      // 4. 添加到排行榜数据结构
      const sinnerId = record.sinnerId.toString();
      if (!rankingData.sinners[sinnerId]) {
        rankingData.sinners[sinnerId] = {
          id: record.sinnerId,
          name: record.sinnerName,
          personas: {}
        };
      }
      if (!floorRankingData.sinners[sinnerId]) {
        floorRankingData.sinners[sinnerId] = {
          id: record.sinnerId,
          name: record.sinnerName,
          personas: {}
        };
      }

      // 更新罪人名称（如果为空）
      if (!rankingData.sinners[sinnerId].name) {
        rankingData.sinners[sinnerId].name = record.sinnerName;
      }
      if (!floorRankingData.sinners[sinnerId].name) {
        floorRankingData.sinners[sinnerId].name = record.sinnerName;
      }

      // 添加人格记录（时间排行榜）- 仅非层数记录才添加到时间排行榜
      if (!record.isFloorOnly) {
        if (!rankingData.sinners[sinnerId].personas[record.personaName]) {
          rankingData.sinners[sinnerId].personas[record.personaName] = [];
        }

        // 检查是否已存在相同的记录（基于时间和日期去重）
        const exists = rankingData.sinners[sinnerId].personas[record.personaName].some(
          r => r.clearTime === record.clearTime && r.runDate === record.runDate
        );

        if (!exists) {
          rankingData.sinners[sinnerId].personas[record.personaName].push({
            clearTime: record.clearTime,
            runDate: record.runDate,
            comment: record.comment || '',
            usedEgo: record.usedEgo || false,
            submittedAt: issue.created_at,
            issueNumber: issue.number
          });
          validCount++;
        }
      }
      
      // 添加人格记录（层数排行榜）
      if (record.soloClear && record.floorLevel) {
        if (!floorRankingData.sinners[sinnerId].personas[record.personaName]) {
          floorRankingData.sinners[sinnerId].personas[record.personaName] = [];
        }
        
        // 检查是否已存在相同的记录
        const floorExists = floorRankingData.sinners[sinnerId].personas[record.personaName].some(
          r => r.floorLevel === record.floorLevel && r.runDate === record.runDate
        );
        
        if (!floorExists) {
          floorRankingData.sinners[sinnerId].personas[record.personaName].push({
            floorLevel: record.floorLevel,
            runDate: record.runDate,
            comment: record.comment || '',
            usedEgo: record.usedEgo || false,
            submittedAt: issue.created_at,
            issueNumber: issue.number
          });
          // 如果是层数记录，也算为有效记录
          if (record.isFloorOnly) {
            validCount++;
          }
        }
      }

      // 5. 标记为已处理
      await markIssueAsProcessed(issue.number);
      processedCount++;
      console.log(`✅ 已处理 Issue #${issue.number}: ${record.sinnerName} - ${record.personaName}`);
    }

    // 6. 对每个人格的记录按时间排序（快 -> 慢）
    for (const sinnerId in rankingData.sinners) {
      const sinner = rankingData.sinners[sinnerId];
      for (const personaName in sinner.personas) {
        sinner.personas[personaName].sort((a, b) => a.clearTime - b.clearTime);
        
        // 只保留前50名
        if (sinner.personas[personaName].length > 50) {
          sinner.personas[personaName] = sinner.personas[personaName].slice(0, 50);
        }
      }
    }
    
    // 7. 对层数排行榜排序（层数高 -> 低，相同层数按提交时间排序）
    for (const sinnerId in floorRankingData.sinners) {
      const sinner = floorRankingData.sinners[sinnerId];
      for (const personaName in sinner.personas) {
        sinner.personas[personaName].sort((a, b) => {
          // 首先按层数递减排序
          if (b.floorLevel !== a.floorLevel) {
            return b.floorLevel - a.floorLevel;
          }
          // 相同层数按提交时间排序
          return new Date(a.submittedAt) - new Date(b.submittedAt);
        });
        
        // 只保留前50名
        if (sinner.personas[personaName].length > 50) {
          sinner.personas[personaName] = sinner.personas[personaName].slice(0, 50);
        }
      }
    }

    // 8. 更新时间戳
    rankingData.lastUpdate = new Date().toISOString();
    floorRankingData.lastUpdate = new Date().toISOString();

    // 9. 写入文件
    writeFileSync(dataPath, JSON.stringify(rankingData, null, 2), 'utf8');
    writeFileSync(floorDataPath, JSON.stringify(floorRankingData, null, 2), 'utf8');
    
    console.log(`\n✨ 数据聚合完成！`);
    console.log(`   处理了 ${processedCount} 条 Issue`);
    console.log(`   新增 ${validCount} 条有效记录`);
    console.log(`   时间排行榜已保存到 ${dataPath}`);
    console.log(`   层数排行榜已保存到 ${floorDataPath}`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

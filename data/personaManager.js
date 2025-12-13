/**
 * 人格数据管理模块
 * 
 * 功能：
 * 1. 提供人格名称映射机制，解决Issue模板与characters.js人格名称不一致问题
 * 2. 提供人格头像查找功能，支持模糊匹配
 * 3. 集中管理人格数据，便于扩展和维护
 * 
 * 使用方式：
 * - 导入: import { PersonaManager } from './data/personaManager.js';
 * - 查找头像: PersonaManager.findPersonaAvatar(sinnerId, personaName);
 * - 获取标准名称: PersonaManager.normalizePersonaName(sinnerId, personaName);
 */

import { sinnerData } from './characters.js';

/**
 * 人格名称映射表
 * 
 * 说明：
 * - Issue模板中为避免同名人格冲突，会在人格名后添加罪人名称后缀
 * - 例如："六协会南部4科(以实玛利)" -> "六协会南部4科"
 * - 此映射表支持将Issue模板名称转换为characters.js中的标准名称
 * 
 * 结构：
 * {
 *   "罪人ID": {
 *     "Issue模板中的人格名称": "characters.js中的标准人格名称"
 *   }
 * }
 * 
 * 新增人格映射步骤：
 * 1. 在对应罪人的ID下添加映射
 * 2. key为Issue模板中使用的名称（带后缀）
 * 3. value为characters.js中的标准名称
 */
export const PERSONA_NAME_MAPPING = {
    // 李箱 (Yi Sang) - ID: 1
    1: {
        // 暂无需要映射的人格（所有名称在Issue模板中是唯一的）
    },
    // 浮士德 (Faust) - ID: 2
    2: {
        'LCB罪人(浮士德)': 'LCB罪人',
        '剑契组杀手(浮士德)': '剑契组杀手'
    },
    // 堂吉诃德 (Don Quixote) - ID: 3
    3: {
        'W公司3级清扫人员(堂吉诃德)': 'W公司3级清扫人员',
        'LCB罪人(堂吉诃德)': 'LCB罪人',
        '脑叶公司E.G.O:提灯(堂吉诃德)': '脑叶公司E.G.O:提灯',
        '剑契组杀手(堂吉诃德)': '剑契组杀手'
    },
    // 良秀 (Ryoshu) - ID: 4
    4: {
        'W公司3级清扫人员(良秀)': 'W公司3级清扫人员',
        'Seven协会南部6科(良秀)': 'Seven协会南部6科',
        'LCB罪人(良秀)': 'LCB罪人'
    },
    // 默尔索 (Meursault) - ID: 5
    5: {
        'W公司2级清扫人员(默尔索)': 'W公司2级清扫人员',
        'LCB罪人(默尔索)': 'LCB罪人'
    },
    // 鸿璐 (Hong Lu) - ID: 6
    6: {
        'W公司2级清扫人员(鸿璐)': 'W公司2级清扫人员',
        'LCB罪人(鸿璐)': 'LCB罪人',
        'Dieci协会南部4科(鸿璐)': 'Dieci协会南部4科',
        '黑云会若众(鸿璐)': '黑云会若众',
        '20区圣愚(鸿璐)': '20区圣愚'
    },
    // 希斯克利夫 (Heathcliff) - ID: 7
    7: {
        'Seven协会南部4科(希斯克利夫)': 'Seven协会南部4科',
        'LCB罪人(希斯克利夫)': 'LCB罪人',
        '句点事务所收尾人(希斯克利夫)': '句点事务所收尾人',
        '黑云会若众(希斯克利夫)': '黑云会若众'
    },
    // 以实玛利 (Ishmael) - ID: 8
    8: {
        'し协会南部5科(以实玛利)': 'し协会南部5科',
        'R公司第四集团军驯鹿队(以实玛利)': 'R公司第四集团军驯鹿队',
        'LCCB系长(以实玛利)': 'LCCB系长',
        'LCB罪人(以实玛利)': 'LCB罪人',
        '六协会南部4科(以实玛利)': '六协会南部4科'
    },
    // 罗佳 (Rodion) - ID: 9
    9: {
        'N公司中锤(罗佳)': 'N公司中锤',
        'LCCB系长(罗佳)': 'LCCB系长',
        'LCB罪人(罗佳)': 'LCB罪人',
        'Dieci协会南部4科(罗佳)': 'Dieci协会南部4科',
        '黑云会若众(罗佳)': '黑云会若众'
    },
    // 辛克莱 (Sinclair) - ID: 10
    10: {
        'Девять协会北部3科(辛克莱)': 'Девять协会北部3科',
        'Zwei协会西部3科(辛克莱)': 'Zwei协会西部3科',
        'LCB罪人(辛克莱)': 'LCB罪人',
        '中指幼弟(辛克莱)': '中指幼弟',
        '臼齿修船厂收尾人(辛克莱)': '臼齿修船厂收尾人',
        '剑契组杀手(辛克莱)': '剑契组杀手'
    },
    // 格里高尔 (Gregor) - ID: 11
    11: {
        'Zwei协会南部4科(格里高尔)': 'Zwei协会南部4科',
        'LCB罪人(格里高尔)': 'LCB罪人',
        '玫瑰扳手工坊收尾人(格里高尔)': '玫瑰扳手工坊收尾人',
        '六协会南部6科(格里高尔)': '六协会南部6科',
        '黑云会副会长(格里高尔)': '黑云会副会长',
        '黑兽-巳(格里高尔)': '黑兽-巳'
    },
    // 奥提斯 (Outis) - ID: 12
    12: {
        'LCB罪人(奥提斯)': 'LCB罪人',
        'Cinq协会南部4科(奥提斯)': 'Cinq协会南部4科',
        '臼齿事务所收尾人(奥提斯)': '臼齿事务所收尾人',
        '剑契组杀手(奥提斯)': '剑契组杀手',
        '环指点彩派学徒(奥提斯)': '环指点彩派学徒',
        '黑兽-卯(奥提斯)': '黑兽-卯'
    }
};

/**
 * 人格管理器类
 * 提供人格数据查询、名称映射、头像查找等功能
 */
export class PersonaManager {
    /**
     * 将Issue模板中的人格名称标准化为characters.js中的名称
     * 
     * @param {number|string} sinnerId - 罪人ID (1-12)
     * @param {string} personaName - Issue模板中的人格名称
     * @returns {string} 标准化后的人格名称
     * 
     * @example
     * // 输入: sinnerId=8, personaName="六协会南部4科(以实玛利)"
     * // 输出: "六协会南部4科"
     */
    static normalizePersonaName(sinnerId, personaName) {
        if (!personaName) return personaName;
        
        const id = parseInt(sinnerId);
        
        // 验证罪人ID范围
        if (isNaN(id) || id < 1 || id > 12) {
            return personaName;
        }
        
        const mapping = PERSONA_NAME_MAPPING[id];
        
        // 如果存在映射，返回映射后的名称
        if (mapping && mapping[personaName]) {
            return mapping[personaName];
        }
        
        // 如果没有映射，尝试去除括号后缀（兜底处理）
        // 匹配模式: "人格名称(罪人名)"
        const suffixMatch = personaName.match(/^(.+?)\([^)]+\)$/);
        if (suffixMatch) {
            return suffixMatch[1];
        }
        
        return personaName;
    }
    
    /**
     * 根据罪人ID和人格名称查找人格头像路径
     * 支持Issue模板名称和characters.js标准名称两种格式
     * 
     * @param {number|string} sinnerId - 罪人ID (1-12)
     * @param {string} personaName - 人格名称（支持Issue模板格式或标准格式）
     * @returns {string|null} 头像路径，未找到时返回null
     * 
     * @example
     * // 两种名称格式都可以找到头像
     * PersonaManager.findPersonaAvatar(8, "六协会南部4科");
     * PersonaManager.findPersonaAvatar(8, "六协会南部4科(以实玛利)");
     */
    static findPersonaAvatar(sinnerId, personaName) {
        if (!personaName) return null;
        
        const id = parseInt(sinnerId);
        
        // 验证罪人ID范围
        if (isNaN(id) || id < 1 || id > 12) {
            return null;
        }
        
        const sinner = sinnerData.find(s => s.id === id);
        if (!sinner || !sinner.personalities) return null;
        
        // 首先尝试直接匹配
        let persona = sinner.personalities.find(p => p.name === personaName);
        if (persona) {
            return persona.avatar || null;
        }
        
        // 尝试标准化后匹配
        const normalizedName = this.normalizePersonaName(sinnerId, personaName);
        if (normalizedName !== personaName) {
            persona = sinner.personalities.find(p => p.name === normalizedName);
            if (persona) {
                return persona.avatar || null;
            }
        }
        
        return null;
    }
    
    /**
     * 根据罪人ID获取罪人信息
     * 
     * @param {number|string} sinnerId - 罪人ID (1-12)
     * @returns {Object|null} 罪人数据对象，未找到时返回null
     */
    static getSinnerById(sinnerId) {
        return sinnerData.find(s => s.id === parseInt(sinnerId)) || null;
    }
    
    /**
     * 获取指定罪人的所有人格列表
     * 
     * @param {number|string} sinnerId - 罪人ID (1-12)
     * @returns {Array} 人格数组，未找到时返回空数组
     */
    static getPersonasBySinnerId(sinnerId) {
        const sinner = this.getSinnerById(sinnerId);
        return sinner ? sinner.personalities : [];
    }
    
    /**
     * 检查人格名称是否有效（存在于characters.js中）
     * 
     * @param {number|string} sinnerId - 罪人ID (1-12)
     * @param {string} personaName - 人格名称
     * @returns {boolean} 是否有效
     */
    static isValidPersona(sinnerId, personaName) {
        if (!personaName) return false;
        
        const sinner = sinnerData.find(s => s.id === parseInt(sinnerId));
        if (!sinner || !sinner.personalities) return false;
        
        // 直接匹配
        if (sinner.personalities.some(p => p.name === personaName)) {
            return true;
        }
        
        // 标准化后匹配
        const normalizedName = this.normalizePersonaName(sinnerId, personaName);
        return sinner.personalities.some(p => p.name === normalizedName);
    }
    
    /**
     * 获取所有罪人数据
     * 
     * @returns {Array} 所有罪人数据数组
     */
    static getAllSinners() {
        return sinnerData;
    }
    
    /**
     * 获取人格名称映射表（用于调试或扩展）
     * 
     * @returns {Object} 完整的人格名称映射表
     */
    static getPersonaNameMapping() {
        return PERSONA_NAME_MAPPING;
    }
}

// 导出默认实例方法，方便直接使用
export const findPersonaAvatar = PersonaManager.findPersonaAvatar.bind(PersonaManager);
export const normalizePersonaName = PersonaManager.normalizePersonaName.bind(PersonaManager);
export const getSinnerById = PersonaManager.getSinnerById.bind(PersonaManager);
export const getPersonasBySinnerId = PersonaManager.getPersonasBySinnerId.bind(PersonaManager);
export const isValidPersona = PersonaManager.isValidPersona.bind(PersonaManager);

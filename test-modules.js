// 模块测试脚本 - 用于测试模块导入

// 注意：这个脚本需要在支持ES模块的环境中运行
// 可以使用以下命令运行：node --experimental-modules test-modules.js

console.log('开始测试模块导入...');

// 测试Filters模块
try {
    import('./js/filters.js').then(({ default: Filters }) => {
        console.log('✅ Filters模块导入成功');
        console.log('Filters模块方法:', Object.keys(Filters));
    }).catch(error => {
        console.error('❌ Filters模块导入失败:', error);
    });
} catch (error) {
    console.error('❌ Filters模块导入失败:', error);
}

// 测试Scrolls模块
try {
    import('./js/scrolls.js').then(Scrolls => {
        console.log('✅ Scrolls模块导入成功');
        console.log('Scrolls模块方法:', Object.keys(Scrolls));
    }).catch(error => {
        console.error('❌ Scrolls模块导入失败:', error);
    });
} catch (error) {
    console.error('❌ Scrolls模块导入失败:', error);
}

// 测试Settings模块
try {
    import('./js/settings.js').then(Settings => {
        console.log('✅ Settings模块导入成功');
        console.log('Settings模块方法:', Object.keys(Settings));
    }).catch(error => {
        console.error('❌ Settings模块导入失败:', error);
    });
} catch (error) {
    console.error('❌ Settings模块导入失败:', error);
}

// 测试UI模块
try {
    import('./js/ui.js').then(({ default: UI }) => {
        console.log('✅ UI模块导入成功');
        console.log('UI模块方法:', Object.keys(UI));
    }).catch(error => {
        console.error('❌ UI模块导入失败:', error);
    });
} catch (error) {
    console.error('❌ UI模块导入失败:', error);
}

console.log('模块测试完成，请查看控制台输出');
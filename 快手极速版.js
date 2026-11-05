/**
 * 快手极速版自动化脚本（基于 Auto.js，适配 realme RMX3161 / Android 11）
 * 用途：模拟人工观看短视频、随机点赞、随机滑动
 * 注意：短视频平台反作弊系统可能封号，请在备用机/备用号上测试，不要绑定主力实名账号。
 */

// ================= 配置区 =================
const RUN_TOTAL_TIME = 2 * 60 * 60;   // 总运行时长，秒（默认2小时）
const WATCH_MIN = 8;                  // 单视频最小观看秒数
const WATCH_MAX = 18;                 // 单视频最大观看秒数
const LIKE_PROB = 0.12;               // 点赞概率
const FOLLOW_PROB = 0.02;             // 关注概率（极低，建议关小）
const MAX_LAUNCH_RETRY = 3;           // 启动APP最大重试次数
// ==========================================

// 你手机上已确认安装的包名
const PACKAGE_NAME = "com.kuaishou.nebula";

const SCREEN_W = device.width;   // 1080
const SCREEN_H = device.height;  // 2400
const CENTER_X = SCREEN_W / 2;
const CENTER_Y = SCREEN_H / 2;

function main() {
    auto();
    console.show();
    log("=== 快手极速版自动化脚本（改进版）===");
    log("设备分辨率：" + SCREEN_W + "x" + SCREEN_H);
    images.requestScreenCapture(false);
    log("已请求截屏权限");

    if (!launchAppWithRetry()) {
        log("启动APP失败，退出脚本");
        return;
    }

    run(RUN_TOTAL_TIME);
}

function launchAppWithRetry() {
    for (let i = 1; i <= MAX_LAUNCH_RETRY; i++) {
        log("第 " + i + " 次尝试启动快手极速版...");
        launchPackage(PACKAGE_NAME);
        sleep(8000);
        closePopups();
        if (isAppLaunched()) {
            log("APP 已启动：" + PACKAGE_NAME);
            return true;
        }
        sleep(5000);
    }
    return false;
}

function isAppLaunched() {
    // 简单判断：页面是否出现快手常见元素，可根据真机实际调整
    // 常见：底部导航栏、拍摄按钮、视频流区域等
    if (text("拍摄").findOnce()) return true;
    if (idContains("bottom_nav").findOnce()) return true;
    if (text("发现").findOnce()) return true;
    return false;
}

function closePopups() {
    const closeTexts = ["我知道了", "关闭", "跳过", "允许", "同意", "稍后"];
    for (let t of closeTexts) {
        let btn = text(t).findOnce();
        if (btn) {
            try { btn.click(); log("关闭弹窗：" + t); } catch (e) {}
            sleep(1000);
        }
    }
    const closeIds = [
        "com.kuaishou.nebula:id/close",
        "com.kuaishou.nebula:id/a4v"
    ];
    for (let id of closeIds) {
        let btn = id(id).findOnce();
        if (btn) {
            try { btn.click(); log("关闭弹窗(ID)：" + id); } catch (e) {}
            sleep(1000);
        }
    }
}

function run(totalTime) {
    log("计划运行时长：" + totalTime + " 秒");
    let watchTime = 0;
    let videoCount = 0;

    while (watchTime < totalTime) {
        if (checkCaptcha()) {
            log("检测到验证码，脚本暂停，请手动处理后继续");
            sleep(60000);
            continue;
        }

        let waitTime = random(WATCH_MIN, WATCH_MAX);
        log("本视频计划观看：" + waitTime + " 秒");

        sleep(waitTime * 500);
        randomAction();
        sleep(waitTime * 500);

        watchTime += waitTime;
        videoCount++;
        log("已观看：" + videoCount + " 个视频，累计：" + watchTime + " 秒");

        swipeToNextVideo();
    }

    log("达到设定时长，脚本结束");
    home();
}

function checkCaptcha() {
    // 滑块验证码常见文字
    if (text("拖动滑块").findOnce()) return true;
    if (text("验证").findOnce()) return true;
    return false;
}

function randomAction() {
    // 随机点赞（双击屏幕中间）
    if (Math.random() < LIKE_PROB) {
        try {
            click(CENTER_X, CENTER_Y);
            sleep(300);
            click(CENTER_X, CENTER_Y);
            log("随机双击点赞");
        } catch (e) {}
    }

    // 极低概率关注
    if (Math.random() < FOLLOW_PROB) {
        try {
            let follow = text("关注").findOnce();
            if (follow) {
                follow.click();
                log("随机关注");
            }
        } catch (e) {}
    }
}

function swipeToNextVideo() {
    // 随机起点/终点，模拟真人不规则滑动
    let x1 = CENTER_X + random(-80, 80);
    let y1 = CENTER_Y + random(150, 350);
    let x2 = CENTER_X + random(-80, 80);
    let y2 = CENTER_Y - random(150, 350);
    let duration = random(300, 700);

    try {
        swipe(x1, y1, x2, y2, duration);
        log("滑动切换视频，时长：" + duration + "ms");
    } catch (e) {
        log("滑动失败：" + e);
    }
    sleep(2000); // 等待下一视频加载
}

main();

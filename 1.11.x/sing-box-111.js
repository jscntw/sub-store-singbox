const { type, name } = $arguments;
let config = JSON.parse($files[0]);

if (!config.outbounds) config.outbounds = [];

let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

if (proxies && proxies.length > 0) {
  config.outbounds.push(...proxies);
}

const regionMap = {
  'us': /🇺🇸|us|united\s?states|🇺🇲/i,
  'jp': /jp|japan|🇯🇵/i,
  'sg': /sg|singapore|🇸🇬/i,
  'kr': /kr|korea|🇰🇷/i,
  'tw': /tw|taiwan|🇹🇼/i,
  'hk': /hk|hong\s?kong|🇭🇰/i
};

// 获取所有新增节点的 tag 列表
const allProxyTags = getTags(proxies);

config.outbounds.forEach(i => {
  // 只处理包含子节点的选择器/urltest 组
  if (!i.outbounds || !Array.isArray(i.outbounds)) return;

  // 如果原本写了 "COMPATIBLE"，先清理掉，避免它留在数组里
  i.outbounds = i.outbounds.filter(tag => tag !== "COMPATIBLE" && tag !== "direct");

  if (['all', 'all-auto'].includes(i.tag)) {
    i.outbounds.push(...allProxyTags);
  } else {
    for (const [key, regex] of Object.entries(regionMap)) {
      if (i.tag === key || i.tag === `${key}-auto`) {
        i.outbounds.push(...getTags(proxies, regex));
      }
    }
  }

  // --- 修正后的兜底逻辑 ---
  // 只有核心代理组（如“🚀 默认代理”或“all”）在完全没节点时才允许用 direct 兜底
  // 或者你希望完全不显示 direct，可以把这段 if 删掉
  if (i.outbounds.length === 0) {
     if (i.tag === '🚀 默认代理' || i.tag === 'all-auto') {
        i.outbounds.push("direct");
     } else {
        // 如果地区组（如 hk）没有节点，塞一个占位符防止 sing-box 启动报错（sing-box 要求选择器不能为空）
        // 建议塞一个已知的 tag，比如 "direct" 或者你的默认代理组名
        i.outbounds.push("direct"); 
     }
  }
});

$content = JSON.stringify(config, null, 2);

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag);
}

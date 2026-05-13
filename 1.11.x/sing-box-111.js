const { type, name } = $arguments;
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
};
let compatible = false;
let config = JSON.parse($files[0]);

let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

// 1. 先把解析到的代理节点放入总出站列表
config.outbounds.push(...proxies);

// 2. 遍历并填充各个分组
config.outbounds.forEach(i => {
  // 只处理有子出站的分组 (selector / urltest)
  if (!i.outbounds || !Array.isArray(i.outbounds)) return;

  // 【关键修改】先清空模板里可能存在的初始占位符，保证逻辑干净
  i.outbounds = i.outbounds.filter(tag => tag !== "direct" && tag !== "COMPATIBLE");

  // 开始匹配
  if (['all', 'all-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies));
  }
  if (['hk', 'hk-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /港|hk|hongkong|hong kong|🇭🇰/i));
  }
  if (['tw', 'tw-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /台|tw|taiwan|🇹🇼/i));
  }
  if (['kr', 'kr-auto'].includes(i.tag)) { // 修正了你原代码这里的 tw-auto 笔误
    i.outbounds.push(...getTags(proxies, /韩|kr|korea|🇰🇷/i));
  }
  if (['jp', 'jp-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /日本|jp|japan|🇯🇵/i));
  }
  if (['sg', 'sg-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /新|sg|singapore|🇸🇬/i));
  }
  if (['us', 'us-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /美|us|united\s?states|🇺🇸|🇺🇲/i));
  }
});

// 3. 兜底逻辑：处理依然为空的分组
config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound);
      compatible = true;
    }
    outbound.outbounds.push(compatible_outbound.tag);
  }
});

$content = JSON.stringify(config, null, 2);

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag);
}

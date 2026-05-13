const { type, name } = $arguments;

// 定义一个兼容出站，防止地区组为空导致 Sing-box 报错
const compatible_outbound = {
  tag: 'COMPATIBLE-DIRECT',
  type: 'direct',
};
let hasCompatibleAdded = false;

let config = JSON.parse($files[0]);
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

// 将订阅节点加入总列表
config.outbounds.push(...proxies);

// 定义地区识别正则
const regionConfig = [
  { tags: ['hk', 'hk-auto'], regex: /港|hk|hong/i },
  { tags: ['tw', 'tw-auto'], regex: /台|tw|taiwan/i },
  { tags: ['jp', 'jp-auto'], regex: /日|jp|japan/i },
  { tags: ['sg', 'sg-auto'], regex: /新|sg|sing/i },
  { tags: ['kr', 'kr-auto'], regex: /韩|kr|korea/i },
  { tags: ['us', 'us-auto'], regex: /美|us|united|🇺🇲|fhc/i }, // 增加了 fhc 和国旗识别
  { tags: ['all', 'all-auto'], regex: null }
];

config.outbounds.forEach(outbound => {
  if (!outbound.outbounds || !Array.isArray(outbound.outbounds)) return;

  // 检查当前 tag 是否在我们的 regionConfig 中
  const matchConfig = regionConfig.find(conf => conf.tags.includes(outbound.tag));

  if (matchConfig) {
    // 清空占位符
    outbound.outbounds = [];

    // 填充节点
    const matchedTags = getTags(proxies, matchConfig.regex);
    outbound.outbounds.push(...matchedTags);

    // 如果该地区没匹配到节点，塞入兼容直连防错
    if (outbound.outbounds.length === 0) {
      if (!hasCompatibleAdded) {
        config.outbounds.push(compatible_outbound);
        hasCompatibleAdded = true;
      }
      outbound.outbounds.push(compatible_outbound.tag);
    }
  }
  // 其余分组（如 GLOBAL, apple, ai 等）脚本不予理睬，保留手动配置
});

$content = JSON.stringify(config, null, 2);

function getTags(proxies, regex) {
  // 如果没有正则（all 组），返回所有节点名；如果有正则，按正则过滤
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag);
}

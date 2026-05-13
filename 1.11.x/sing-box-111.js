const { type, name } = $arguments;

// 定义兜底的出站节点
const compatible_outbound = {
  tag: 'COMPATIBLE',
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

// 1. 将物理节点加入总出站
config.outbounds.push(...proxies);

// 2. 定义需要自动填充节点的“地区组”清单
// 只有在这个名单里的 tag，才会被清空并注入节点
const regionTags = ['us', 'jp', 'sg', 'kr', 'tw', 'hk', 'all', 'us-auto', 'jp-auto', 'sg-auto', 'kr-auto', 'tw-auto', 'hk-auto', 'all-auto'];

config.outbounds.forEach(outbound => {
  if (!outbound.outbounds || !Array.isArray(outbound.outbounds)) return;

  const tag = outbound.tag.toLowerCase();

  // 【核心修改】只处理地区组，不碰 GLOBAL、apple、cn 等组
  if (regionTags.includes(tag)) {
    // 清理这些组里的 "" 或 direct
    outbound.outbounds = outbound.outbounds.filter(t => t !== "" && t !== "direct");

    // 注入节点
    if (tag.includes('all')) {
      outbound.outbounds.push(...getTags(proxies));
    } else if (tag.includes('hk')) {
      outbound.outbounds.push(...getTags(proxies, /港|hk|hong/i));
    } else if (tag.includes('tw')) {
      outbound.outbounds.push(...getTags(proxies, /台|tw|taiwan/i));
    } else if (tag.includes('jp')) {
      outbound.outbounds.push(...getTags(proxies, /日|jp|japan/i));
    } else if (tag.includes('sg')) {
      outbound.outbounds.push(...getTags(proxies, /新|sg|sing/i));
    } else if (tag.includes('kr')) {
      outbound.outbounds.push(...getTags(proxies, /韩|kr|korea/i));
    } else if (tag.includes('us')) {
      outbound.outbounds.push(...getTags(proxies, /美|us|united/i));
    }

    // 兜底：如果地区组没匹配到节点，补一个 COMPATIBLE
    if (outbound.outbounds.length === 0) {
      if (!hasCompatibleAdded) {
        config.outbounds.push(compatible_outbound);
        hasCompatibleAdded = true;
      }
      outbound.outbounds.push(compatible_outbound.tag);
    }
  }
  // 如果 tag 不在 regionTags 里（比如 GLOBAL），脚本会跳过，保留你原有的 ["direct", "🚀 默认代理"]
});

$content = JSON.stringify(config, null, 2);

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag);
}

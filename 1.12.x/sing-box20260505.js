const { type, name } = $arguments; // 修复：必须有分号
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
};
let compatible;
let config = JSON.parse($files[0]);

let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

// 1. 注入节点
config.outbounds.push(...proxies);

// 2. 处理各个分组逻辑
config.outbounds.map(i => {
  // 核心修复：检查 i.outbounds 是否存在，不存在就跳过，防止报错
  if (!i.outbounds || !Array.isArray(i.outbounds)) return;

  // --- 以下完全保留你的原版分组逻辑，未做任何改动 ---
  if (i.tag === '香港-落地专机') {
    i.outbounds.push(...getTags(proxies, /香港-落地专机/i))
  }
  if (i.tag === '日本-落地专机') {
    i.outbounds.push(...getTags(proxies, /日本-落地专机/i))
  }
  if (i.tag === '新加坡-落地专机') {
    i.outbounds.push(...getTags(proxies, /新加坡-落地专机/i))
  }
  if (i.tag === '韩国-落地专机') {
    i.outbounds.push(...getTags(proxies, /韩国-落地专机/i))
  }
  if (i.tag === '台湾-落地专机') {
    i.outbounds.push(...getTags(proxies, /台湾-落地专机/i))
  }
  if (i.tag === '美国-落地专机') {
    i.outbounds.push(...getTags(proxies, /美国-落地专机/i))
  }
  if (['all', 'all-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies))
  }
  if (['hk', 'hk-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /hk|hongkong|kong kong|🇭🇰/i))
  }
  if (['tw', 'tw-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /tw|taiwan|🇹🇼/i))
  }
  if (['kr', 'kr-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /kr|KR|Korea|🇰🇷/i))
  }
  if (['jp', 'jp-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /jp|japan|🇯🇵/i))
  }
  if (['sg', 'sg-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /(sg|singapore|🇸🇬)/i))
  }
  if (['us', 'us-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /🇺🇸|US|us|unitedstates|united states|🇺🇲/i))
  }
});

// 3. 兜底处理
config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    outbound.outbounds.push(compatible_outbound.tag)
  }
})

$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}

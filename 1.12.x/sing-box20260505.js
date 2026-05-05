const { type, name } = $arguments;

// 将兼容节点改为 dns 类型，避免 1.11+ 弃用 direct 节点导致的报错
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'dns', 
};

let compatible;
let config = JSON.parse($files[0]);

let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

config.outbounds.push(...proxies);

config.outbounds.map(i => {
  if (!i.outbounds || !Array.isArray(i.outbounds)) return;
  
  // 落地专机逻辑
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

  // 地区自动选择逻辑
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

// 如果某个 selector 为空，填入 COMPATIBLE 占位符
config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    outbound.outbounds.push(compatible_outbound.tag)
  }
});

$content = JSON.stringify(config, null, 2);

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}

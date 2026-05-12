const { type, name } = $arguments;
let config = JSON.parse($files[0]);

// 1. 极其重要的防错：确保 outbounds 数组存在
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

// 2. 将 map 改为 forEach，这样更符合你直接修改原数组的逻辑
config.outbounds.forEach(i => {
  if (!i.outbounds || !Array.isArray(i.outbounds)) return;

  if (['all', 'all-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies));
  }

  for (const [key, regex] of Object.entries(regionMap)) {
    if (i.tag === key || i.tag === `${key}-auto`) {
      i.outbounds.push(...getTags(proxies, regex));
    }
  }
});

// 3. 兜底逻辑
config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    outbound.outbounds.push("direct");
  }
});

$content = JSON.stringify(config, null, 2);

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag);
}

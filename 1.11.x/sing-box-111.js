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

// 2. 遍历并按你的格式进行逻辑匹配
config.outbounds.forEach(i => {
  if (!i.outbounds || !Array.isArray(i.outbounds)) return;

  // --- 地区分组逻辑：先清空，再添加 ---
  
  if (['all', 'all-auto'].includes(i.tag)) {
    i.outbounds = []; // 清空模板里的 "" 或 direct
    i.outbounds.push(...getTags(proxies));
  }

  if (['hk', 'hk-auto'].includes(i.tag)) {
    i.outbounds = []; 
    i.outbounds.push(...getTags(proxies, /港|hk|hongkong/i));
  }

  if (['tw', 'tw-auto'].includes(i.tag)) {
    i.outbounds = [];
    i.outbounds.push(...getTags(proxies, /台|tw|taiwan/i));
  }

  if (['jp', 'jp-auto'].includes(i.tag)) {
    i.outbounds = [];
    i.outbounds.push(...getTags(proxies, /日|jp|japan/i));
  }

  if (['sg', 'sg-auto'].includes(i.tag)) {
    i.outbounds = [];
    i.outbounds.push(...getTags(proxies, /新|sg|singapore/i));
  }

  if (['kr', 'kr-auto'].includes(i.tag)) {
    i.outbounds = [];
    i.outbounds.push(...getTags(proxies, /韩|kr|korea/i));
  }

  if (['us', 'us-auto'].includes(i.tag)) {
    i.outbounds = [];
    i.outbounds.push(...getTags(proxies, /美|us|united states/i));
  }

  // --- 自动兜底逻辑 ---
  // 如果是地区分组（匹配了上面的逻辑）但没抓到节点，填充 COMPATIBLE
  // 注意：这里用了一个简单的判断，只有被清空过的组才参与兜底
  const regionTags = ['all', 'all-auto', 'hk', 'hk-auto', 'tw', 'tw-auto', 'jp', 'jp-auto', 'sg', 'sg-auto', 'kr', 'kr-auto', 'us', 'us-auto'];
  if (regionTags.includes(i.tag) && i.outbounds.length === 0) {
    if (!hasCompatibleAdded) {
      config.outbounds.push(compatible_outbound);
      hasCompatibleAdded = true;
    }
    i.outbounds.push(compatible_outbound.tag);
  }

  // GLOBAL, apple, cn 等组因为没有写在上面的 if 里，
  // 所以 i.outbounds = [] 不会执行，它们会保留模板里的 ["direct", "..."]
});

$content = JSON.stringify(config, null, 2);

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag);
}

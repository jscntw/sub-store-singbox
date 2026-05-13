const { type, name } = $arguments;

// 准备一个兼容节点，防止某些地区组为空导致 Sing-box 报错
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

// 将从订阅获取的所有节点加入到总出站列表
config.outbounds.push(...proxies);

config.outbounds.forEach(i => {
  // 只处理定义了 outbounds 数组的分组
  if (!i.outbounds || !Array.isArray(i.outbounds)) return;

  // --- 关键修改点 1：定义需要脚本动态填充节点的“地区组” ---
  const regionTags = [
    'all', 'all-auto', 
    'hk', 'hk-auto', 
    'tw', 'tw-auto', 
    'jp', 'jp-auto', 
    'sg', 'sg-auto', 
    'kr', 'kr-auto', 
    'us', 'us-auto'
  ];
  
  if (regionTags.includes(i.tag)) {
    // 只有在这些地区组里，才清空原来的占位符 [""] 并填入真实节点
    i.outbounds = []; 
    
    if (['all', 'all-auto'].includes(i.tag)) {
      i.outbounds.push(...getTags(proxies));
    } else if (['hk', 'hk-auto'].includes(i.tag)) {
      i.outbounds.push(...getTags(proxies, /港|hk|hong/i));
    } else if (['tw', 'tw-auto'].includes(i.tag)) {
      i.outbounds.push(...getTags(proxies, /台|tw|taiwan/i));
    } else if (['jp', 'jp-auto'].includes(i.tag)) {
      i.outbounds.push(...getTags(proxies, /日|jp|japan/i));
    } else if (['sg', 'sg-auto'].includes(i.tag)) {
      i.outbounds.push(...getTags(proxies, /新|sg|sing/i));
    } else if (['kr', 'kr-auto'].includes(i.tag)) {
      i.outbounds.push(...getTags(proxies, /韩|kr|korea/i));
    } else if (['us', 'us-auto'].includes(i.tag)) {
      i.outbounds.push(...getTags(proxies, /美|us|united/i));
    }

    // 如果该地区没有节点，塞入直连节点防错
    if (i.outbounds.length === 0) {
      if (!hasCompatibleAdded) {
        config.outbounds.push(compatible_outbound);
        hasCompatibleAdded = true;
      }
      i.outbounds.push(compatible_outbound.tag);
    }
  } 
  // --- 关键修改点 2：非地区组（如 GLOBAL, apple, ai 等）不做处理 ---
  // 它们会自动保留你在主配置中手动填写的 "direct" 或 "🚀 默认代理"
});

$content = JSON.stringify(config, null, 2);

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag);
}

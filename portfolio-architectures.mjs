// Hands-on items are owner-confirmed across the portfolio. Branch associations
// express technical relevance, not an unconfirmed deployment at that employer.
export const ARCHITECTURE_FAMILIES = {
  ranking: {
    title: 'Ranking, tabular learning & multi-task personalization',
    description: 'Feature interactions, tabular predictors, shared experts, and task-specific decision heads.',
    worked: ['MaskNet', 'PLE', 'RealMLP', 'Mixture of experts', 'Decision heads'],
    related: ['DLRM', 'MMoE'],
    references: [{name:'MaskNet',url:'https://arxiv.org/abs/2102.07619'},{name:'PLE',url:'https://dl.acm.org/doi/10.1145/3383313.3412236'},{name:'RealMLP',url:'https://arxiv.org/abs/2407.04491'},{name:'DLRM',url:'https://arxiv.org/abs/1906.00091'},{name:'MMoE',url:'https://research.google/pubs/modeling-task-relationships-in-multi-task-learning-with-multi-gate-mixture-of-experts/'}]
  },
  generative: {
    title: 'Generative recommendation & semantic retrieval',
    description: 'Autoregressive item generation, semantic IDs, and adapting pretrained language models to industrial-scale recommendation.',
    perspective: 'I think generative recommenders and adapting pretrained language models are the path forward for recommendation systems.',
    worked: ['OneRec', 'PLUM', 'TIGER', 'RQ-VAE semantic IDs'],
    related: ['HSTU', 'Encoder-decoder retrieval', 'Two-tower retrieval'],
    references: [{name:'OneRec',url:'https://arxiv.org/abs/2502.18965'},{name:'PLUM',url:'https://arxiv.org/abs/2510.07784'},{name:'TIGER',url:'https://arxiv.org/abs/2305.05065'},{name:'HSTU',url:'https://arxiv.org/abs/2402.17152'}]
  },
  sequential: {
    title: 'User sequences & attention',
    description: 'Learning from behavior histories for recommendations, advertising, and personalization.',
    worked: ['Transformers', 'Attention blocks'],
    related: ['SASRec', 'BERT4Rec'],
    references: [{name:'SASRec',url:'https://arxiv.org/abs/1808.09781'},{name:'BERT4Rec',url:'https://arxiv.org/abs/1904.06690'}]
  },
  foundation: {
    title: 'Foundation models & full-model tuning',
    description: 'Llama tuning across all attention and Transformer blocks, alongside expert-based model architectures.',
    worked: ['Llama', 'All attention blocks', 'All Transformer blocks', 'Mixture of experts'],
    related: ['LoRA'],
    references: [{name:'LoRA',url:'https://arxiv.org/abs/2106.09685'}]
  },
  decisions: {
    title: 'Agents, decisions & post-training',
    description: 'Decision heads and model adaptation for action selection, assistants, and agent workflows.',
    worked: ['Decision heads', 'Llama', 'Mixture of experts'],
    related: ['Policy heads', 'Value heads', 'Reward models'],
    references: []
  },
  recurrent: {
    title: 'Looped computation & iterative reasoning',
    description: 'Looped Transformers and repeated computation through shared model blocks.',
    worked: ['Looped Transformers'],
    related: ['Recurrent depth', 'Weight sharing'],
    references: []
  }
};

export const BRANCH_ARCHITECTURES = {
  ebay: [[], [], ['ranking']],
  liftoff: [['sequential'], ['ranking'], ['ranking', 'sequential']],
  xai: [['generative'], ['foundation', 'recurrent'], ['foundation', 'decisions']],
  robinhood: [['ranking', 'generative', 'sequential'], ['decisions', 'recurrent'], ['foundation', 'decisions', 'recurrent']]
};
const escapeArchitecture = text => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderArchitectureKnowledge(job, branch) {
  const families = (BRANCH_ARCHITECTURES[job]?.[branch] || []).map(key => ARCHITECTURE_FAMILIES[key]);
  if (!families.length) return '';
  const chips = list => list.map(name => `<span>${escapeArchitecture(name)}</span>`).join('');
  return `<section class="architecture-knowledge" aria-label="Relevant architecture knowledge"><h4>Architecture knowledge</h4><p class="architecture-note">Hands-on across my work, grouped by relevance to this branch.</p>${families.map(family => `<div class="architecture-family"><h5>${escapeArchitecture(family.title)}</h5><p>${escapeArchitecture(family.description)}</p>${family.perspective?`<p class="architecture-perspective"><strong>My view:</strong> ${escapeArchitecture(family.perspective)}</p>`:''}<span class="architecture-label">Worked with</span><div class="architecture-chips">${chips(family.worked)}</div><span class="architecture-label">Related patterns</span><div class="architecture-chips related">${chips(family.related)}</div>${family.references.length ? `<details><summary>Architecture references</summary><div class="architecture-references">${family.references.map(ref => `<a href="${ref.url}" target="_blank" rel="noopener noreferrer">${escapeArchitecture(ref.name)} ↗</a>`).join('')}</div></details>` : ''}</div>`).join('')}</section>`;
}

export const ARCHITECTURE_CONTEXT = `Architecture experience confirmed directly by Pavan: he has worked with MaskNet, PLE (Progressive Layered Extraction), Llama tuning across all attention and all Transformer blocks, OneRec, PLUM, TIGER, RealMLP, mixture of experts, looped Transformers, and decision heads. RQ-VAE semantic IDs, Transformers and attention are also documented in his portfolio. Pavan explicitly confirmed PLUM means Adapting Pre-trained Language Models for Industrial-scale Generative Recommendations. He also identifies HSTU as a related paper and believes generative recommendation and adapting pretrained models are the path forward for recommenders. HSTU is a related architecture, not newly confirmed hands-on experience. RealMLP is interpreted as the tabular MLP; do not infer a proprietary variant. Decision heads is a generic owner-supplied term; no specific policy, value, reward, or trading head design is confirmed. Looped Transformers are now confirmed hands-on experience, superseding earlier interest-only wording. These are architectures he worked with, not claims of inventing the architectures or authoring their papers. The family-to-career mapping expresses relevance, not confirmation that each architecture was deployed at that employer. Related patterns are educational comparisons, not additional claimed hands-on experience. Do not invent architecture-specific employer implementations, dates, metrics, or confidential details. Families and relevant timeline branches: ` + JSON.stringify({families:ARCHITECTURE_FAMILIES, branches:BRANCH_ARCHITECTURES});

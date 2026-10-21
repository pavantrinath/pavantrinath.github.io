// A shared display vocabulary for local answers, prompts and model replies.
// Labels describe mentions in the text, not whether a model claim is verified.
const vocabulary = {
  PERSON: ['Rajinikanth', 'Rajnikanth', 'Rajini', 'Thalaivar', 'Pavan Trinath Vutukuru', 'Pavan Trinath', 'Pavan'],
  ORG: ['University of Texas at Dallas', 'UT Dallas', 'KL University', 'Capgemini US LLC', 'Capgemini', 'Robinhood', 'Liftoff', 'eBay', 'xAI', 'x AI'],
  LOCATION: ['San Francisco Bay Area', 'San Francisco', 'San Jose', 'Bay Area', 'Richardson', 'Dallas', 'Texas', 'California', 'United States', 'North America', 'India', 'Hyderabad', 'Bengaluru', 'Bangalore', 'New York', 'Seattle', 'London', 'the beach', 'beaches', 'beach'],
  'RESEARCH TOPIC': ['phrase-based machine translation', 'machine translation', 'foundation models', 'generative recommenders', 'generative recommendation', 'generative ranking', 'generative retrieval', 'looped transformers', 'physical intelligence', 'diffusion models', 'post-training RL', 'post-training', 'agentic RL', 'reinforcement learning', 'fine-tuning', 'long-context reasoning', 'sequential models', 'multimodal systems', 'model routing', 'transformers', 'recommenders', 'ranking', 'retrieval', 'agents', 'normalization', 'extraction', 'indexing', 'GRPO', 'SFT', 'BERT', 'NER'],
  PROJECT: ['agentic trading', 'Cortex assistant', 'Cortex'],
  TOOL: ['TensorFlow Serving', 'Hugging Face', 'PyTorch', 'JAX', 'Triton', 'ONNX', 'Kubernetes', 'PySpark', 'Polars', 'BigQuery', 'Docker', 'MySQL', 'MongoDB'],
  LANGUAGE: ['Python', 'Go', 'Java'],
  INTEREST: ['cricket', 'robotics', 'open source'],
  FOOD: ['Indian pizza', 'pizza', 'biryani', 'dosa', 'idli', 'curry', 'tacos', 'sushi', 'pasta', 'burgers', 'burger', 'sandwiches', 'sandwich', 'chocolate', 'ice cream'],
  DRINK: ['coffee', 'espresso', 'cappuccino', 'latte', 'chai', 'tea'],
  OBJECT: ['cricket bat', 'cricket ball', 'laptops', 'laptop', 'computers', 'computer', 'robots', 'robot', 'keyboards', 'keyboard', 'books', 'book', 'headphones', 'bicycle', 'bikes', 'bike', 'coffee mug', 'mug', 'cup', 'desk'],
  TEAM: ['Indian Champs'],
  LEAGUE: ['North American Cricket League', 'NACL'],
  MOVIE: ['I, Robot', 'I Robot'],
  'WORK AUTHORIZATION': ['visa sponsorship', 'sponsorship'],
  INTENT: ['new opportunity', 'opportunities', 'contact', 'speaking', 'talks'],
  TOPIC: ['life outside work']
};
const labels = new Map(Object.entries(vocabulary).flatMap(([type, words]) => words.map(word => [word.toLowerCase(), type])));
const escape = text => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const names = [...labels.keys()].sort((a,b) => b.length-a.length).map(escapeRegex).join('|');
const pattern = new RegExp(`https?:\\/\\/[^\\s<>"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}|(?<![\\p{L}\\p{N}_])(?:${names})(?![\\p{L}\\p{N}_])`, 'giu');
export function entityMentions(text) {
  return [...text.matchAll(pattern)].filter(m => m[0].toLowerCase()!=='go' || m[0]==='Go' || /\b(?:programming|languages?|skills?|stack|python|java)\b/i.test(text)).map(m => {
    const value = /^https?:/i.test(m[0]) ? m[0].replace(/[.,;!?)]+$/, '') : m[0];
    return {start:m.index, end:m.index+value.length, text:value, type:/^https?:/i.test(value)?'LINK':value.includes('@')?'EMAIL':labels.get(value.toLowerCase())};
  });
}
export function renderEntities(text) {
  let html='', end=0;
  for (const mention of entityMentions(text)) {
    html+=escape(text.slice(end,mention.start));
    const value=escape(mention.text);
    const content=mention.type==='EMAIL'?`<a href="mailto:${value}">${value}</a>`:mention.type==='LINK'?`<a href="${value}" target="_blank" rel="noopener noreferrer">${value}</a>`:value;
    html+=`<span class="entity" data-type="${mention.type}"><small>${mention.type}</small>${content}</span>`;
    end=mention.end;
  }
  return html+escape(text.slice(end));
}
// Preserve local HTML, action buttons and already-labelled entities. Only text
// nodes are replaced; model/user strings always pass through renderEntities.
export function highlightEntities(container) {
  const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()) {
    const node=walker.currentNode;
    if(!node.parentElement.closest('.entity, button, a, script, style') && entityMentions(node.data).length)nodes.push(node);
  }
  for(const node of nodes) {
    const template=document.createElement('template');
    template.innerHTML=renderEntities(node.data);
    node.replaceWith(template.content);
  }
}

// Verified portfolio answers shared by the browser and the model context.
export const FACTS = {
  greeting: 'Hello! Who are you!',
  bot: 'I’m Atom, the AI assistant for this portfolio.',
  fandom: 'Pavan loves Rajinikanth. In Pavan’s personal fan ranking, he is god. Apparently even the foundation models report to Thalaivar.',
  movie: 'Pavan’s favorite movie is I, Robot. It got him hooked on AI and robotics. A robot movie became a career plan; subtle foreshadowing.',
  sponsorship: 'Pavan will need visa sponsorship.',
  about: 'Pavan Trinath Vutukuru is an Applied AI Lead / Staff ML Engineer at Robinhood.',
  currentrole: 'Pavan is Applied AI Lead / Staff ML Engineer at Robinhood, since December 2025. He is TL, modeling for agentic trading and Cortex assistant and contributed to building both. He is also TL for personalization on homepage, search, and growth.',
  location: 'Pavan is based in the San Francisco Bay Area.',
  education: 'Pavan earned a master’s in Cognitive Science at the University of Texas at Dallas in July 2015 and a B.Tech in Computer Science at KL University in May 2013.',
  cricket: 'Pavan plays for Indian Champs in NACL (North American Cricket League). Indian Champs is the team; NACL is the league.',
  leadership: 'At Robinhood, Pavan was selected within five months to provide technical leadership for a 14-engineer AI R&D team. He is TL, modeling for agentic trading and Cortex assistant; he contributed to building both. He is also TL for personalization on homepage, search, and growth.',
  awards: 'Pavan received the eBay Critical Talent Award (top 1% performance), a Spot Award for Excellence for production description extraction, and the Best Idea Award for a model evaluation framework later adopted company-wide.',
  linkedin: 'Pavan’s LinkedIn: https://www.linkedin.com/in/pavantrinath.',
  github: 'Pavan’s GitHub: https://github.com/pavantrinath.',
  contact: 'You can contact Pavan at pavantrinath@gmail.com.',
  experience: 'Pavan’s career: Capgemini (October 2015–February 2016), eBay (February 2016–September 2024), Liftoff (September 2024–April 2025), xAI (May–December 2025), and Robinhood (December 2025–present).',
  capgemini: 'Pavan was a Developer / Consultant at Capgemini US LLC from October 2015 to February 2016, working on provisioning as a service using Mistral and StackStorm and observability.',
  unknownfact: 'That detail about Pavan is not supplied in his public portfolio. Please contact Pavan at pavantrinath@gmail.com.',
  unrelated: 'It’s not possible to answer that here. Please ask something about Pavan.'
};

// Match the requested relationship before broad topic words such as “team”.
export function matchQuestion(raw) {
  const s = raw.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (/^(?:(?:hi|hello|hey|hiya|howdy|greetings|good morning|good afternoon|good evening)(?: there| atom)?[\s!.,?]*)+$/i.test(s)) return 'greeting';
  if (/\b(?:who are you|what are you|your name|who is atom|what is atom)\b/.test(s)) return 'bot';
  if (/\b(?:tell me about|introduce|describe) pavan(?: trinath(?: vutukuru)?)?\b/.test(s)) return 'about';
  if (/^(?:(?:please )?(?:tell me about|about|introduce|describe|who is) )?pavan(?: trinath(?: vutukuru)?)?[.!?]*$/.test(s)) return 'about';
  if (/ignore.*instruct|system prompt|password|secret|delete|hack/.test(s)) return null;
  if (/\b(?:rajinikanth|rajnikanth|rajini|thalaivar)\b/.test(s)) return 'fandom';
  if (/\b(?:visa|sponsorship|sponsor|work authorization|immigration)\b/.test(s)) return 'sponsorship';
  if (/\b(?:movie|film|i,? robot)\b/.test(s) || /(?:hooked|inspired|got|drawn).*\b(?:ai|robotics)\b/.test(s)) return 'movie';
  if (/\b(?:salary|home address|phone number|birthday|age|born|favorite team|favourite team|coffee order|playing position|batting|statistics)\b/.test(s)) return 'unknownfact';
  if (/\blinkedin\b/.test(s)) return 'linkedin';
  if (/\bgithub\b/.test(s)) return 'github';
  if (/\b(?:awards?|honou?rs?|recognition)\b/.test(s)) return 'awards';
  if (/\b(?:education|degree|studied|study|college|university|alma mater|masters?|bachelors?|school)\b/.test(s)) return 'education';
  if (/\b(?:cricket|nacl|indian champs|leagues?)\b/.test(s) || /\b(?:team|club)\b.*\bplay\b|\bplay\b.*\b(?:team|club)\b/.test(s)) return 'cricket';
  if (/\b(?:team|engineers?|leadership)\b/.test(s) && /\b(?:lead|leads|led|manage|manages|technical|robinhood)\b/.test(s)) return 'leadership';
  const employer = /\b(e ?bay|liftoff|x ?ai|robinhood|capgemini)\b/.exec(s);
  if (employer) return employer[1].replace(/ /g, '');
  if (/\b(?:work history|career|previous|previously|past jobs|former employers|resume)\b/.test(s) || /\b(?:where|who|which)\b.*\b(?:worked|employers|companies)\b/.test(s)) return 'experience';
  if (/\b(?:current role|current job|job title|profession|occupation|employer)\b/.test(s) || /\b(?:where|who|which company)\b.*\b(?:work|works|working|employed|employs)\b/.test(s) || /\bwhat\b.*\b(?:do|does)\b.*\b(?:you|he|pavan)\b.*\bdo\b/.test(s)) return 'currentrole';
  if (/\b(?:location|located|based|live|lives|living)\b/.test(s) || /^where (?:are you|is (?:he|pavan))\??$/.test(s)) return 'location';
  if (/\b(?:who is (?:he|pavan)|his name|full name)\b/.test(s)) return 'about';
  return null;
}


export function isModelingQuestion(raw){
 const s=raw.toLowerCase();
 const technical=/\b(?:masknet|ple|llama|onerec|one rec|plum|hstu|tiger|realmlp|real mlp|mixture of experts|moe|decision heads|dlrm|mmoe|sasrec|bert4rec|lora|rq.vae|model(?:ing|ling|s)?|machine learning|transformers?|embeddings?|recommend(?:er|ers|ation|ations)|ranking|retrieval|reinforcement learning|rl|sft|grpo|fine.tun(?:e|ing)|training|post.training|ner|bert|diffusion|feature engineering|loss functions?|evaluation|inference|neural|architectures?)\b/.test(s);
 const question=/\b(?:how|why|what|which|when|explain|compare|design|implement|train|tune|evaluate|should|can|help|debug|recommend|tell|describe)\b|\?/.test(s);
 return technical&&(question||s.trim().split(/\s+/).length<=3);
}


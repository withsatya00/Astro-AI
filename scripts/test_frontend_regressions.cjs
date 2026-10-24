const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');
const root = process.cwd();
const {window} = parseHTML('<html><head></head><body></body></html>');
const document = window.document;
let timers = new Map(), timerId = 0;
const context = vm.createContext({
  window, document, console, navigator: {}, NodeFilter: {SHOW_TEXT: 4},
  MutationObserver: class {observe(){} disconnect(){}},
  CustomEvent: window.CustomEvent, localStorage: {getItem: () => null, setItem(){}},
  setTimeout: (fn, ms) => {timers.set(++timerId, {fn, ms}); return timerId;},
  clearTimeout: id => timers.delete(id), setInterval: () => 1, clearInterval(){},
  queueMicrotask, URL, Blob, fetch, AbortController,
});
function run(file) {vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename:file});}
function tick(ms) {
  for (const [id, timer] of [...timers]) if (timer.ms === ms) {timers.delete(id); timer.fn();}
}
async function main() {
  const component = fs.readFileSync('website/frontend/src/components/FAQAccordion/FAQAccordion.js', 'utf8')
    .replace(/^import .*;$/m, '').replace('export class ', 'class ').replace('export default FAQAccordionComponent;', 'window.FAQAccordionComponent = FAQAccordionComponent;');
  vm.runInContext(component, context);
  document.body.innerHTML = fs.readFileSync('website/frontend/src/components/FAQAccordion/FAQAccordion.html', 'utf8');
  window.FAQAccordionComponent.bind(document.body);
  const questions = [...document.querySelectorAll('.faq-question-btn')];
  assert.equal(questions.length, 7);
  for (const button of questions) {
    const pane = document.getElementById(button.getAttribute('aria-controls'));
    button.click(); assert.equal(pane.hidden, false); assert.equal(button.getAttribute('aria-expanded'), 'true');
    button.click(); assert.equal(pane.hidden, true); assert.equal(button.getAttribute('aria-expanded'), 'false');
  }
  document.querySelector('[data-category="wallet"].faq-tab-btn').click();
  assert.equal([...document.querySelectorAll('.faq-item')].filter(el => !el.hidden).length, 2);
  const search = document.getElementById('faq-search-input');
  search.value = 'birth'; search.dispatchEvent(new window.Event('input'));
  assert.equal([...document.querySelectorAll('.faq-item')].filter(el => !el.hidden).length, 1);
  document.querySelector('[data-category="all"].faq-tab-btn').click();
  assert.ok([...document.querySelectorAll('.faq-item')].filter(el => !el.hidden).length >= 1);
  console.log('PASS FAQ: all seven answers open/close; category + search combine.');

  if (fs.existsSync('website/frontend/js/ui-locales.js')) run('website/frontend/js/ui-locales.js');
  run('website/frontend/js/i18n.js');
  context.I18n = window.I18n;
  window.I18n.sourceText = new WeakMap(); window.I18n.sourceAttributes = new WeakMap();
  window.I18n.buildPhraseIndex();
  if (window.ASTRO_UI_LOCALES) {
    const phrases = window.ASTRO_UI_LOCALES.phrases;
    const badEnglish = Object.entries(phrases).filter(([,row]) => /[\u0900-\u097f]/.test(row.en));
    assert.equal(badEnglish.length, 0, JSON.stringify(badEnglish.slice(0,5)));
    const source = questions[0].textContent.trim();
    window.I18n.currentLang = 'hi';
    const hindi = window.I18n.text(source); assert.match(hindi, /[\u0900-\u097f]/);
    window.I18n.currentLang = 'en';
    assert.doesNotMatch(window.I18n.text(hindi), /[\u0900-\u097f]/);
    assert.equal(window.I18n.text(source), window.I18n.text(hindi));
    for (const lang of ['en','hi','en','hi']) {
      window.I18n.currentLang = lang;
      window.I18n.applyTranslations();
      assert.equal(questions[0].getAttribute('aria-expanded'), 'false');
    }
    console.log(`PASS locales: ${Object.keys(phrases).length} phrases, no Hindi in English copy; repeated switching preserves FAQ controls.`);
    const files = fs.readdirSync('website/frontend/src', {recursive:true}).filter(file => file.endsWith('.html'));
    document.body.innerHTML = files.map(file => fs.readFileSync('website/frontend/src/' + file, 'utf8')).join('\n');
    document.querySelectorAll('script,style').forEach(el => el.remove());
    window.I18n.currentLang='en'; window.I18n.applyTranslations();
    let mixed=[];
    const walker=document.createTreeWalker(document.body,4); let node;
    while ((node=walker.nextNode())) if (/[\u0900-\u097f]/.test(node.textContent)) mixed.push(node.textContent.trim());
    assert.equal(mixed.length,0,'Untranslated English UI nodes: '+JSON.stringify(mixed.slice(0,15)));
    window.I18n.currentLang='hi'; window.I18n.applyTranslations();
    const untranslated=[];
    const hindiWalker=document.createTreeWalker(document.body,4);
    while ((node=hindiWalker.nextNode())) {
      const text=node.textContent.trim();
      if (/[A-Za-z]{3}/.test(text) && !/[\u0900-\u097f]/.test(text) &&
          !/^(?:ASTRO JYOTISH|PDF|JSON|FIRSTFREE|Swiss Ephemeris|D[0-9]+|B\.V\. Raman|KP|©|https?:|www\.|support@|₹|[0-9]|--|AS|IST)/.test(text)) untranslated.push(text);
    }
    assert.equal(untranslated.length,0,'Untranslated Hindi UI nodes: '+JSON.stringify(untranslated.slice(0,25)));
    console.log(`PASS full-site static translation: ${files.length} component/page templates in English and Hindi.`);
    const answer=document.createElement('div'); answer.className='assistant-bubble';
    answer.innerHTML='<div class="msg-text-content">आपकी जन्म तिथि क्या है?</div>';
    document.body.appendChild(answer);
    window.I18n.currentLang='en'; window.I18n.applyTranslations();
    assert.equal(answer.textContent,'आपकी जन्म तिथि क्या है?');
    answer.firstElementChild.textContent='Please share your birth date.';
    window.I18n.currentLang='hi'; window.I18n.applyTranslations();
    assert.equal(answer.textContent,'Please share your birth date.');
  }

  run('website/frontend/js/chat.js');
  context.ChatController = window.ChatController;
  context.CallingAgentService = window.CallingAgentService;
  const call = window.CallingAgentService;
  assert.equal(call.isFemaleAstrologer({name:'Acharya Anand Joshi'}),false);
  assert.equal(call.isFemaleAstrologer({name:'Dr. Meenakshi Iyer'}),true);
  window.isSecureContext = true;
  let recognizers = [], speaking = [];
  const neuralRequests = [];
  const synthesizeSpeech = async payload => {neuralRequests.push(payload); return new Blob(['test-audio'],{type:'audio/mpeg'});};
  context.API = {synthesizeSpeech};
  context.Audio = class {
    constructor(url) {this.src=url; this.lang=neuralRequests.at(-1).language==='hi'?'hi-IN':'en-IN';speaking.push(this);}
    async play() {}
    pause() {}
  };
  const flush = async () => {await Promise.resolve();await Promise.resolve();};
  class Recognition {
    constructor(){recognizers.push(this);}
    start(){this.started = true; this.onstart?.();}
    abort(){this.started=false; this.onend?.();}
    stop(){this.abort();}
    result(text, final=true){this.onresult?.({resultIndex:0,results:[Object.assign([{transcript:text}], {isFinal:final})]});}
  }
  window.SpeechRecognition = Recognition;
  window.speechSynthesis = {cancel(){}, getVoices:() => [{name:'English',lang:'en-IN'},{name:'Hindi',lang:'hi-IN'}], speak:utterance => speaking.push(utterance)};
  context.SpeechSynthesisUtterance = class {constructor(text){this.text=text;}};
  call.isCalling = true; call.isMuted = false; call.micBlocked = false; call.isResponding = false;
  call.activeAstrologer = {name:'Test',gender:'male'};
  window.I18n.currentLang='en';
  call.initSpeechRecognition(); assert.equal(call.recognition.lang,'en-IN');
  const received = [];
  const realHandle = call.handleUserVoiceInput;
  call.handleUserVoiceInput = text => received.push(text);
  call.recognition.result('When will I get a new job?'); tick(550);
  assert.deepEqual(received,['When will I get a new job?']);
  assert.ok(call.silenceDelay('I want to know about my career and') > call.silenceDelay('When will I get a new job?'),'unfinished sentences wait longer');
  assert.equal(call.recognition,null);
  call.initSpeechRecognition();
  call.recognition.result('My career',false);
  call.recognition.onend(); assert.equal(received.length,2,'end-before-debounce must not lose transcript');
  call.initSpeechRecognition(); call.recognition.onerror({error:'not-allowed'}); call.recognition.onend();
  assert.equal(call.micBlocked,true); const count=recognizers.length; tick(400); assert.equal(recognizers.length,count);
  call.toggleManualMic(); assert.equal(call.micBlocked,false); assert.equal(call.isListening,true);
  call.toggleMute(); assert.equal(call.recognition,null); call.toggleMute(); assert.ok(call.recognition);
  call.stopRecognition(); window.I18n.currentLang='hi'; call.initSpeechRecognition(); assert.equal(call.recognition.lang,'hi-IN');
  call.isManualMicActive=false;
  call.speakPanditVoice('नमस्कार',() => call.initSpeechRecognition());
  await flush();
  assert.equal(call.recognition,null,'recognizer must stop during agent speech');
  assert.equal(speaking.at(-1).lang,'hi-IN');
  assert.equal(neuralRequests.at(-1).gender,'male');
  speaking.at(-1).onended(); assert.ok(call.recognition,'mic must resume after speech');
  call.stopRecognition(); call.isResponding=true; call.initSpeechRecognition(); assert.equal(call.recognition,null);
  call.isResponding=false; call.isSpeakerMuted=true; call.speakPanditVoice('Reply',()=>call.initSpeechRecognition()); assert.ok(call.recognition,'speaker mute must not prevent listening');
  call.stopRecognition(); call.isSpeakerMuted=false; call.isManualMicActive=false;
  call.handleUserVoiceInput=realHandle;
  const messages=[]; window.ChatController.appendMessage=(role,text)=>messages.push({role,text});
  const adoptedCharts=[];
  window.ChatController.adoptChatChart=id=>{if(id) adoptedCharts.push(id);};
  window.I18n.currentLang='en';
  window.App = {currentChart:{id:'voice-chart',city:'Lucknow'}};
  window.ChatController.activeConsultation = {id:'test-consultation'};
  context.API={synthesizeSpeech, streamConsultationSession: async (id,payload,onSession,onDelta,onDone) => {
    assert.equal(id,'test-consultation');
    assert.equal(payload.language,'en');
    assert.equal(call.recognition,null); assert.equal(call.isResponding,true);
    onSession({consultation_id:'test-consultation',chart_id:'voice-chart'});
    onDelta('Your career prospects are improving. ');
    onDone({content:'Your career prospects are improving.',chart_id:'voice-chart'});
  }};
  await call.handleUserVoiceInput('When will my career improve?');
  assert.equal(call.isResponding,false);
  assert.deepEqual(adoptedCharts,['voice-chart','voice-chart']);
  while (call.isSpeaking) {await flush(); speaking.at(-1).onended();}
  assert.ok(call.recognition);
  assert.equal(messages[0].role,'user');
  assert.equal(messages.at(-1).text,'Your career prospects are improving.');
  call.activeAstrologer.gender='female';
  call.speakPanditVoice('आप अपना प्रश्न पूछिए।',()=>call.initSpeechRecognition()); await flush();
  assert.equal(neuralRequests.at(-1).gender,'female');
  assert.equal(neuralRequests.at(-1).language,'hi');
  speaking.at(-1).onended();
  let resolveSpeech;
  context.API.synthesizeSpeech=()=>new Promise(resolve=>{resolveSpeech=resolve;});
  call.speakPanditVoice('A cancelled response',()=>call.initSpeechRecognition());
  const audioCount=speaking.length;
  call.endCall(); resolveSpeech(new Blob(['cancelled'])); await flush();
  assert.equal(speaking.length,audioCount,'late TTS response must not play after hanging up');
  assert.equal(call.recognition,null); tick(400); assert.equal(call.recognition,null);
  console.log('PASS calling: transcript submission, interim flush, permission retry, mute/unmute, language, speech/mic handoff, API payload, end-call cleanup.');
}
main().catch(error => {console.error(error); process.exitCode=1;});

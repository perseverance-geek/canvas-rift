export function createSound(button:HTMLButtonElement){
  let context:AudioContext|undefined,master:GainNode|undefined,enabled=false;
  let riverGain:GainNode|undefined,skyGain:GainNode|undefined,region=0,space=0,other=0;
  let nightGain:GainNode|undefined;
  button.setAttribute('aria-label','开启环境音');
  function build(){
    context=new AudioContext();master=context.createGain();master.gain.value=0;master.connect(context.destination);
    // A quiet, beatless harmonic bed and filtered wind, synthesized entirely on device.
    for(const [i,f] of [110,164.81,220,293.66,329.63].entries()){
      const tone=context.createOscillator(),gain=context.createGain();tone.type='sine';tone.frequency.value=f; tone.detune.value=i%2?-4:4;
      gain.gain.value=.022/(1+i*.3);tone.connect(gain);gain.connect(master);tone.start();
      const lfo=context.createOscillator(),depth=context.createGain();lfo.frequency.value=.08+i*.027;depth.gain.value=.006; lfo.connect(depth);depth.connect(gain.gain);lfo.start();
    }
    const buffer=context.createBuffer(1,context.sampleRate*4,context.sampleRate),data=buffer.getChannelData(0);
    let last=0;for(let i=0;i<data.length;i++){last=(last+Math.random()*.04-.02)/1.02;data[i]=last;}
    const noise=context.createBufferSource();noise.buffer=buffer;noise.loop=true;
    const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=600;
    const wind=context.createGain();wind.gain.value=.18;noise.connect(filter);filter.connect(wind);wind.connect(master);noise.start();
    // The river uses the same audio context and noise buffer. Both new layers are silent in the cafe.
    riverGain=context.createGain();riverGain.gain.value=region*(1-other)*.11;riverGain.connect(master);
    const water=context.createBufferSource();water.buffer=buffer;water.loop=true;
    const waterFilter=context.createBiquadFilter();waterFilter.type='bandpass';waterFilter.frequency.value=1450;waterFilter.Q.value=.45;
    water.connect(waterFilter);waterFilter.connect(riverGain);water.start();
    skyGain=context.createGain();skyGain.gain.value=space*(1-other)*.025;skyGain.connect(master);
    for(const f of [440,659.26,880]){
      const voice=context.createOscillator(),volume=context.createGain();voice.frequency.value=f;volume.gain.value=.15;
      voice.connect(volume);volume.connect(skyGain);voice.start();
    }
    // A quiet, darker air layer shares the same context and source buffer.
    nightGain=context.createGain();nightGain.gain.value=other*.06;nightGain.connect(master);
    const nightWind=context.createBufferSource();nightWind.buffer=buffer;nightWind.loop=true;
    const nightFilter=context.createBiquadFilter();nightFilter.type='lowpass';nightFilter.frequency.value=340;
    nightWind.connect(nightFilter);nightFilter.connect(nightGain);nightWind.start();
    const bass=context.createOscillator(),bassVolume=context.createGain();bass.frequency.value=73.42;bassVolume.gain.value=.18;
    bass.connect(bassVolume);bassVolume.connect(nightGain);bass.start();
  }
  button.onclick=async()=>{
    try {
      if(!context)build();await context!.resume();enabled=!enabled;
      master!.gain.setTargetAtTime(enabled?.55:0,context!.currentTime,.6);
      button.setAttribute('aria-pressed',String(enabled));button.title=enabled?'关闭环境音':'开启环境音';
      button.setAttribute('aria-label',button.title);
      button.innerHTML=`${enabled?'♫':'♪'} <span>声音${enabled?'开启':'关闭'}</span>`;
    }catch{button.innerHTML='♪ <span>声音不可用</span>';}
  };
  document.addEventListener('visibilitychange',()=>{if(!context)return;if(document.hidden)void context.suspend();else if(enabled)void context.resume();});
  return {setRegion(next:number,altitude:number,third=0){
    if(Math.abs(next-region)<.015&&Math.abs(altitude-space)<.015&&Math.abs(third-other)<.015)return;
    region=next;space=altitude;other=third;
    if(!context)return;
    riverGain!.gain.setTargetAtTime(region*(1-other)*.11,context.currentTime,1.2);
    skyGain!.gain.setTargetAtTime(space*(1-other)*.025,context.currentTime,1.5);
    nightGain!.gain.setTargetAtTime(other*.06,context.currentTime,1.5);
  }};
}

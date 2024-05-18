/**
 * Custom React Hook: useApp
 *
 * Description:
 * This hook provides functionality for handling camera initialization, capturing video frames,
 * and managing speech recognition for voice commands.
 *
 * Returns:
 * An object containing references and state for camera handling and speech recognition.
 *
 * @returns {Object} - An object with the following properties:
 * @property {Object} videoRef - Reference to the video element for camera streaming.
 * @property {boolean} isLoading - Flag indicating whether the camera is currently loading.
 * @property {boolean} listening - Flag indicating whether speech recognition is actively listening.
 * @property {string} response - The response received from the Gemini API.
 * @property {Array} base64Frames - Array containing base64-encoded video frames.
 *
 * Usage:
 * const {
 *   videoRef,
 *   isLoading,
 *   listening,
 *   response,
 *   base64Frames,
 * } = useApp();
 */
import { useEffect, useRef, useState } from "react";
import annyang, { Commands } from "annyang";
import "regenerator-runtime/runtime";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { makeGeminiRequest } from "./useGemini";
import { useSpeech } from "./useSpeech";

var is_listening = false;
var is_auto_mode = false;


function writeString(data :DataView, offset:number, str:string) :DataView{
  for (var i = 0; i < str.length; i++) {
      data.setUint8(offset + i, str.charCodeAt(i));
  }
  return data
}

function createWAVFileData(all_array:Float32Array,inputSampleRate:number,oututSampleBits:number) :DataView{
  var sampleRate = inputSampleRate;
  var sampleBits = oututSampleBits;
  //var bytes = encodePCM();

  var buffer = new ArrayBuffer(44 + all_array.length*2);
  var data = new DataView(buffer);

  var channelCount = 1;   // 单声道
  var offset = 0;

  // 资源交换文件标识符
  writeString(data, offset, 'RIFF'); offset += 4;
  // 下个地址开始到文件尾总字节数,即文件大小-8
  data.setUint32(offset, 36 + buffer.byteLength, true); offset += 4;
  // WAV文件标志
  writeString(data, offset, 'WAVE'); offset += 4;
  // 波形格式标志
  writeString(data, offset, 'fmt '); offset += 4;
  // 过滤字节,一般为 0x10 = 16
  data.setUint32(offset, 16, true); offset += 4;
  // 格式类别 (PCM形式采样数据)
  data.setUint16(offset, 1, true); offset += 2; // // format: 1(PCM)
  // 通道数
  data.setUint16(offset, channelCount, true); offset += 2;
  // 采样率,每秒样本数,表示每个通道的播放速度
  data.setUint32(offset, sampleRate, true); offset += 4;
  // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
  data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true); offset += 4;
  // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
  data.setUint16(offset, channelCount * (sampleBits / 8), true); offset += 2;
  // 每样本数据位数
  data.setUint16(offset, sampleBits, true); offset += 2;
  // 数据标识符
  writeString(data, offset, 'data'); offset += 4;
  // 采样数据总数,即数据总大小-44
  data.setUint32(offset, buffer.byteLength, true); offset += 4;

  // 给wav头增加pcm体
  var value =0
  for (let i = 0; i < all_array.length; i++) {
      value = Number(all_array[i] * 32768)
      // data.setUint8(offset++, data>>8, true);
      // data.setUint8(offset++, data&0xff, true);
      data.setInt16(offset, value , true);
      offset +=2
  }

  return data;
}

// 当前使用的摄像头设备ID
export let currentDeviceId: string | undefined;
export let videoRef : Object | undefined;  

var setBase64Frames_func : Object | undefined;  

let sampleRate = 16000;

var mediasetting = {
  audio: {
      deviceId: "default",
      sampleRate: 16000,
      sampleSize: 16,
      channelCount: 1
  },video:Object
}

let currentIndex = -1
let audio_data = new Float32Array();

function Float32Concat(first:Float32Array, second:Float32Array) :Float32Array{
  var firstLength = first.length,
  result = new Float32Array(firstLength + second.length);

  result.set(first);
  result.set(second, firstLength);

  return result;
}

var sentence_state = -1;
//var sentence_end = false;
var last_end_time= 0;
var audio_start_time= 0;
var run_app_func : Object| null;
var gen_AI_response_func : Object| null;
var audio_counter = 0

async function append_audio(e:any){
  //console.log("append_audio sentence_state",sentence_state,is_auto_mode)
  if (!is_listening && !is_auto_mode || is_auto_mode && sentence_state==3){
    return
  }
  const inputBuffer = e.inputBuffer; // 获取输入的音频数据
  const pcmdata = e.inputBuffer.getChannelData(0)
  let pcmdata2 = new Float32Array();
  var len = pcmdata.length;
  var sum_v = 0;
  // 检查采样率是否大于16000Hz，并进行重采样
  if (inputBuffer.sampleRate > 16000) {
      //console.log("inputBuffer.sampleRate",inputBuffer.sampleRate)
      var ratio = inputBuffer.sampleRate / 16000;
      var newLength = Math.floor(pcmdata.length / ratio);
      pcmdata2 = new Float32Array(newLength);
      
      var next_i = 0;
      var diff = 0;
      var pcmdata2_i = 0;
      
      for (let i = 0; i < len; i++) {
        sum_v += Math.abs(pcmdata[i]);
        if (i < next_i){
          diff += pcmdata[i];
        }else{
          pcmdata2[pcmdata2_i] = pcmdata[i] + diff;
          if (pcmdata2_i<newLength){
            pcmdata2_i +=1;
          }else{
            break;
          }
          next_i = pcmdata2_i* ratio;
          diff = 0
        }
        // 进行简单的下采样，这里只是取样本点，没有使用复杂的滤波器
      }

  } else {
      // 如果采样率不高于16000Hz，则直接使用原数据
      pcmdata2 = pcmdata.slice();
      for (let i = 0; i < len; i++) {
        sum_v += Math.abs(pcmdata[i]);
      }
  }
  
  var avg_s = sum_v*32768/len;
  if(is_auto_mode){
    if( sentence_state==0){
      if(avg_s>1500){
        audio_counter ++ 
        if (audio_counter >=3){
          audio_start_time = new Date().getTime()
          sentence_state = 1
          audio_counter = 0 
          console.log("sentence_state",sentence_state)
          if(setBase64Frames_func!=null){
            //setBase64Frames_func([]);
            setBase64Frames_func((prevFrames) => {
              if (prevFrames.length > 3) {
                return prevFrames.slice(-3);
              } else {
                return prevFrames;
              }
             });
          }
        }
      }else{
        audio_counter = 0
      }
        
    }else if(sentence_state ==1){
      if(avg_s<1500){
        last_end_time = new Date().getTime()
        sentence_state = 2
        
        console.log("sentence_state",sentence_state)
      }
    }else if(sentence_state ==2){
      if(avg_s<1500){
        if(new Date().getTime() - last_end_time >1500 && new Date().getTime() - audio_start_time >3000 ){
          sentence_state = 3
          console.log("sentence_state",sentence_state)
          if(run_app_func!=null){
            await gen_AI_response_func(0)
            await run_app_func()
            sentence_state = 0
          }
        }
      }else{
        last_end_time = new Date().getTime()
      }
    }
  }


  audio_data = Float32Concat(audio_data, pcmdata2);

}
// 切换摄像头的函数
export async function switchCamera() {
    // 获取所有视频输入设备
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    console.log("videoDevices",videoDevices)
    if (videoDevices.length === 0) {
        throw new Error('没有找到摄像头设备');
    }

    let newDeviceId: string | undefined;


    if (currentIndex==-1){
      currentIndex = videoDevices.findIndex(device => device.label.toLowerCase().indexOf("back")!=-1);
    }
    if (currentIndex==-1){
      currentIndex = 0
    }else if(currentIndex + 1 < videoDevices.length){
      currentIndex +=1;
    } else{
      currentIndex = 0
    }
    newDeviceId = videoDevices[currentIndex].deviceId 
    //alert("选择id:"+newDeviceId)

    // 更新当前设备ID
    currentDeviceId = newDeviceId;
    console.log("currentDeviceId",currentDeviceId)

    var mediasetting = {
      audio: {
          deviceId: "default",
          sampleRate: 16000,
          sampleSize: 16,
          channelCount: 1
      },video:{ deviceId: { exact: currentDeviceId } }
    }
    if (currentDeviceId == ""){
      mediasetting.video = true
    }

    // 请求视频流
    const stream = await navigator.mediaDevices.getUserMedia(mediasetting);
    //videoRef = useRef<HTMLVideoElement | null>(null);
    if(videoRef)
    if (videoRef.current){
        // 将视频流绑定到视频元素上进行播放
        videoRef.current.srcObject = stream;
    }
    //console.log(stream)
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    console.log(source)
    sampleRate = source.context.sampleRate
    console.log("source.context.sampleRate",source.context.sampleRate)
    const processor = audioContext.createScriptProcessor(4096, 1, 1); // bufferSize, inputChannels, outputChannels
    source.connect(processor);
    processor.connect(audioContext.destination);

    // 处理音频数据
    processor.onaudioprocess = async function(e:any) {

      await append_audio(e)
    };
}


let audio_processor :Object |undefined;

export const SelectDesktop = async () => {
  var mediasetting = {
      audio: {
          deviceId: "default",
          sampleRate: 16000,
          sampleSize: 16,
          channelCount: 1
      },video:true
    }
  const stream = await navigator.mediaDevices.getDisplayMedia(mediasetting);
  
  // 处理获取的流，例如显示或进一步处理
  if(videoRef){
      if(videoRef.current){
          videoRef.current.srcObject = stream; 
          //alert("设置 desktop:")
      }
  }

  mediasetting = {
    audio: {
        deviceId: "default",
        sampleRate: 16000,
        sampleSize: 16,
        channelCount: 1
    },video:false
  }
  const stream2 = await navigator.mediaDevices.getUserMedia(mediasetting);

  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream2);
  audio_processor = audioContext.createScriptProcessor(4096, 1, 1); // bufferSize, inputChannels, outputChannels
  source.connect(audio_processor);
  audio_processor.connect(audioContext.destination);

  // 处理音频数据
  audio_processor.onaudioprocess = async function(e:any) {
      //const inputBuffer = e.inputBuffer; // 获取输入的音频数据
      await append_audio(e)
  };

};


//document.getElementById('switchCameraButton')?.addEventListener('click', switchCamera);
var inited_camera = false;
var is_runing = false;

const useApp = () => {
  // Ref for the video element
  videoRef = useRef<HTMLVideoElement | null>(null);

  const { speak, isSpeaking } = useSpeech();
  const [listening,setListening] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);

  // State variables for loading state, recording state, and storing base64 frames
  const [isLoading, setIsLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [countinueMode, setCountinueMode] = useState(false);
  
  const [response, setResponse] = useState("");
  const [base64Frames, setBase64Frames] = useState<
    { mimeType: string; data: string }[]
  >([]);

  setBase64Frames_func = setBase64Frames
  var transcript = "";

  // Variable to store the interval for capturing frames
  let frameInterval: NodeJS.Timeout;

  // Function to start speech recognition
  const handleListing = () => {
    SpeechRecognition.startListening({
      continuous: false,
    });
  };

  // Function to stop speech recognition
  const stopHandle = () => {
    SpeechRecognition.stopListening();
  };

  // Function to reset speech recognition transcript
  const handleReset = () => {
    stopHandle();
    //resetTranscript();
  };

  // Function to run the application, capturing frames and starting speech recognition
  const runApp = () => {
    console.log("=========== runApp ===========")
    audio_data = new Float32Array();
    sentence_state = 0;
    //annyang.abort();
    //handleReset();
    setIsLoading(false);
    //setResponse("");
    setBase64Frames([]);
    audio_data = new Float32Array();

    frameInterval = setInterval(() => {
      //console.log("frameInterval  ",frameInterval)
      if (videoRef.current && (is_listening&& !is_auto_mode || is_auto_mode )) {
        // Create a canvas to capture frames from the video
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext("2d");
        if (context) {
          // Draw the current video frame on the canvas
          context.drawImage(
            videoRef.current,
            0,
            0,
            canvas.width,
            canvas.height
          );
          // Convert the frame to base64 format and add it to the frames array
          const base64Frame = canvas.toDataURL("image/jpeg");
          let [mimeType, data] = base64Frame.split(";base64,");
          mimeType = mimeType.split(":")[1];
          setBase64Frames((prevFrames) => [...prevFrames, { mimeType, data }]);

          setBase64Frames((prevFrames) => {
            if (prevFrames.length > 120) {
              return prevFrames.slice(-120);
            } else {
              return prevFrames;
            }
           });

          //console.log("setBase64Frames")
        }
      }
    }, 1000);
  };

  run_app_func = runApp;

  function dataViewToBase64(dataView:DataView) {
      // 获取 ArrayBuffer
      const buffer = dataView.buffer;

      // 创建一个 Uint8Array
      const uint8Array = new Uint8Array(buffer);

      // 将 Uint8Array 转换为二进制字符串
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
      }

      // 使用 btoa 转换二进制字符串到 Base64
      const base64 = btoa(binaryString);

      return base64;
  }

  async function get_AI_response(frameInterval:any){
    is_runing = true;
    const interval_id = window.setInterval(function(){}, Number.MAX_SAFE_INTEGER);

    // Clear any timeout/interval up to that id
    for (let i = 1; i < interval_id; i++) {
      window.clearInterval(i);
    }
    console.log("============get_AI_response===============")
    //clearInterval(frameInterval);
    console.log("clearInterval ",frameInterval)
    const wav_data = createWAVFileData(audio_data,16000,16)

    audio_data = new Float32Array();
    // console.log(base64Data); // 输出 base64 编码的数据
    var base64Data = dataViewToBase64(wav_data)
    if(base64Data.length< 50000){
      is_runing = false
      return 
    }
    //setIsLoading(true);
    console.log("base64Data.length",base64Data.length);  // 输出 Base64 编码字符串

    
    setResponse("The AI ​​is replying. . .")
    
    await makeGeminiRequest(
      transcript,
      base64Frames,
      setResponse,
      speak,
      setIsLoading,
      {mimeType:"audio/wav",data:base64Data},
      countinueMode
    );
    //SpeechRecognition.stopListening();
    audio_data = new Float32Array();
    is_runing = false;
  }

  gen_AI_response_func = get_AI_response;

  useEffect(() => {
    is_listening = listening;
    if(autoMode){
      return
    }
    if (!listening){
      get_AI_response(frameInterval)
    }else{
      setResponse("Listening. . .")
      runApp();
    }

  }, [listening]);


  // Effect to handle changes in the listening state
  useEffect(() => {
    if(!autoMode){
      return
    }
    console.log("useEffect 1","autoMode",autoMode,"listening",listening,"is_runing",is_runing,"sentence_state",sentence_state)


  }, [sentence_state]);



  // Effect to initialize the camera and set up speech recognition commands
  useEffect(() => {
    // Function to initialize the camera
    const initializeCamera = async () => {
      try {

        switchCamera();

      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    if(!inited_camera){
      inited_camera = true
      // Initialize the camera
      initializeCamera();
    }

    //console.log("use effect , sentence_state",sentence_state)

    is_auto_mode = autoMode;
    if(!autoMode){
      const interval_id = window.setInterval(function(){}, Number.MAX_SAFE_INTEGER);

      // Clear any timeout/interval up to that id
      for (let i = 1; i < interval_id; i++) {
        window.clearInterval(i);
      }
      return
    }

    runApp();

    return () => {
    
    };
  }, [autoMode]);

  // Return the state variables and video reference for external use
  return {
    videoRef,
    isLoading,
    listening,
    response,
    base64Frames,
    autoMode,
    setAutoMode,
    setListening,
    setIsFrontCamera,
    isFrontCamera,
    countinueMode,
    setCountinueMode
  };
};

// Export the custom hook for use in other components
export default useApp;

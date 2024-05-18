
import { useEffect, useRef, useState } from "react";
import {videoRef,SelectDesktop} from "@/hooks/useApp"

function MediaSelector() {
    useEffect(() => {
        async function getDevices() {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setCameraList(videoDevices.map(device => ({ id: device.deviceId, label: device.label })));
        }
        getDevices();
       }, []);

    const handleSelectDesktop = async () => {
        var mediasetting = {
            audio: {
                deviceId: "default",
                sampleRate: 16000,
                sampleSize: 16,
                channelCount: 1
            },video:true
          }
        const stream = await navigator.mediaDevices.getDisplayMedia(mediasetting);
        //let videoRef = useRef<HTMLVideoElement | null>(null);
        // 处理获取的流，例如显示或进一步处理
        if(videoRef){
            if(videoRef.current){
                videoRef.current.srcObject = stream; 
                //alert("设置 desktop:")
            }
        }
    };

    const selectCamera = async (id:string) => {
        //alert("选择id:"+id)
        //currentDeviceId = id;
        var mediasetting = {
          audio: {
              deviceId: "default",
              sampleRate: 16000,
              sampleSize: 16,
              channelCount: 1
          },video:{ deviceId: { exact: id } }
        }
        // 请求视频流
        const stream = await navigator.mediaDevices.getUserMedia(mediasetting);
        //let videoRef = useRef<HTMLVideoElement | null>(null);
        if(videoRef)
        if (videoRef.current){
            // 将视频流绑定到视频元素上进行播放
            videoRef.current.srcObject = stream;
        }
    };

    const [cameraList, setCameraList] = useState([]);
    
    // 其他代码...
    
    return (
      <div >
        <h3>选择摄像头:</h3>
        <select style={{color:"#000"}} onChange={(e) => selectCamera(e.target.value)} >
          {cameraList.map(camera => (
            <option key={camera.id} value={camera.id}>{camera.label}</option>
          ))}
        </select><br/>
        <button onClick={handleSelectDesktop}>选择桌面</button>
      </div>
    );
  }
export default MediaSelector;
import React,{useState,useEffect,useRef} from 'react';
import jsQR from 'jsqr';
import {apiFetch} from './utils/api';
import {logger} from './utils/logger';
import {useAuth} from './context/AuthContext';
import "./TicketValidation.css";

export default function TicketValidation(){
    const {user,loading}=useAuth();
    const [status,setStatus]=useState('Scanning...');
    const [information,setInformation]=useState('Point camera at QR code');
    const [resultType,setResultType]=useState('');

    const videoRef=useRef(null);
    const canvasRef=useRef(null);
    const animFrameRef=useRef(null);
    const streamRef=useRef(null);
    const cooldownRef=useRef(false);

    useEffect(() => {
        if(loading || !user)
            return;

        let stopped=false;

        async function startCamera(){
            try{
                if(!window.isSecureContext){
                    setStatus('Camera requires HTTPS');
                    setInformation('Open this page using HTTPS or localhost.');
                    return;
                }

                if(!navigator.mediaDevices?.getUserMedia){
                    setStatus('Camera not supported');
                    setInformation('This browser does not support camera access.');
                    return;
                }

                const stream=await navigator.mediaDevices.getUserMedia({
                    video:{
                        facingMode:{ideal:"environment"}
                    }
                });

                streamRef.current=stream;

                if(videoRef.current)
                    videoRef.current.srcObject=stream;

                animFrameRef.current=requestAnimationFrame(scanQRCode);
            }catch(error){
                logger.error('Camera Error',err);
                setStatus('Camera Error');
                setInformation('Camera permission was denied or unavailable.');
            }
        }

        function scanQRCode(){
            if(stopped)
                return;

            const video=videoRef.current;
            const canvas=canvasRef.current;

            if(!video || !canvas){
                animFrameRef.current=requestAnimationFrame(scanQRCode);
                return;
            }

            if(!cooldownRef.current && video.readyState===video.HAVE_ENOUGH_DATA){
                const ctx=canvas.getContext('2d');

                canvas.width=video.videoWidth;
                canvas.height=video.videoHeight;

                ctx.drawImage(video,0,0,canvas.width,canvas.height);

                const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
                const qrCode=jsQR(imageData.data,imageData.width,imageData.height);

                if(qrCode)
                    handleQRCode(qrCode.data);
            }

            animFrameRef.current=requestAnimationFrame(scanQRCode);
        }
        
        startCamera();

        return () => {
            stopped=true;

            if(animFrameRef.current)
                cancelAnimationFrame(animFrameRef.current);

            if(streamRef.current)
                streamRef.current.getTracks().forEach(track => track.stop());
        };
    },[loading,user]);

    async function handleQRCode(qrText){
        cooldownRef.current=true;

        try{
            setStatus('Checking ticket...');
            setInformation('Please wait.');

            const data=await apiFetch('/api/purchasedtickets/validate?token='+encodeURIComponent(qrText));

            showResult(
                data.status,
                data.title,
                buildTicketInfo(data)
            )
        }catch(err){
            logger.error('Failed to validate ticket',err);
            showResult(
                'invalid',
                'Validation Error',
                'Could not validate ticket. Please try again.'
            );
        }

        setTimeout(() => {
            setStatus('Scanning...');
            setInformation('Point camera at QR code');
            setResultType('');
            cooldownRef.current = false;
        },2500);
    }

    function showResult(type,title,info){
        setResultType(type);
        setStatus(title);
        setInformation(info);
    }

    function buildTicketInfo(data){
        if(!data.eventName && !data.ticketType)
            return data.message;

        return [
            data.message,
            data.eventName ? `Event: ${data.eventName}`:null,
            data.ticketType ? `Ticket Type: ${data.ticketType}`:null,
            data.usedAt && data.status==='already_used' ?
                `Used At: ${new Date(data.usedAt).toLocaleString()}`:
                null
        ].filter(Boolean).join('\n');
    }

    return(
        <div id='ticket_validation_container'>
            {loading ? (
                <div id="loading_anim"/>
            ):user && user.role!="Customer" ? (
                <>
                    <div id='camera_container'>
                        <video ref={videoRef} id='camera' autoPlay playsInline/>
                        <div id='scan_frame'/>
                    </div>
                    <div id="ticket_info_container" className={`align_column ${resultType}`}>
                        <span id="status">{status}</span>
                        <hr/>
                        <div id="ticket_info">{information}</div>
                    </div>
                    <canvas ref={canvasRef} id="canvas" hidden></canvas>
                </>
            ):(
                <div id="ticket_info_container" className={`align_column ${resultType}`}>
                    <span id="status">{user.role!="Customer" ? "Please sign in to validate tickets":"Not authorized to use this page"}</span>
                </div>
            )}
        </div>
    );
}
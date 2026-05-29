import React,{useState,useEffect,useRef} from 'react';
import { useSearchParams } from 'react-router-dom';
import jsQR from 'jsqr';
import {apiFetch} from './utils/api';
import {logger} from './utils/logger';
import {useAuth} from './context/AuthContext';
import './ValidatorExperience.css';
import "./TicketValidation.css";

export default function TicketValidation(){
    const {user,loading}=useAuth();
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('eventId');
    const [status,setStatus]=useState('Scanning...');
    const [information,setInformation]=useState(eventId ? 'Point camera at QR code for this event' : 'Point camera at QR code');
    const [resultType,setResultType]=useState('');
    const isResultVisible = resultType !== '';

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

            const validateUrl = new URL('/api/purchasedtickets/validate', window.location.origin);
            validateUrl.searchParams.set('token', qrText);
            if (eventId) {
                validateUrl.searchParams.set('eventId', eventId);
            }

            const data=await apiFetch(validateUrl.pathname + validateUrl.search);

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
        <div id='ticket_validation_container' className="validator-scanner-shell">
            <div className="validator-scanner-header">
                <div className="validator-scanner-header__title">
                    <strong>Ticket Scanner</strong>
                    <span>{eventId ? 'Event-specific scanning is enabled' : 'General scanning mode'}</span>
                </div>
                <div className="validator-scanner-header__pill">
                    {eventId ? 'Scanning this event only' : 'No event selected'}
                </div>
            </div>

            {loading ? (
                <div id="loading_anim"/>
            ):user && (user.role==="Manager" || user.role==="Validator" || user.role==="SuperAdmin") ? (
                <>
                    <div id='camera_container' className="validator-scanner-camera">
                        <video ref={videoRef} id='camera' autoPlay playsInline/>
                        <div id='scan_frame'/>
                    </div>
                    {isResultVisible && (
                        <div className="validator-scanner-result-overlay">
                            <div id="ticket_info_container" className={`validator-scanner-panel validator-scanner-panel--popup align_column ${resultType}`}>
                                <div className="validator-scanner-panel__header">
                                    <span className="validator-scanner-panel__badge">{resultType === 'valid' ? 'Confirmed' : resultType === 'already_used' ? 'Already scanned' : 'Scan failed'}</span>
                                    <span className="validator-scanner-panel__status" id="status">{status}</span>
                                </div>
                                <div className="validator-scanner-panel__message" id="ticket_info">{information}</div>
                            </div>
                        </div>
                    )}
                    <canvas ref={canvasRef} id="canvas" hidden></canvas>
                </>
            ):(
                <div id="ticket_info_container" className={`align_column ${resultType}`}>
                    <span id="status">Please sign in into authorized account to validate tickets</span>
                </div>
            )}
        </div>
    );
}
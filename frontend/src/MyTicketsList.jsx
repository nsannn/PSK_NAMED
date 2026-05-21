import React,{useState,useEffect,useRef} from 'react';
import QRCode from 'qrcode';
import {apiFetch} from './utils/api';
import {useAuth} from './context/AuthContext';
import "./MyTicketsList.css";

export default function MyTicketsList(){
    const {user,loading}=useAuth();

    const [ticketGroups,setTicketGroups]=useState([]);
    const [statusFilter,setStatusFilter]=useState('all');
    const [openGroups,setOpenGroups]=useState({});
    const [selectedTicket,setSelectedTicket]=useState(null);
    const [isQRClosing,setIsQRClosing]=useState(true);
    const qrCanvasRef=useRef(null);

    useEffect(() => {
        if(loading || !user)
            return;

        async function loadTickets(){
            const data=await apiFetch('/api/purchasedtickets');
            setTicketGroups(data);
            console.log(data)
        }

        loadTickets();
    },[loading,user]);

    useEffect(() => {
        if(!selectedTicket || !qrCanvasRef.current)
            return;

        QRCode.toCanvas(qrCanvasRef.current,selectedTicket.qrToken,{
            width:260,
            margin:2,
            color:{
                dark:'#101010',
                light:'#ffffff'
            }
        });
    },[selectedTicket]);

    function toggleTicketGroup(eventId){
        setOpenGroups(prev => ({
            ...prev,
            [eventId]: !prev[eventId]
        }));
    }

    async function openQRCodeWindow(ticket){
        const data=await apiFetch(`/api/purchasedtickets/${ticket.purchasedTicketId}`);

        setSelectedTicket({
            ...ticket,
            qrToken: data.qrToken
        });
        setTimeout(() => {
            setIsQRClosing(false);
        },20)
    }

    function closeQRCodeWindow(){
        setIsQRClosing(true);

        setTimeout(() => {
            setSelectedTicket(null);
        },200)
    }

    const filteredTicketGroup=ticketGroups.map(group => ({
        ...group,
        tickets: group.tickets.filter(ticket => {
            if(statusFilter==='all')
                return true;

            return ticket.status.toLowerCase()===statusFilter;
        })
    })).filter(group => group.tickets.length>0);

    return(
        <div id="my_tickets_container">
            {loading ? (
                <div id="loading_anim"/>
            ):user ? (
                <>
                    {selectedTicket && (
                        <>
                            <div id="transparent_panel" className={isQRClosing ? 'closing':'open'} onClick={closeQRCodeWindow}></div>
                            <div id="qr_code_window" className={isQRClosing ? 'closing':'open'}>
                                <div id="qr_code">
                                    <canvas ref={qrCanvasRef}></canvas>
                                </div>
                                <button onClick={closeQRCodeWindow}>Close</button>
                            </div>
                        </>
                    )}
                    <div id="my_tickets_card" className="align_column">
                        <span id="my_tickets_card_name">Tickets</span>
                        <hr/>
                        <button id="my_tickets_option" className={statusFilter==='all' ? 'selected':''} onClick={() => setStatusFilter('all')}>All</button>
                        <button id="my_tickets_option" className={statusFilter==='active' ? 'selected':''} onClick={() => setStatusFilter('active')}>Active</button>
                        <button id="my_tickets_option" className={statusFilter==='used' ? 'selected':''} onClick={() => setStatusFilter('used')}>Used</button>
                        <button id="my_tickets_option" className={statusFilter==='refunded' ? 'selected':''} onClick={() => setStatusFilter('refunded')}>Refunded</button>
                    </div>
                    <div id="my_tickets_group_list" className="align_column">
                        {filteredTicketGroup.length===0 ? (
                            <span id="my_tickets_message">No tickets found</span>
                        ):
                        filteredTicketGroup.map(group => (
                            <div key={group.eventId} id="my_tickets_group">
                                <div id="my_tickets_group_info">
                                    <div id="my_tickets_group_info_text" className="align_column">
                                        <span>{group.eventName}</span>
                                        <div id="my_tickets_group_info_details">
                                            <span>{new Date(group.eventDate).toLocaleString()}</span>
                                            <span>{group.tickets.length} ticket(s)</span>
                                        </div>
                                    </div>
                                    <button onClick={() => toggleTicketGroup(group.eventId)}>
                                        {openGroups[group.eventId] ? 'Hide' : 'Show'} Tickets
                                    </button>
                                </div>
                                <div id="my_tickets_ticket_list" className={`align_column ${openGroups[group.eventId] ? 'open_group_tickets':''}`}>
                                    {group.tickets.map(ticket => (
                                        <div key={ticket.purchasedTicketId} id="my_tickets_ticket">
                                            <span>{ticket.ticketType}</span>
                                            <span>Status: {ticket.status}</span>
                                            {ticket.status != "Refunded" && (
                                                <button onClick={() => openQRCodeWindow(ticket)}>Show QR Code</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ):(
                <span id="status">Please sign in to view your tickets</span>
            )}
        </div>
    );
}
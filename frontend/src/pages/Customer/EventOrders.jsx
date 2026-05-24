import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import './EventOrders.css';
import '../../main.css';

function EventOrders() {
    const { id } = useParams();
    const [orders, setOrders] = useState([]);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refundModal, setRefundModal] = useState({ show: false, orderId: null });
    const [refundAllModal, setRefundAllModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchOrdersAndEvent = async () => {
            try {
                const evData = await apiFetch(`/api/events/${id}`);
                setEvent(evData);

                const ordersData = await apiFetch(`/api/orders/event/${id}`);
                setOrders(ordersData);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching orders:", err);
                setError("Could not load orders. Make sure you are authorized.");
                setLoading(false);
            }
        };

        fetchOrdersAndEvent();
    }, [id]);

    const handleRefund = async () => {
        setActionLoading(true);
        try {
            await apiFetch(`/api/orders/${refundModal.orderId}/refund`, {
                method: 'POST'
            });
            setOrders(prev => prev.map(o => o.id === refundModal.orderId ? { ...o, status: 'Refunded' } : o));
            setRefundModal({ show: false, orderId: null });
        } catch (err) {
            console.error(err);
            alert("Refund failed.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRefundAll = async () => {
        setActionLoading(true);
        try {
            await apiFetch(`/api/orders/event/${id}/refund-all`, {
                method: 'POST'
            });
            setOrders(prev => prev.map(o => o.status === 'Paid' ? { ...o, status: 'Refunded' } : o));
            setRefundAllModal(false);
        } catch (err) {
            console.error(err);
            alert("Refund All failed.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="page-loading">Loading orders...</div>;
    if (error) return <div className="page-loading" style={{color: 'red'}}>{error}</div>;

    const paidOrders = orders.filter(o => o.status === 'Paid');

    return (
        <>
            {refundModal.show && (
                <>
                    <div id="transparent_panel" style={{ display: 'block', opacity: 0.5 }} onClick={() => setRefundModal({show: false, orderId: null})}></div>
                    <div id="delete_confirmation_window" className="align_column" style={{ display: 'flex', opacity: 1, zIndex: 1000}}>
                        <span id="window_name">Confirm Refund</span>
                        <hr style={{width: '100%'}}/>
                        <span id="window_info">Are you sure you want to refund this order?</span>
                        <div id="delete_controls" className="align_row">
                            <button onClick={() => setRefundModal({show: false, orderId: null})}>Cancel</button>
                            <button onClick={handleRefund} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {refundAllModal && (
                <>
                    <div id="transparent_panel" style={{ display: 'block', opacity: 0.5 }} onClick={() => setRefundAllModal(false)}></div>
                    <div id="delete_confirmation_window" className="align_column" style={{ display: 'flex', opacity: 1, zIndex: 1000}}>
                        <span id="window_name">Confirm Wholesale Refund</span>
                        <hr style={{width: '100%'}}/>
                        <span id="window_info">Are you sure you want to refund ALL {paidOrders.length} paid orders? This action cannot be undone.</span>
                        <div id="delete_controls" className="align_row">
                            <button onClick={() => setRefundAllModal(false)}>Cancel</button>
                            <button onClick={handleRefundAll} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'Refund All'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="align_column" style={{ width: '100%', alignItems: 'center' }}>
                <div id="staff_main_row_part" style={{ width: '90%', marginTop: '2rem', justifyContent: 'space-between' }}>
                    <span id="staff_page_name">Orders: {event?.name || event?.title}</span>
                    <div className="align_row">
                        <Link to={`/event-details/${id}`} className="orders-link-btn">
                            Back to Details
                        </Link>
                        {paidOrders.length > 0 && (
                            <button className="refund-all-btn" onClick={() => setRefundAllModal(true)}>
                                Refund All Paid ({paidOrders.length})
                            </button>
                        )}
                    </div>
                </div>

                <div id="staff_main_row_part" style={{ width: '90%' }}>
                    <div id="staff_main_column_part" className="align_column" style={{ width: '100%' }}>
                        <div id="staff_info_card" className="align_column">
                            <table className="orders-table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Quantity</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th style={{textAlign: 'center'}}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="orders-empty-state">
                                                No orders found for this event yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map(order => (
                                            <tr key={order.id}>
                                                <td><b>{order.customerEmail}</b></td>
                                                <td>{order.quantity}</td>
                                                <td>€{order.amountPaid.toFixed(2)}</td>
                                                <td>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                                <td>
                                                    <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td style={{textAlign: 'center'}}>
                                                    {order.status === 'Paid' && (
                                                        <button 
                                                            className="small-refund-btn"
                                                            onClick={() => setRefundModal({ show: true, orderId: order.id })}
                                                        >
                                                            Refund
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default EventOrders;

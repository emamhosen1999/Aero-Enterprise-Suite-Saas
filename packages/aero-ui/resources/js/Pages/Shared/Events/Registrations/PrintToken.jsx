import React from 'react';
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';

const PrintToken = ({ registration, event }) => {
    React.useEffect(() => {
        // Auto-print when page loads
        window.print();
    }, []);
    
    return (
        <>
            <Head title={`Registration Token - ${registration.token}`} />
            
            <div className="min-h-screen bg-white p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Print-only styles */}
                    <style>{`
                        @media print {
                            body { margin: 0; padding: 20px; }
                            .no-print { display: none !important; }
                            .page-break { page-break-after: always; }
                        }
                        @page { size: A4; margin: 20mm; }
                    `}</style>
                    
                    {/* Token Card */}
                    <div className="border-4 border-primary rounded-2xl p-8 mb-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-primary mb-2">{event.title}</h1>
                            <p className="text-lg text-gray-600">Event Registration Token</p>
                        </div>
                        
                        {/* QR Code */}
                        <div className="flex justify-center mb-8">
                            {registration.qr_code ? (
                                <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
                                    <img 
                                        src={`/storage/${registration.qr_code}`}
                                        alt="QR Code"
                                        className="w-48 h-48"
                                    />
                                </div>
                            ) : (
                                <div className="w-48 h-48 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                                    <p className="text-gray-400 text-sm">QR Code</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Token Number */}
                        <div className="text-center mb-8">
                            <p className="text-sm text-gray-600 mb-2">Registration Token</p>
                            <p className="text-5xl font-mono font-bold tracking-wider text-primary">
                                {registration.token}
                            </p>
                        </div>
                        
                        {/* Participant Details */}
                        <div className="border-t-2 border-gray-200 pt-6 mb-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Participant Name</p>
                                    <p className="text-lg font-semibold">{registration.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Email</p>
                                    <p className="text-lg font-semibold">{registration.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                                    <p className="text-lg font-semibold">{registration.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Registration Date</p>
                                    <p className="text-lg font-semibold">
                                        {dayjs(registration.created_at).format('MMM DD, YYYY')}
                                    </p>
                                </div>
                            </div>
                            
                            {registration.organization_or_department && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500 mb-1">Organization/Department</p>
                                    <p className="text-lg font-semibold">{registration.organization_or_department}</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Sub-Events */}
                        {registration.sub_events && registration.sub_events.length > 0 && (
                            <div className="border-t-2 border-gray-200 pt-6 mb-6">
                                <p className="text-sm text-gray-500 mb-3">Registered Sub-Events</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {registration.sub_events.map((subEvent, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </div>
                                            <span className="font-medium">{subEvent.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Event Details */}
                        <div className="border-t-2 border-gray-200 pt-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Event Date</p>
                                    <p className="text-lg font-semibold">
                                        {dayjs(event.event_date).format('MMMM DD, YYYY')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Event Time</p>
                                    <p className="text-lg font-semibold">{event.event_time}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500 mb-1">Venue</p>
                                    <p className="text-lg font-semibold">{event.venue}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Status */}
                        <div className="border-t-2 border-gray-200 pt-6 mt-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-green-700 mb-1">Registration Status</p>
                                <p className="text-2xl font-bold text-green-800 uppercase">{registration.status}</p>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="border-t-2 border-gray-200 pt-6 mt-6 text-center">
                            <p className="text-sm text-gray-500">
                                Please bring this token on the event day for verification
                            </p>
                            {event.organizer_phone && (
                                <p className="text-sm text-gray-500 mt-2">
                                    For queries, contact: {event.organizer_phone}
                                    {event.organizer_email && ` | ${event.organizer_email}`}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {/* Print Button (hidden when printing) */}
                    <div className="text-center mt-8 no-print">
                        <button
                            onClick={() => window.print()}
                            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                        >
                            Print Token
                        </button>
                        <button
                            onClick={() => window.close()}
                            className="ml-4 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PrintToken;
